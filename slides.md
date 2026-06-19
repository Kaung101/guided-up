---
marp: true
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.
auto-advance: 20
---

<!-- slide 1 -->
# Who's my person?

Zaw Min — a junior software engineer in Yangon with no senior to learn from.

Thida — a grade 11 student in Mandalay with no university counsellor.

<!-- 20s -->

---

<!-- slide 2 -->
# Their problem

In Myanmar, mentorship means knowing the right person's uncle.

Cold LinkedIn messages go unanswered. Busy professionals don't volunteer
because there's no structure. Students apply abroad blind.

**Both sides show up to calls with no plan — just small talk.**

---

<!-- slide 3 -->
# What I built

GuidedUp — a session prep platform that generates structured 30-minute
agendas before mentorship calls.

- Mentee picks a track (Career or University)
- Submits a mentor name and 3 prep questions
- Claude generates a time-labelled session agenda
- Every call starts with a real plan

---

<!-- slide 4 -->
# How I built it

- **MCP:** `fetch` + `filesystem` + `context7` — live docs and API testing
  inside Claude Code
- **Skill:** `agenda-generator` — rules for formatting a 30-minute agenda
  with check-in, question blocks, and goal-setting
- **Agent:** `profile-validator` — validates track, mentor name, and
  3 questions before generating

**Stack:** React (Vite) · .NET 8 Minimal API · Claude API

---

<!-- slide 5 -->
# Why it matters

Removes the dependency on personal connections.

Mentors are findable, bookable, and accountable.

A 30-minute AI-generated agenda means neither side shows up unprepared.

Busy professionals say yes because the commitment is clear:
30 minutes, every two weeks, with a plan in their inbox.

---

<!-- slide 6 -->
# Done checklist

- [x] repo public
- [x] MCP + skill + agent used
- [x] report.md in team repo

🖐️ GuidedUp — Mentorship with a plan. Not small talk.
