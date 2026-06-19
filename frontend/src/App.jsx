import { useState } from 'react';

const TRACKS = [
  {
    value: 'career',
    label: 'Career Growth',
    emoji: '💼',
    desc: 'Level up your professional path',
  },
  {
    value: 'university',
    label: 'University Applications',
    emoji: '🎓',
    desc: 'Navigate admissions with confidence',
  },
];

function parseAgenda(raw) {
  const lines = raw.split('\n');
  const blocks = [];
  let session = '';
  let mentor = '';
  let footer = '';
  let current = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Session header: **Session:** career mentorship — Name / Goal
    const sessionMatch = trimmed.match(/^\*\*Session:\*\*\s*(.+?)\s*—\s*(.+?)\s*\/\s*(.+)/);
    if (sessionMatch) {
      session = sessionMatch[1].trim();
      mentor = sessionMatch[2].trim();
      continue;
    }

    // Time block: [XX:00–YY:00] Title — Description
    const blockMatch = trimmed.match(/^\[(\d{2}:\d{2})[-–](\d{2}:\d{2})\]\s*(.+)/);
    if (blockMatch) {
      if (current) blocks.push(current);
      const rest = blockMatch[3];
      const emDash = rest.indexOf(' — ');
      const title = emDash > -1 ? rest.substring(0, emDash) : rest;
      const desc = emDash > -1 ? rest.substring(emDash + 3) : '';
      current = {
        start: blockMatch[1],
        end: blockMatch[2],
        title,
        desc,
        bullets: [],
        isCheckin: title.toLowerCase().includes('check-in'),
        isGoal: title.toLowerCase().includes('goal-setting'),
      };
      continue;
    }

    // Bullet: • text  or  ◦ text
    const bulletMatch = trimmed.match(/^[•◦]\s+(.+)/);
    if (bulletMatch && current) {
      current.bullets.push(bulletMatch[1]);
      continue;
    }

    // Footer note: > text
    if (trimmed.startsWith('>')) {
      footer = trimmed.replace(/^>\s*/, '');
      continue;
    }
  }

  if (current) blocks.push(current);

  return { session, mentor, blocks, footer };
}

export default function App() {
  const [track, setTrack] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const setQuestion = (i, v) => {
    const n = [...questions];
    n[i] = v;
    setQuestions(n);
  };

  const allFilled =
    track &&
    mentorName.trim().length >= 2 &&
    questions.every((q) => q.trim().length >= 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setAgenda(null);
    if (!allFilled) {
      setErrors(['Please fill all fields before generating.']);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track,
          mentorName: mentorName.trim(),
          question1: questions[0].trim(),
          question2: questions[1].trim(),
          question3: questions[2].trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors(data.errors || ['Something went wrong.']);
      } else {
        setAgenda(parseAgenda(data.agenda));
      }
    } catch {
      setErrors(['Could not reach the server. Make sure the backend is running on port 5037.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      {/* ── Header ── */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">📋</div>
          <h1>GuidedUp</h1>
        </div>
        <p className="subtitle">Mentorship with a plan. Not small talk.</p>
      </header>

      <div className="main-wrapper">
        {/* ── Form ── */}
        {!agenda && (
          <form onSubmit={handleSubmit} className="form-card">
            {/* Track */}
            <fieldset className="fieldset">
              <legend className="fieldset-legend">I'm looking for</legend>
              <div className="track-grid">
                {TRACKS.map((t) => (
                  <label
                    key={t.value}
                    className={`track-card ${track === t.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="track"
                      value={t.value}
                      checked={track === t.value}
                      onChange={(e) => setTrack(e.target.value)}
                    />
                    <span className="track-emoji">{t.emoji}</span>
                    <span className="track-label">{t.label}</span>
                    <span className="track-desc">{t.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <hr className="section-divider" />
            <p className="section-header">Session details</p>

            {/* Mentor */}
            <label className="form-field">
              <div className="field-label-row">
                <span className="field-label">Mentor name</span>
                <span className="field-hint">{mentorName.trim().length}/2 min</span>
              </div>
              <input
                type="text"
                className="text-input"
                placeholder="e.g. Su Myat Noe"
                value={mentorName}
                onChange={(e) => setMentorName(e.target.value)}
              />
            </label>

            {/* Questions */}
            {questions.map((q, i) => (
              <label key={i} className="form-field">
                <div className="field-label-row">
                  <span className="field-label">Question {i + 1}</span>
                  <span className="field-hint">{q.trim().length}/10 min</span>
                </div>
                <textarea
                  className="text-area"
                  rows={3}
                  placeholder={`What's your question #${i + 1} for the mentor?`}
                  value={q}
                  onChange={(e) => setQuestion(i, e.target.value)}
                />
              </label>
            ))}

            {/* Errors */}
            {errors.length > 0 && (
              <div className="error-alert">
                {errors.map((err, i) => (
                  <div key={i} className="error-item">⚠ {err}</div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`btn-generate ${loading ? 'loading' : ''}`}
              disabled={loading || !allFilled}
            >
              {loading && <span className="spinner" />}
              {loading ? 'Building your agenda…' : 'Generate Agenda'}
            </button>
          </form>
        )}

        {/* ── Agenda Output ── */}
        {agenda && (
          <section className="agenda-panel">
            <div className="agenda-header">
              <span className="agenda-header-icon">📋</span>
              <h2>Your Session Agenda</h2>
              <span className="track-badge">{track}</span>
            </div>

            <div className="agenda-body">
              {/* Meta */}
              <div className="agenda-meta">
                <div className="session-line">{agenda.session}</div>
                <div className="mentor-line">with {agenda.mentor} · 30 minutes</div>
              </div>

              {/* Time blocks */}
              <div className="agenda-blocks">
                {agenda.blocks.map((b, i) => {
                  let extraClass = '';
                  if (b.isCheckin) extraClass = 'checkin-block';
                  else if (b.isGoal) extraClass = 'goal-block';

                  return (
                    <div key={i} className={`agenda-block ${extraClass}`}>
                      <span className="time-badge">{b.start}–{b.end}</span>
                      <div className="block-content">
                        <div className="block-title">{b.title}</div>
                        {b.desc && (
                          <ul className="block-bullets">
                            <li>{b.desc}</li>
                          </ul>
                        )}
                        {b.bullets.length > 0 && (
                          <ul className="block-bullets">
                            {b.bullets.map((pt, j) => (
                              <li key={j}>{pt}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {agenda.footer && (
              <div className="agenda-footer">
                <p>{agenda.footer}</p>
              </div>
            )}
          </section>
        )}

        {/* New session */}
        {agenda && (
          <button
            className="btn-new-session"
            onClick={() => {
              setAgenda(null);
              setErrors([]);
              setTrack('');
              setMentorName('');
              setQuestions(['', '', '']);
            }}
          >
            + New Session Prep
          </button>
        )}
      </div>

      {/* ── Footer ── */}
      <footer className="footer">
        <p>
          GuidedUp<span>·</span>ch-3 personal project<span>·</span>
          React + .NET 8 + Claude Code
        </p>
      </footer>
    </div>
  );
}
