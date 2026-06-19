# GuidedUp

**Alpha Version** — a two-track mentorship platform connecting Myanmar professionals and students with mentors through structured, goal-oriented sessions every two weeks.

> ⚠️ This is alpha software. Features are functional but not production-hardened. No authentication, no payment processing, no email delivery. Use for development, testing, and demonstration purposes.

---

## What It Does

GuidedUp offers two specialized tracks:

| Track | Who It's For | Mentors Help With |
|-------|-------------|-------------------|
| 💼 **Career** | Juniors and mid-level professionals | Stack skills, job search, promotions |
| 🎓 **University** | Students applying abroad | School selection, essays, scholarship applications |

### Core Features

- **Landing page** — hero with mascot, dual track showcase, call-to-action
- **Mentor discovery** — filterable grid (by industry, role level, destination country, scholarship)
- **Mentor profile + booking** — calendar picker, 14-day rule enforcement, confirmation modal
- **Mentee dashboard** — upcoming sessions, track progress bar, goal toggles (career), school targets with status cycling (university)
- **Agenda generator** — AI-free structured session prep from 3 questions
- **Login / Sign Up** — create a profile, log in by name, auto-load dashboard
- **Responsive** — works on desktop, tablet, and mobile (Android-first)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite, plain CSS (Be Vietnam Pro, Material Symbols) |
| Backend | .NET 8 Minimal API (single `Program.cs`, in-memory store) |
| Design System | Stitch — colors `#003441` / `#a04100`, 8px spacing, branded shadows |
| Deploy | Docker multi-stage, Render free plan |
| CI/CD | GitHub Actions (build backend + frontend + Docker) |

### Project Structure

```
guided-up/
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # 122 lines — all views, state, API calls
│   │   ├── App.css          # 562 lines — complete design system
│   │   └── main.jsx         # React entry point
│   ├── index.html           # Be Vietnam Pro + Material Symbols loaded
│   ├── vite.config.js       # Dev proxy for /mentors /profiles /bookings /goals
│   └── package.json
├── backend/
│   └── GuidedUp.Api/
│       ├── Program.cs       # 358 lines — all endpoints, seed data, helpers
│       ├── Models/          # Profile, Booking, Goal, SchoolTarget, Agenda
│       └── wwwroot/         # Frontend build output (gitignored, built at deploy)
├── Dockerfile               # Multi-stage: Node build → .NET build → ASP.NET runtime
├── docker-compose.yml       # Single service, port 8080
├── render.yaml              # Render.com web service config
└── .github/workflows/ci.yml # CI/CD pipeline
```

---

## Running Locally

**Prerequisites:** Node.js 22+, .NET 8 SDK

### Backend

```bash
cd backend/GuidedUp.Api
dotnet run
# Starts on http://localhost:5037
```

### Frontend (dev mode with hot reload)

```bash
cd frontend
npm install   # first time only
npm run dev
# Starts on http://localhost:5173 (proxies API calls to :5037)
```

### Production simulation (single port)

```bash
cd backend/GuidedUp.Api
ASPNETCORE_ENVIRONMENT=Production dotnet run
# Full app served from http://localhost:5037
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/profiles` | Create a new profile |
| `GET`  | `/profiles/{id}` | Get profile by ID |
| `GET`  | `/profiles?track=` | Search profiles by track (for login) |
| `GET`  | `/mentors?track=&industry=&roleLevel=&specialism=&destinationCountry=&hasScholarshipExperience=` | Filter mentors |
| `POST` | `/bookings` | Create a booking (enforces 14-day rule per pair) |
| `GET`  | `/bookings?profileId=` | Get bookings for a profile |
| `POST` | `/goals` | Add a goal to a booking |
| `GET`  | `/goals?bookingId=` | Get goals for a booking |
| `PATCH` | `/goals/{id}` | Toggle goal done/not-done |
| `POST` | `/school-targets` | Add a school target |
| `GET`  | `/school-targets?profileId=` | Get targets for a profile |
| `PATCH` | `/school-targets/{id}` | Update target status |
| `POST` | `/agenda` | Generate structured session agenda |

### Seed Mentors (in-memory)

Six mentors are seeded on startup — three career, three university. They appear in discovery immediately.

---

## Deployment

### Render.com (configured)

Push to `main` → Render auto-deploys using `render.yaml`. The Dockerfile handles the full build chain.

### Docker

```bash
docker build -t guided-up .
docker run -p 8080:8080 guided-up
```

### docker-compose

```bash
docker compose up
```

---

## Alpha Limitations

- **No persistent database** — profiles, bookings, goals reset on server restart (in-memory `ConcurrentDictionary`)
- **No real authentication** — login matches by name (no passwords, no tokens)
- **No email delivery** — agenda and booking confirmations shown in-app only
- **No payment processing** — mentors volunteer (monetization is post-launch decision)
- **No other tracks** — only Career Growth and University Applications
- **Static UI photos** — Unsplash placeholder images, not real mentor photos
- **No admin panel** — seed data is hardcoded in `Program.cs`

---

## Design System Reference

The Stitch UI is based on a Material 3 custom color scheme with Be Vietnam Pro typography:

- **Primary:** `#003441` (dark teal)
- **Primary Container:** `#0F4C5C`
- **Secondary:** `#a04100` (amber)
- **Surface:** `#F8FAFC`
- **Deep Navy:** `#1E293B` (footer)
- **Success:** `#059669`
- **Font:** Be Vietnam Pro, 400-800 weights, Burmese glyph support
- **Icons:** Material Symbols Outlined

Source references live in the original Stitch HTML blueprints and `DESIGN.md`.

---

## License

Personal project by @Kaung101. Not licensed for redistribution.
