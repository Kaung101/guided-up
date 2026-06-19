import { useState, useEffect } from 'react';

const TRACKS = [
  { value: 'career', label: 'Career Growth', emoji: '💼', desc: 'Level up your professional path' },
  { value: 'university', label: 'University Applications', emoji: '🎓', desc: 'Navigate admissions with confidence' },
];

const CAREER_SPECIALISMS = [
  { value: 'stack', label: 'Stack Skills' },
  { value: 'job-search', label: 'Job Search' },
  { value: 'promotion', label: 'Promotion' },
];

function parseAgenda(raw) {
  const blocks = []; let session = '', mentor = '', footer = '', current = null;
  for (const line of raw.split('\n')) {
    const t = line.trim(); if (!t) continue;
    const sm = t.match(/^\*\*Session:\*\*\s*(.+?)\s*—\s*(.+?)\s*\/\s*(.+)/);
    if (sm) { session = sm[1].trim(); mentor = sm[2].trim(); continue; }
    const bm = t.match(/^\[(\d{2}:\d{2})[-–](\d{2}:\d{2})\]\s*(.+)/);
    if (bm) {
      if (current) blocks.push(current);
      const r = bm[3]; const d = r.indexOf(' — ');
      current = { start: bm[1], end: bm[2], title: d > -1 ? r.substring(0, d) : r, desc: d > -1 ? r.substring(d + 3) : '', bullets: [], isCheckin: r.toLowerCase().includes('check-in'), isGoal: r.toLowerCase().includes('goal-setting') };
      continue;
    }
    const bul = t.match(/^[•◦]\s+(.+)/);
    if (bul && current) { current.bullets.push(bul[1]); continue; }
    if (t.startsWith('>')) footer = t.replace(/^>\s*/, '');
  }
  if (current) blocks.push(current);
  return { session, mentor, blocks, footer };
}

