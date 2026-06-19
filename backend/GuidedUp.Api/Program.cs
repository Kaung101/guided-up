using System.Collections.Concurrent;
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

if (!app.Environment.IsDevelopment())
{
    app.UseDefaultFiles();
    app.UseStaticFiles();
}

if (app.Environment.IsDevelopment())
{
    app.UseCors();
}

// --- In-memory store ---
var profiles = new ConcurrentDictionary<int, Profile>();
var bookings = new ConcurrentDictionary<int, Booking>();
var goals = new ConcurrentDictionary<int, Goal>();
var schoolTargets = new ConcurrentDictionary<int, SchoolTarget>();
int _nextProfileId = 1, _nextBookingId = 1, _nextGoalId = 1, _nextSchoolId = 1;

// Seed a few mentors so discovery works out of the box
SeedMentors(profiles, ref _nextProfileId);

// ============================================================
// PROFILE endpoints
// ============================================================

// POST /profiles — create a new profile
app.MapPost("/profiles", (Profile p) =>
{
    var errors = ValidateProfile(p);
    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    p = p with { Id = Interlocked.Increment(ref _nextProfileId), CreatedAt = DateTime.UtcNow };
    profiles[p.Id] = p;
    return Results.Ok(p);
});

// GET /profiles/{id}
app.MapGet("/profiles/{id:int}", (int id) =>
    profiles.TryGetValue(id, out var p) ? Results.Ok(p) : Results.NotFound());

// GET /profiles?track=career — search profiles for login
app.MapGet("/profiles", (string? track) =>
{
    var results = profiles.Values.AsEnumerable();
    if (!string.IsNullOrEmpty(track))
        results = results.Where(p => p.Track == track);
    return Results.Ok(results.ToList());
});

// GET /mentors?track=career&industry=tech&specialism=stack
app.MapGet("/mentors", (string? track, string? industry, string? roleLevel,
                         string? specialism, string? destinationCountry,
                         string? targetMajor, bool? hasScholarshipExperience) =>
{
    var results = profiles.Values.Where(p => p.Role == "mentor");

    if (!string.IsNullOrEmpty(track))
        results = results.Where(p => p.Track == track);
    if (!string.IsNullOrEmpty(industry))
        results = results.Where(p => p.Industry == industry);
    if (!string.IsNullOrEmpty(roleLevel))
        results = results.Where(p => p.RoleLevel == roleLevel);
    if (!string.IsNullOrEmpty(specialism))
        results = results.Where(p => p.Specialism == specialism);
    if (!string.IsNullOrEmpty(destinationCountry))
        results = results.Where(p => p.DestinationCountry == destinationCountry);
    if (!string.IsNullOrEmpty(targetMajor))
        results = results.Where(p => p.TargetMajor == targetMajor);
    if (hasScholarshipExperience.HasValue)
        results = results.Where(p => p.HasScholarshipExperience == hasScholarshipExperience.Value);

    return Results.Ok(results.ToList());
});

// ============================================================
// BOOKING endpoints
// ============================================================

// POST /bookings — create a booking (enforces 14-day rule per pair)
app.MapPost("/bookings", (Booking b) =>
{
    var errors = new List<string>();
    if (b.MenteeProfileId <= 0 || !profiles.ContainsKey(b.MenteeProfileId))
        errors.Add("menteeProfileId: invalid");
    if (b.MentorProfileId <= 0 || !profiles.ContainsKey(b.MentorProfileId))
        errors.Add("mentorProfileId: invalid");

    // 14-day rule: one active booking per pair per 14-day window
    var twoWeeksAgo = DateTime.UtcNow.AddDays(-14);
    var hasActive = bookings.Values.Any(bk =>
        bk.MenteeProfileId == b.MenteeProfileId &&
        bk.MentorProfileId == b.MentorProfileId &&
        bk.Status == BookingStatus.Confirmed &&
        bk.CreatedAt > twoWeeksAgo);

    if (hasActive)
        errors.Add("booking: you already have an active booking with this mentor within the last 14 days");

    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    b = b with { Id = Interlocked.Increment(ref _nextBookingId), CreatedAt = DateTime.UtcNow };
    bookings[b.Id] = b;
    return Results.Ok(b);
});

