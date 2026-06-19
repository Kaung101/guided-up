namespace GuidedUp.Api.Models;

public record ValidationError(
    bool Valid,
    List<string> Errors
);
