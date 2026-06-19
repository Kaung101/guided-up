import { useState } from 'react';

const TRACKS = [
  { value: 'career', label: 'Career Growth', emoji: '💼' },
  { value: 'university', label: 'University Applications', emoji: '🎓' },
];

export default function App() {
  const [track, setTrack] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [agenda, setAgenda] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const setQuestion = (i, value) => {
    const next = [...questions];
    next[i] = value;
    setQuestions(next);
  };

  const allFilled =
    track &&
    mentorName.trim() &&
    questions.every((q) => q.trim().length >= 10);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setAgenda('');

    if (!allFilled) {
      setErrors(['Please fill all fields completely.']);
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
        setAgenda(data.agenda);
      }
    } catch {
      setErrors(['Could not reach the server. Make sure the backend is running.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>GuidedUp</h1>
        <p className="subtitle">Mentorship with a plan. Not small talk.</p>
      </header>

      <main className="main">
        <form onSubmit={handleSubmit} className="form">
          {/* Track selector */}
          <fieldset className="field">
            <legend>I'm looking for</legend>
            <div className="track-options">
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
                </label>
              ))}
            </div>
          </fieldset>

          {/* Mentor name */}
          <label className="field">
            <span className="field-label">Mentor name</span>
            <input
              type="text"
              placeholder="e.g. Su Myat Noe"
              value={mentorName}
              onChange={(e) => setMentorName(e.target.value)}
            />
          </label>

          {/* Questions */}
          <fieldset className="field">
            <legend>Your 3 prep questions</legend>
            <p className="hint">
              These shape your 30-minute session. Be specific — the agenda is
              built from your questions.
            </p>
            {questions.map((q, i) => (
              <label key={i} className="field">
                <span className="field-label">Question {i + 1}</span>
                <textarea
                  rows={3}
                  placeholder={`What do you want to ask about?`}
                  value={q}
                  onChange={(e) => setQuestion(i, e.target.value)}
                />
                <span className="char-count">
                  {q.trim().length}/10 min
                </span>
              </label>
            ))}
          </fieldset>

          {/* Errors */}
          {errors.length > 0 && (
            <div className="errors">
              {errors.map((err, i) => (
                <p key={i}>❌ {err}</p>
              ))}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="generate-btn"
            disabled={loading || !allFilled}
          >
            {loading ? 'Generating...' : 'Generate Agenda'}
          </button>
        </form>

        {/* Agenda output */}
        {agenda && (
          <section className="agenda">
            <h2>Your Session Agenda</h2>
            <pre className="agenda-text">{agenda}</pre>
            <button
              className="reset-btn"
              onClick={() => {
                setAgenda('');
                setErrors([]);
              }}
            >
              Start a new session
            </button>
          </section>
        )}
      </main>

      <footer className="footer">
        <p>
          GuidedUp — ch-3 personal project · Built with React + .NET 8 + Claude
        </p>
      </footer>
    </div>
  );
}
