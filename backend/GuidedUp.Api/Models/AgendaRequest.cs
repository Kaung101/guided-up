namespace GuidedUp.Api.Models;

public record AgendaRequest(
    string Track,
    string MentorName,
    string Question1,
    string Question2,
    string Question3
);