export default function App() {
  const [view, setView] = useState('home'); // home | profile | mentors
  const [track, setTrack] = useState('');
  const [role, setRole] = useState('mentee');
  const [mentorName, setMentorName] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [mentors, setMentors] = useState([]);
  const [filter, setFilter] = useState({ track: 'career' });

  useEffect(() => { fetchMentors(); }, []);

  const fetchMentors = (f = {}) => {
    const params = new URLSearchParams(f);
    fetch(`/mentors?${params}`).then(r => r.json()).then(setMentors).catch(() => {});
  };

  const setQ = (i, v) => { const n = [...questions]; n[i] = v; setQuestions(n); };
  const allFilled = track && mentorName.trim().length >= 2 && questions.every(q => q.trim().length >= 10);

  const handleSubmit = async (e) => {
    e.preventDefault(); setErrors([]); setAgenda(null);
    if (!allFilled) { setErrors(['Please fill all fields before generating.']); return; }
    setLoading(true);
    try {
      const res = await fetch('/agenda', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ track, mentorName: mentorName.trim(), question1: questions[0].trim(), question2: questions[1].trim(), question3: questions[2].trim() }) });
      const data = await res.json();
      if (!res.ok) setErrors(data.errors || ['Something went wrong.']);
      else setAgenda(parseAgenda(data.agenda));
    } catch { setErrors(['Could not reach the server. Make sure the backend is running.']); }
    finally { setLoading(false); }
  };

  return (
    <div className="app">
      <header className="header">
        <div className="logo"><div className="logo-icon">📋</div><h1>GuidedUp</h1></div>
        <p className="subtitle">Mentorship with a plan. Not small talk.</p>
        <nav className="nav-tabs">
          {[['home','📋 Agenda'],['mentors','🔍 Find Mentors']].map(([v,l]) => (
            <button key={v} className={`nav-tab ${view === v ? 'active' : ''}`} onClick={() => setView(v)}>{l}</button>
          ))}
        </nav>
      </header>

      <div className="main-wrapper">
        {/* ===== HOME: Agenda Generator ===== */}
        {view === 'home' && !agenda && (
          <form onSubmit={handleSubmit} className="form-card">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">I'm looking for</legend>
              <div className="track-grid">
                {TRACKS.map(t => (
                  <label key={t.value} className={`track-card ${track === t.value ? 'selected' : ''}`}>
                    <input type="radio" name="track" value={t.value} checked={track === t.value} onChange={e => setTrack(e.target.value)} />
                    <span className="track-emoji">{t.emoji}</span><span className="track-label">{t.label}</span><span className="track-desc">{t.desc}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <hr className="section-divider" /><p className="section-header">Session details</p>
            <label className="form-field">
              <div className="field-label-row"><span className="field-label">Mentor name</span><span className="field-hint">{mentorName.trim().length}/2 min</span></div>
              <input type="text" className="text-input" placeholder="e.g. Su Myat Noe" value={mentorName} onChange={e => setMentorName(e.target.value)} />
            </label>
            {questions.map((q, i) => (
              <label key={i} className="form-field">
                <div className="field-label-row"><span className="field-label">Question {i + 1}</span><span className="field-hint">{q.trim().length}/10 min</span></div>
                <textarea className="text-area" rows={3} placeholder={`What's your question #${i + 1} for the mentor?`} value={q} onChange={e => setQ(i, e.target.value)} />
              </label>
            ))}
            {errors.length > 0 && (<div className="error-alert">{errors.map((e,i) => <div key={i} className="error-item">⚠ {e}</div>)}</div>)}
            <button type="submit" className={`btn-generate ${loading ? 'loading' : ''}`} disabled={loading || !allFilled}>
              {loading && <span className="spinner" />}{loading ? 'Building your agenda…' : 'Generate Agenda'}
            </button>
          </form>
        )}

        {view === 'home' && agenda && (
          <section className="agenda-panel">
            <div className="agenda-header"><span className="agenda-header-icon">📋</span><h2>Your Session Agenda</h2><span className="track-badge">{track}</span></div>
            <div className="agenda-body">
              <div className="agenda-meta"><div className="session-line">{agenda.session}</div><div className="mentor-line">with {agenda.mentor} · 30 minutes</div></div>
              <div className="agenda-blocks">
                {agenda.blocks.map((b,i) => {
                  let ec = ''; if (b.isCheckin) ec = 'checkin-block'; else if (b.isGoal) ec = 'goal-block';
                  return (<div key={i} className={`agenda-block ${ec}`}><span className="time-badge">{b.start}–{b.end}</span><div className="block-content"><div className="block-title">{b.title}</div>{b.bullets.length > 0 && <ul className="block-bullets">{b.bullets.map((pt,j) => <li key={j}>{pt}</li>)}</ul>}</div></div>);
                })}
              </div>
            </div>
            {agenda.footer && <div className="agenda-footer"><p>{agenda.footer}</p></div>}
            <button className="btn-new-session" onClick={() => { setAgenda(null); setErrors([]); setTrack(''); setMentorName(''); setQuestions(['','','']); }}>+ New Session Prep</button>
          </section>
        )}

        {/* ===== MENTOR DISCOVERY ===== */}
        {view === 'mentors' && (
          <div className="form-card">
            <h2 className="section-title">Find a Mentor</h2>
            <div className="filter-bar">
              <select className="text-input filter-select" value={filter.track} onChange={e => { const f = { ...filter, track: e.target.value }; setFilter(f); fetchMentors(f); }}>
                <option value="career">💼 Career</option><option value="university">🎓 University</option>
              </select>
              {filter.track === 'career' && (
                <select className="text-input filter-select" value={filter.specialism || ''} onChange={e => { const f = { ...filter, specialism: e.target.value || undefined }; setFilter(f); fetchMentors(f); }}>
                  <option value="">All Specialisms</option>
                  {CAREER_SPECIALISMS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              )}
              {filter.track === 'university' && (
                <select className="text-input filter-select" value={filter.destinationCountry || ''} onChange={e => { const f = { ...filter, destinationCountry: e.target.value || undefined }; setFilter(f); fetchMentors(f); }}>
                  <option value="">All Countries</option>
                  <option value="thailand">Thailand</option><option value="japan">Japan</option><option value="singapore">Singapore</option><option value="us">US</option><option value="australia">Australia</option>
                </select>
              )}
            </div>
            <div className="mentor-grid">
              {mentors.map(m => (
                <div key={m.id} className="mentor-card">
                  <div className="mentor-avatar">{m.name.charAt(0)}</div>
                  <div className="mentor-info">
                    <h3>{m.name}</h3>
                    <span className="mentor-tag">{m.track === 'career' ? '💼' : '🎓'} {m.industry || m.destinationCountry}</span>
                    {m.roleLevel && <span className="mentor-tag">{m.roleLevel}</span>}
                    {m.specialism && <span className="mentor-tag">{m.specialism}</span>}
                    {m.hasScholarshipExperience && <span className="mentor-tag">🎖️ Scholarship</span>}
                    {m.company && <p className="mentor-org">🏢 {m.company}</p>}
                    {m.university && <p className="mentor-org">🏛️ {m.university}</p>}
                    <p className="mentor-bio">{m.bio}</p>
                  </div>
                </div>
              ))}
              {mentors.length === 0 && <p className="empty-state">No mentors found. Try adjusting your filters.</p>}
            </div>
          </div>
        )}
      </div>

      <footer className="footer"><p>GuidedUp<span>·</span>ch-3 personal project<span>·</span>React + .NET 8</p></footer>
    </div>
  );
}
