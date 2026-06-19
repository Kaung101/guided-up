<!-- ch-3 personal-project report. Copy this file to ch-3/<your-github-username>/report.md -->
<!-- Before you pass: your project repo needs at least 3 GitHub stars (ask teammates
     to open your repo and click ⭐). This proves it is a real, shared project. -->
# ch-3 Personal Project — Report

github_username: Kaung101
personal_repo_url: https://github.com/Kaung101/guided-up
project_summary: AI-powered mentorship session prep — mentees submit 3 questions, Claude generates a structured 30-minute agenda so every call starts with a real plan.
slides_url: slides.md

## Methodology
<!-- How you worked: project-based approach + your git workflow (commit as you build). 2-4 sentences. -->

I used a project-based approach: started with the proposal document to define scope,
then built incrementally with frequent commits — each one representing a logical step
(scaffold, skill, agent, backend, frontend, slides, report). Claude Code was used
throughout for file creation, validation logic, and the agenda-generator skill
definition. Context7 was used during backend development to reference up-to-date
.NET 8 Minimal API documentation.

## Evidence — Claude Code usage
<!-- List the ACTUAL paths in your personal repo. The validator checks these exist. -->

### MCP
- path: .mcp.json
- what: Three MCP servers — `fetch` (live API testing during dev), `filesystem` (reading and editing project files inside Claude Code), `context7` (fetching up-to-date .NET 8 and React docs on demand)

### Skill
- path: .claude/skills/agenda-generator/SKILL.md
- what: Rules for Claude to generate a structured 30-minute mentorship agenda — time-labelled blocks from [00:00–02:00] check-in through three question blocks to [28:00–30:00] goal-setting, with per-question time allocation, mentor talking points, and track-specific tone (career vs university)

### Agent
- path: .claude/agents/profile-validator.md
- what: Validates that track (career/university), mentor name (length, characters, Myanmar Unicode), and all 3 questions (length, distinctness) are complete and well-formed before agenda generation — returns structured errors for every failing check