// GET /bookings?profileId=1
app.MapGet("/bookings", (int profileId) =>
    Results.Ok(bookings.Values
        .Where(b => b.MenteeProfileId == profileId || b.MentorProfileId == profileId)
        .ToList()));

// ============================================================
// GOAL endpoints
// ============================================================

// POST /goals
app.MapPost("/goals", (Goal g) =>
{
    g = g with { Id = Interlocked.Increment(ref _nextGoalId), CreatedAt = DateTime.UtcNow };
    goals[g.Id] = g;
    return Results.Ok(g);
});

// PATCH /goals/{id} — mark done
app.MapPatch("/goals/{id:int}", (int id, Goal update) =>
{
    if (!goals.TryGetValue(id, out var g)) return Results.NotFound();
    g = g with { IsDone = update.IsDone };
    goals[id] = g;
    return Results.Ok(g);
});

// GET /goals?bookingId=1
app.MapGet("/goals", (int bookingId) =>
    Results.Ok(goals.Values.Where(g => g.BookingId == bookingId).ToList()));

// ============================================================
// SCHOOL TARGET endpoints (university track)
// ============================================================

app.MapPost("/school-targets", (SchoolTarget s) =>
{
    s = s with { Id = Interlocked.Increment(ref _nextSchoolId) };
    schoolTargets[s.Id] = s;
    return Results.Ok(s);
});

app.MapGet("/school-targets", (int profileId) =>
    Results.Ok(schoolTargets.Values.Where(s => s.ProfileId == profileId).ToList()));

app.MapPatch("/school-targets/{id:int}", (int id, SchoolTarget update) =>
{
    if (!schoolTargets.TryGetValue(id, out var s)) return Results.NotFound();
    s = s with { Status = update.Status };
    schoolTargets[id] = s;
    return Results.Ok(s);
});

// ============================================================
// AGENDA endpoint (unchanged)
// ============================================================

app.MapPost("/agenda", (AgendaRequest request) =>
{
    var errors = new List<string>();

    if (string.IsNullOrWhiteSpace(request.Track) ||
        (request.Track != "career" && request.Track != "university"))
        errors.Add("track: must be 'career' or 'university'");

    var mentorName = request.MentorName?.Trim() ?? "";
    if (string.IsNullOrEmpty(mentorName))
        errors.Add("mentorName: required");
    else if (mentorName.Length < 2)
        errors.Add("mentorName: must be at least 2 characters");
    else if (mentorName.Length > 100)
        errors.Add("mentorName: must be at most 100 characters");

    var q1 = request.Question1?.Trim() ?? "";
    var q2 = request.Question2?.Trim() ?? "";
    var q3 = request.Question3?.Trim() ?? "";

    ValidateQuestion(q1, 1, errors);
    ValidateQuestion(q2, 2, errors);
    ValidateQuestion(q3, 3, errors);

    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    if (IsDuplicate(q1, q2) || IsDuplicate(q1, q3) || IsDuplicate(q2, q3))
        errors.Add("questions: must be distinct from each other");

    if (errors.Count > 0)
        return Results.BadRequest(new ValidationError(false, errors));

    var agenda = GenerateAgenda(request.Track, mentorName, q1, q2, q3);
    return Results.Ok(new AgendaResponse(agenda, request.Track, mentorName));
});

app.Run();

// ============================================================
// Helpers
// ============================================================

List<string> ValidateProfile(Profile p)
{
    var e = new List<string>();
    if (string.IsNullOrWhiteSpace(p.Track) || (p.Track != "career" && p.Track != "university"))
        e.Add("track: must be 'career' or 'university'");
    if (string.IsNullOrWhiteSpace(p.Role) || (p.Role != "mentee" && p.Role != "mentor"))
        e.Add("role: must be 'mentee' or 'mentor'");
    if (string.IsNullOrWhiteSpace(p.Name) || p.Name.Trim().Length < 2)
        e.Add("name: required (min 2 chars)");
    return e;
}

