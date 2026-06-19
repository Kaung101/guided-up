# profile-validator

Validate that a mentee's session prep input is complete and well-formed
before generating an agenda. Run this agent whenever a mentee submits the
prep form.

## Validation Rules

### Track
- Must be one of: `career` or `university`
- Reject anything else with a clear error message

### Mentor Name
- Must be present (non-empty after trimming whitespace)
- Must be at least 2 characters
- Must be at most 100 characters
- Must contain only letters, spaces, hyphens, and periods
  (allow Myanmar Unicode range: U+1000–U+109F)

### Questions (3 required)
- All three questions (`question1`, `question2`, `question3`) must be present
- Each question must be non-empty after trimming whitespace
- Each question must be at least 10 characters (a real question, not "idk")
- Each question must be at most 500 characters
- Questions must be distinct from each other (fuzzy match: ≤70% similarity)

### Output Format

On success, return:
```json
{ "valid": true }
```

On failure, return:
```json
{
  "valid": false,
  "errors": ["<field>: <specific error message>"]
}
```

List every failing check — don't stop at the first error.
