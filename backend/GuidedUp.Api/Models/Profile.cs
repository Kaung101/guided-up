namespace GuidedUp.Api.Models;

public record Profile
{
    public int Id { get; init; }
    public string Track { get; init; } = "";       // "career" | "university"
    public string Role { get; init; } = "";         // "mentee" | "mentor"
    public string Name { get; init; } = "";
    public string? Bio { get; init; }
    public string Timezone { get; init; } = "Asia/Yangon"; // UTC+6:30
    public string Locale { get; init; } = "en";     // "en" | "mm"
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;

    // Career-specific
    public string? Industry { get; init; }
    public string? RoleLevel { get; init; }         // "junior" | "mid" | "senior" | "lead"
    public string? Specialism { get; init; }         // "job-search" | "promotion" | "stack"

    // University-specific
    public string? DestinationCountry { get; init; } // "thailand" | "japan" | "singapore" | "us" | "australia"
    public string? TargetMajor { get; init; }
    public bool HasScholarshipExperience { get; init; }

    // Mentor-only
    public List<TimeSlot>? Availability { get; init; }
    public string? Company { get; init; }
    public string? University { get; init; }
}

public record TimeSlot
{
    public DayOfWeek Day { get; init; }
    public TimeSpan Start { get; init; }  // UTC
    public TimeSpan End { get; init; }    // UTC
}

public record MentorFilter
{
    public string Track { get; init; } = "career";
    // Career filters
    public string? Industry { get; init; }
    public string? RoleLevel { get; init; }
    public string? Specialism { get; init; }
    // University filters
    public string? DestinationCountry { get; init; }
    public string? TargetMajor { get; init; }
    public bool? HasScholarshipExperience { get; init; }
}
