namespace GuidedUp.Api.Models;

public record Booking
{
    public int Id { get; init; }
    public int MenteeProfileId { get; init; }
    public int MentorProfileId { get; init; }
    public DateTime SlotStart { get; init; }        // UTC
    public DateTime SlotEnd { get; init; }          // UTC
    public BookingStatus Status { get; init; } = BookingStatus.Confirmed;
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

public enum BookingStatus { Confirmed, Completed, Cancelled }

public record Goal
{
    public int Id { get; init; }
    public int BookingId { get; init; }
    public string Description { get; init; } = "";
    public bool IsDone { get; init; }
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}

// University-specific tracker
public record SchoolTarget
{
    public int Id { get; init; }
    public int ProfileId { get; init; }
    public string SchoolName { get; init; } = "";
    public string Country { get; init; } = "";
    public string Major { get; init; } = "";
    public DateTime? Deadline { get; init; }
    public SchoolStatus Status { get; init; } = SchoolStatus.Researching;
}

public enum SchoolStatus { Researching, Drafting, Submitted, Accepted, Rejected }
