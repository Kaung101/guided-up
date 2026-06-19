using System.Linq;
using System.Text;
using GuidedUp.Api.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Production: serve the Vite-built frontend from wwwroot
if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

// Dev: allow Vite dev server on :5173 to call the backend
if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

// POST /agenda
app.MapPost("/agenda", (AgendaRequest request) =>
{
    var errors = new List<string>();

    // Track validation
    if (string.IsNullOrWhiteSpace(request.Track) ||
        (request.Track != "career" && request.Track != "university"))
        errors.Add("track: must be 'career' or 'university'");

    // Mentor name validation
    var mentorName = request.MentorName?.Trim() ?? "";
    if (string.IsNullOrEmpty(mentorName))
        errors.Add("mentorName: required");
    else if (mentorName.Length < 2)
        errors.Add("mentorName: must be at least 2 characters");
    else if (mentorName.Length > 100)
        errors.Add("mentorName: must be at most 100 characters");

    // Question validation
    var q1 = request.Question1?.Trim() ?? "";
    var q2 = request.Question2?.Trim() ?? "";
    var q3 = request.Question3?.Trim() ?? "";

    ValidateQuestion(q1, 1, errors);
    ValidateQuestion(q2, 2, errors);
    ValidateQuestion(q3, 3, errors);

    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    // Duplicate check
    if (IsDuplicate(q1, q2) || IsDuplicate(q1, q3) || IsDuplicate(q2, q3))
        errors.Add("questions: must be distinct from each other");

    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    var agenda = GenerateAgenda(request.Track, mentorName, q1, q2, q3);
    return Results.Ok(new AgendaResponse(agenda, request.Track, mentorName));
});

app.Run();

// --- Agenda Generator ---
// Follows the rules in .claude/skills/agenda-generator/SKILL.md exactly.
// No API key needed — the skill rules are implemented here directly.

string GenerateAgenda(string track, string mentor, string q1, string q2, string q3)
{
    var questions = new[] { q1, q2, q3 };
    var totalChars = questions.Sum(q => q.Length);
    totalChars = totalChars == 0 ? 3 : totalChars; // avoid div-by-zero

    // Allocate 26 minutes proportionally by question length
    var allocs = questions
        .Select(q => (int)Math.Round(26.0 * q.Length / totalChars))
        .ToArray();

    // Adjust so they sum to exactly 26
    var diff = 26 - allocs.Sum();
    allocs[0] += diff;

    var tone = track == "career"
        ? "professional, direct, outcome-oriented"
        : "supportive, encouraging, process-oriented";

    var toneNotes = track == "career"
        ? new[] {
            // Question 1
            "Discuss current role and career stage",
            "Identify what specific outcome the mentee wants",
            "Share relevant personal experience if applicable",
            // Question 2
            "Identify actionable steps the mentee can take",
            "Point to concrete resources, tools, or people",
            "Suggest how to measure progress",
            // Question 3
            "Discuss long-term trajectory based on this topic",
            "Address common pitfalls or misconceptions",
            "Recommend one thing to try before the next session"
        }
        : new[] {
            // Question 1
            "Understand the mentee's academic background and target schools",
            "Clarify what's the biggest uncertainty right now",
            "Share what worked when you applied",
            // Question 2
            "Walk through the specific application step the mentee is stuck on",
            "Review relevant deadlines and requirements",
            "Point to helpful resources (essay guides, scholarship lists)",
            // Question 3
            "Discuss how this fits into the bigger application timeline",
            "Address common mistakes applicants make here",
            "Suggest one concrete action the mentee can take this week"
        };

    var sb = new StringBuilder();

    // Header
    var goal = track == "career" ? "Career growth" : "University application guidance";
    sb.AppendLine($"## 30-Minute Session Agenda");
    sb.AppendLine();
    sb.AppendLine($"**Session:** {track} mentorship — {mentor} / {goal}");
    sb.AppendLine();

    var start = 2;
    var blocks = new List<string>();

    for (var i = 0; i < 3; i++)
    {
        var end = start + allocs[i];
        blocks.Add($"[{start:D2}:00–{end:D2}:00] Question {i + 1} — {questions[i]}");
        blocks.Add($"  • {toneNotes[i * 3]}");
        blocks.Add($"  • {toneNotes[i * 3 + 1]}");
        blocks.Add($"  • {toneNotes[i * 3 + 2]}");
        blocks.Add("");
        start = end;
    }

    sb.AppendLine($"[00:00–02:00] Check-in — Quick intro, mentee shares current context");
    sb.AppendLine($"  • Tone: {tone}");
    sb.AppendLine();

    foreach (var block in blocks)
        sb.AppendLine(block);

    sb.AppendLine($"[28:00–30:00] Goal-setting — Mentee commits to one concrete next step");
    sb.AppendLine($"  • What will the mentee do before the next session?");
    sb.AppendLine($"  • How will they report back?");
    sb.AppendLine();
    sb.AppendLine($"> After the session: update your GuidedUp goal tracker to mark this complete.");

    return sb.ToString().TrimEnd();
}

// --- Helpers ---

void ValidateQuestion(string question, int index, List<string> errors)
{
    if (string.IsNullOrEmpty(question))
        errors.Add($"question{index}: required");
    else if (question.Length < 10)
        errors.Add($"question{index}: must be at least 10 characters (got {question.Length})");
    else if (question.Length > 500)
        errors.Add($"question{index}: must be at most 500 characters (got {question.Length})");
}

bool IsDuplicate(string a, string b)
{
    if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return false;
    var wordsA = ToLowerWords(a);
    var wordsB = ToLowerWords(b);

    var common = new HashSet<string>(wordsA, StringComparer.OrdinalIgnoreCase);
    common.IntersectWith(wordsB);

    var union = new HashSet<string>(wordsA, StringComparer.OrdinalIgnoreCase);
    union.UnionWith(wordsB);

    if (union.Count == 0) return false;
    return (double)common.Count / union.Count > 0.7;
}

HashSet<string> ToLowerWords(string s)
{
    var words = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    foreach (var word in s.Split(' ', StringSplitOptions.RemoveEmptyEntries))
    {
        var cleaned = new string(word.Where(char.IsLetterOrDigit).ToArray());
        if (cleaned.Length > 2) words.Add(cleaned);
    }
    return words;
}
