using System.Text;
using System.Text.Json;
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

// Load the agenda-generator skill at startup — try multiple paths
var skillPath = Path.Combine(app.Environment.ContentRootPath, "Skills", "agenda-generator", "SKILL.md");
if (!File.Exists(skillPath))
{
    skillPath = Path.Combine(app.Environment.ContentRootPath, "..", "..", ".claude", "skills", "agenda-generator", "SKILL.md");
}
if (!File.Exists(skillPath))
{
    skillPath = Path.Combine(Directory.GetCurrentDirectory(), "..", ".claude", "skills", "agenda-generator", "SKILL.md");
}
var skillContent = File.Exists(skillPath)
    ? await File.ReadAllTextAsync(skillPath)
    : "Generate a structured 30-minute mentorship agenda with time-labelled blocks: [00:00-02:00] Check-in, then three question blocks, ending with [28:00-30:00] Goal-setting.";

var httpClient = new HttpClient();
var apiKey = Environment.GetEnvironmentVariable("ANTHROPIC_API_KEY")
             ?? builder.Configuration["ANTHROPIC_API_KEY"]
             ?? "";

// POST /agenda
app.MapPost("/agenda", async (AgendaRequest request) =>
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

    // Build Claude prompt
    var userMessage = $"""
        Track: {request.Track}
        Mentor: {mentorName}
        Questions:
        1. {q1}
        2. {q2}
        3. {q3}

        Generate a 30-minute session agenda following the rules strictly.
        """;

    var payload = new
    {
        model = "claude-sonnet-4-6",
        max_tokens = 1500,
        system = skillContent,
        messages = new[]
        {
            new { role = "user", content = userMessage }
        }
    };

    var httpRequest = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages")
    {
        Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json")
    };
    httpRequest.Headers.Add("x-api-key", apiKey);
    httpRequest.Headers.Add("anthropic-version", "2023-06-01");

    try
    {
        var response = await httpClient.SendAsync(httpRequest);
        var responseBody = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
            return Results.Problem(
                detail: responseBody,
                statusCode: (int)response.StatusCode);

        using var doc = JsonDocument.Parse(responseBody);
        var content = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString() ?? "Agenda could not be generated.";

        return Results.Ok(new AgendaResponse(content, request.Track, mentorName));
    }
    catch (HttpRequestException ex)
    {
        return Results.Problem(detail: $"Failed to reach Claude API: {ex.Message}", statusCode: 502);
    }
});

app.Run();

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
    var shorter = a.Length < b.Length ? a : b;
    var longer = a.Length < b.Length ? b : a;
    var common = shorter.Count(c => longer.Contains(c, StringComparison.OrdinalIgnoreCase));
    return (double)common / longer.Length > 0.7;
}
