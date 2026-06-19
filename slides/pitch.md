# GuidedUp — Pitch Deck

**@Kaung101 · Alpha · June 2026**

---

## Slide 1 — The Problem

> In Myanmar, mentorship means knowing the right person's uncle.

- **No structured mentorship** exists for young professionals
- University applicants have **zero counseling** — no one who's been through the process
- LinkedIn messages go unanswered; advice is vague and unaccountable
- Both sides want connection but there's **no platform built for Myanmar**

---

## Slide 2 — The Solution

**A two-track mentorship platform delivering structured, accountable sessions every two weeks.**

| For Mentees | For Mentors |
|-------------|-------------|
| Find vetted mentors in your exact field | Give back in 30 minutes every two weeks |
| Submit 3 questions before every session | Show up to a real agenda, not small talk |
| Track goals between sessions | See mentee progress — did they do what they said? |
| Free in alpha | No-host commitment — it's only 30 min |

---

## Slide 3 — Two Tracks, One Platform

### 💼 Career Track
*For juniors and mid-level professionals*

- Filter mentors by **industry** (tech, business, design)
- Filter by **specialism** (stack skills, job search, promotion)
- Goal tracker with done/not-done toggles

### 🎓 University Track
*For students applying abroad*

- Filter mentors by **destination country** (US, UK, Singapore, Japan, Thailand, Australia)
- Filter by **scholarship experience**
- School target tracker: Researching → Drafting → Submitted → Accepted

---

## Slide 4 — How It Works

```
1. Sign Up        →  Create a profile in under 2 minutes
2. Find a Mentor  →  Browse, filter, read bios from real Myanmar professionals
3. Pick a Date    →  Click a day on the calendar, confirm
4. Prep Questions →  Submit 3 questions; get a structured agenda
5. Meet           →  30-minute focused video call
6. Track Progress →  Mark goals done; come back in 2 weeks
```

**14-day rule** — one session per mentor-mentee pair every two weeks. Keeps both sides accountable.

---

## Slide 5 — What's Built (Alpha)

| Feature | Status |
|---------|--------|
| Landing page with mascot + track showcase | ✅ |
| Mentor discovery (filterable, responsive grid) | ✅ |
| Mentor profile page (bio, tags, photo) | ✅ |
| Booking calendar (date picker, confirmation modal) | ✅ |
| 14-day booking rule enforcement | ✅ |
| Mentee dashboard (sessions, progress bar) | ✅ |
| Career goal tracking (done/not-done toggles) | ✅ |
| University school target tracker (status cycling) | ✅ |
| Structured agenda generator (no AI needed) | ✅ |
| Login / Sign Up (name-based) | ✅ |
| Responsive (desktop, tablet, mobile) | ✅ |
| Docker + Render + CI/CD | ✅ |

---

## Slide 6 — Design System

**Stitch Design System** — built from Material 3 custom tokens

- **Typography:** Be Vietnam Pro (English + Burmese glyphs)
- **Primary:** `#003441` dark teal — stability, trust
- **Secondary:** `#a04100` amber — warmth, approachable
- **CTA accent:** `#E36414` coral — high-visibility actions
- **Surface:** `#F8FAFC` cool white — reduced eye strain
- **Deep Navy:** `#1E293B` — authoritative footer
- **Spacing:** strict 8px scale, 280px fixed sidebar, 1200px max container

---

## Slide 7 — Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | React 18 + Vite | Fast builds, single-file simplicity (122 lines) |
| CSS | Plain CSS with design tokens | No framework bloat, 562 lines total |
| Backend | .NET 8 Minimal API | Single Program.cs, deploy anywhere |
| Storage | In-memory ConcurrentDictionary | Zero setup for alpha |
| Deploy | Docker → Render free tier | Push to main, auto-deploy |

**1,042 lines total** across the entire app (App.jsx + App.css + Program.cs). No external API dependencies.

---

## Slide 8 — Alpha Limitations (What's Not Built Yet)

- ❌ No persistent database (profiles reset on restart)
- ❌ No password-based authentication
- ❌ No email delivery (agendas, reminders, confirmations)
- ❌ No payment processing
- ❌ No video call integration
- ❌ No admin panel
- ❌ No Burmese language UI (font support exists, content is English)
- ❌ Placeholder photos (Unsplash, not real mentor headshots)

---

## Slide 9 — What's Next (Beta Roadmap)

| Priority | Feature | Effort |
|----------|---------|--------|
| 🔴 P0 | Persistent database (Supabase Postgres) | High |
| 🔴 P0 | Real auth (Supabase Auth or JWT) | Medium |
| 🟡 P1 | Claude API agenda generation (richer output) | Low |
| 🟡 P1 | Email reminders (Resend) | Low |
| 🟢 P2 | Burmese UI translations | Medium |
| 🟢 P2 | Mentor onboarding flow | Medium |
| 🟢 P2 | Video call scheduling (Google Meet / Zoom API) | Medium |
| 🔵 P3 | Payment processing for paid mentor tiers | High |
| 🔵 P3 | Mobile app (React Native) | High |

---

## Slide 10 — Why This Matters

> Myanmar has 55 million people. No structured mentorship platform exists.

- **20,000+ students** apply abroad from Myanmar annually — most without guidance
- **Booming tech sector** in Yangon — juniors have no senior engineers to learn from
- **Brain drain is real** — successful professionals abroad want to give back but have no channel
- **14-day cadence is unique** — not casual chat, not expensive coaching; structured accountability in small doses

GuidedUp is purpose-built for this gap.

---

## Slide 11 — Try It

```bash
git clone https://github.com/Kaung101/guided-up.git
cd guided-up/backend/GuidedUp.Api
dotnet run
# Open http://localhost:5037
```

**Live demo:** [guided-up.onrender.com](https://guided-up.onrender.com) *(if deployed)*

**Repo:** [github.com/Kaung101/guided-up](https://github.com/Kaung101/guided-up)

---

*Built by @Kaung101 · Alpha release · June 2026*
