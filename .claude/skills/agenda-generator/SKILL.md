# agenda-generator

Generate a structured 30-minute mentorship session agenda from a mentee's
prep questions. Use this skill whenever the `/agenda` endpoint needs to
produce a session plan.

## Rules

1. Always produce a time-labelled agenda in this exact format:

```
## 30-Minute Session Agenda

[00:00–02:00] Check-in — Quick intro, mentee shares current context
[02:00–XX:00] Question 1 — <restated question>
[XX:00–XX:00] Question 2 — <restated question>
[XX:00–28:00] Question 3 — <restated question>
[28:00–30:00] Goal-setting — Mentee commits to one concrete next step
```

2. Time allocation:
   - Check-in block is ALWAYS [00:00–02:00]
   - Goal-setting block is ALWAYS [28:00–30:00]
   - The remaining 26 minutes are distributed across the 3 questions
     proportionally to question complexity. A one-line question gets
     ~6-7 minutes; a multi-paragraph question with context gets ~10-12 min.
   - All times must add up exactly to 30:00 with no gaps or overlaps.

3. For each question block, include:
   - The restated question (rephrased clearly from the mentee's wording)
   - 2-3 bullet points of what the mentor should cover (specific, actionable)

4. Adapt tone to the track:
   - **Career** track: professional, direct, outcome-oriented
   - **University** track: supportive, encouraging, process-oriented

5. At the start of the agenda, include a one-line session summary:
   `**Session:** <track> mentorship — <mentorName> / <restated goal>`

6. At the end of the agenda, include a brief note:
   `> After the session: update your GuidedUp goal tracker to mark this complete.`