void SeedMentors(ConcurrentDictionary<int, Profile> dict, ref int id)
{
    var mentors = new[]
    {
        new Profile { Id = id++, Track = "career", Role = "mentor", Name = "Su Myat Noe", Industry = "tech", RoleLevel = "senior", Specialism = "stack", Bio = "Senior engineer at a Yangon fintech. 7 years across Python, React, and Go.", Company = "WaveMoney" },
        new Profile { Id = id++, Track = "career", Role = "mentor", Name = "Kyaw Zaw", Industry = "tech", RoleLevel = "lead", Specialism = "promotion", Bio = "Engineering lead who went from junior to manager in 5 years. Knows how to navigate promotions in Myanmar tech.", Company = "KBZ" },
        new Profile { Id = id++, Track = "career", Role = "mentor", Name = "May Thu", Industry = "design", RoleLevel = "mid", Specialism = "job-search", Bio = "UX designer who landed roles at 3 companies in 2 years. Knows portfolios, interviews, and how to stand out.", Company = "Oway" },
        new Profile { Id = id++, Track = "university", Role = "mentor", Name = "Aye Chan", DestinationCountry = "thailand", TargetMajor = "Computer Science", HasScholarshipExperience = true, Bio = "Studied CS at Chula on a full scholarship. Helped 5+ students through Thai university applications.", University = "Chulalongkorn University" },
        new Profile { Id = id++, Track = "university", Role = "mentor", Name = "Nilar Htun", DestinationCountry = "japan", TargetMajor = "Engineering", HasScholarshipExperience = true, Bio = "MEXT scholar at Tokyo Tech. Knows the Japanese application cycle inside and out.", University = "Tokyo Tech" },
        new Profile { Id = id++, Track = "university", Role = "mentor", Name = "Min Thu", DestinationCountry = "us", TargetMajor = "Business", HasScholarshipExperience = false, Bio = "Self-funded undergrad at Arizona State. Can help with essays, SAT prep strategy, and US admissions fit.", University = "Arizona State University" },
    };
    foreach (var m in mentors) dict[m.Id] = m;
}

// --- Agenda Generator ---

string GenerateAgenda(string track, string mentor, string q1, string q2, string q3)
{
    var questions = new[] { q1, q2, q3 };
    var totalChars = questions.Sum(q => q.Length);
    totalChars = totalChars == 0 ? 3 : totalChars;

    var allocs = questions.Select(q => (int)Math.Round(26.0 * q.Length / totalChars)).ToArray();
    var diff = 26 - allocs.Sum();
    allocs[0] += diff;

    var tone = track == "career"
        ? "professional, direct, outcome-oriented"
        : "supportive, encouraging, process-oriented";

    var toneNotes = track == "career"
        ? new[] {
            "Discuss current role and career stage",
            "Identify what specific outcome the mentee wants",
            "Share relevant personal experience if applicable",
            "Identify actionable steps the mentee can take",
            "Point to concrete resources, tools, or people",
            "Suggest how to measure progress",
            "Discuss long-term trajectory based on this topic",
            "Address common pitfalls or misconceptions",
            "Recommend one thing to try before the next session"
        }
        : new[] {
            "Understand the mentee's academic background and target schools",
            "Clarify what's the biggest uncertainty right now",
            "Share what worked when you applied",
            "Walk through the specific application step the mentee is stuck on",
            "Review relevant deadlines and requirements",
            "Point to helpful resources (essay guides, scholarship lists)",
            "Discuss how this fits into the bigger application timeline",
            "Address common mistakes applicants make here",
            "Suggest one concrete action the mentee can take this week"
        };

    var sb = new StringBuilder();
    var goal = track == "career" ? "Career growth" : "University application guidance";
    sb.AppendLine("## 30-Minute Session Agenda");
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

    sb.AppendLine("[00:00–02:00] Check-in — Quick intro, mentee shares current context");
    sb.AppendLine($"  • Tone: {tone}");
    sb.AppendLine();
    foreach (var block in blocks) sb.AppendLine(block);
    sb.AppendLine("[28:00–30:00] Goal-setting — Mentee commits to one concrete next step");
    sb.AppendLine("  • What will the mentee do before the next session?");
    sb.AppendLine("  • How will they report back?");
    sb.AppendLine();
    sb.AppendLine("> After the session: update your GuidedUp goal tracker to mark this complete.");

    return sb.ToString().TrimEnd();
}

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
