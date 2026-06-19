import { useState, useEffect, useCallback } from 'react';

/* ── Constants ── */
const TRACKS = [
  { value: 'career', label: 'Career Growth', emoji: '💼', desc: 'Level up your professional path' },
  { value: 'university', label: 'University Applications', emoji: '🎓', desc: 'Navigate admissions with confidence' },
];

const INDUSTRIES = ['Technology & Software', 'Business & Management', 'Design & Creative'];
const ROLE_LEVELS = ['Any Level', 'Entry Level / Junior', 'Mid-Senior Level', 'Director / Lead'];
const DEST_COUNTRIES = ['United States', 'United Kingdom', 'Singapore', 'Australia', 'Japan', 'Thailand'];
const SCHOLARSHIP_TYPES = ['Full Scholarship', 'Partial Aid'];

const MENTOR_PHOTOS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=300&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=300&fit=crop',
];

/* ── Helpers ── */
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
      current = {
        start: bm[1], end: bm[2],
        title: d > -1 ? r.substring(0, d) : r,
        desc: d > -1 ? r.substring(d + 3) : '',
        bullets: [],
        isCheckin: r.toLowerCase().includes('check-in'),
        isGoal: r.toLowerCase().includes('goal-setting'),
      };
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
  /* ── View state ── */
  const [view, setView] = useState('discover');    // 'discover' | 'agenda'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── Mentor discovery state ── */
  const [track, setTrack] = useState('career');     // 'career' | 'university'
  const [mentors, setMentors] = useState([]);
  const [filters, setFilters] = useState({ availableNow: true });

  /* ── Agenda state ── */
  const [agendaTrack, setAgendaTrack] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  /* ── Fetch mentors ── */
  const fetchMentors = useCallback((f = {}) => {
    const params = new URLSearchParams();
    if (f.track) params.set('track', f.track);
    if (f.industry) params.set('industry', f.industry);
    if (f.roleLevel) params.set('roleLevel', f.roleLevel);
    if (f.destinationCountry) params.set('destinationCountry', f.destinationCountry);
    if (f.hasScholarshipExperience) params.set('hasScholarshipExperience', 'true');
    fetch(`/mentors?${params}`)
      .then(r => r.json())
      .then(setMentors)
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMentors({ track });
  }, [track, fetchMentors]);

  /* ── Filter handlers ── */
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchMentors({ track, ...next });
  };

  const handleTrackToggle = (t) => {
    setTrack(t);
    const next = { availableNow: filters.availableNow };
    setFilters(next);
    fetchMentors({ track: t });
  };

  /* ── Agenda handlers ── */
  const setQ = (i, v) => { const n = [...questions]; n[i] = v; setQuestions(n); };
  const allFilled = agendaTrack && mentorName.trim().length >= 2 && questions.every(q => q.trim().length >= 10);

  const handleAgendaSubmit = async (e) => {
    e.preventDefault(); setErrors([]); setAgenda(null);
    if (!allFilled) { setErrors(['Please fill all fields before generating.']); return; }
    setLoading(true);
    try {
      const res = await fetch('/agenda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: agendaTrack,
          mentorName: mentorName.trim(),
          question1: questions[0].trim(),
          question2: questions[1].trim(),
          question3: questions[2].trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) setErrors(data.errors || ['Something went wrong.']);
      else setAgenda(parseAgenda(data.agenda));
    } catch {
      setErrors(['Could not reach the server. Make sure the backend is running.']);
    } finally {
      setLoading(false);
    }
  };

  const resetAgenda = () => {
    setAgenda(null); setErrors([]); setAgendaTrack(''); setMentorName(''); setQuestions(['', '', '']);
  };

  /* ── Derived ── */
  const isCareerTrack = track === 'career';

  /* ================================================================
   * RENDER
   * ================================================================ */
  return (
    <div className="app">

      {/* ════════════════════════════════════════════════════════════
          HEADER
          ════════════════════════════════════════════════════════════ */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="#" onClick={() => setView('discover')}>GuidedUp</a>

          <nav className="nav-links">
            <a className={`nav-link ${view === 'discover' ? 'active' : ''}`}
               href="#" onClick={() => setView('discover')}>Find a Mentor</a>
            <a className={`nav-link ${view === 'agenda' ? 'active' : ''}`}
               href="#" onClick={() => setView('agenda')}>Agenda</a>
            <a className="nav-link" href="#">Tracks</a>
            <a className="nav-link" href="#">About</a>
          </nav>

          <div className="header-actions">
            <button className="btn-text">Login</button>
            <button className="btn-primary-sm">Sign Up</button>
            <button className="btn-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileMenuOpen && (
          <div style={{
            background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-card)', padding: 'var(--space-lg) var(--space-2xl)', display: 'flex', flexDirection: 'column', gap: '12px',
          }}>
            <a className="nav-link" href="#" onClick={() => { setView('discover'); setMobileMenuOpen(false); }}>Find a Mentor</a>
            <a className="nav-link" href="#" onClick={() => { setView('agenda'); setMobileMenuOpen(false); }}>Agenda</a>
            <a className="nav-link" href="#">Tracks</a>
            <a className="nav-link" href="#">About</a>
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════
          MENTOR DISCOVERY VIEW
          ════════════════════════════════════════════════════════════ */}
      {view === 'discover' && (
        <main className="main-wrapper">
          {/* Hero + Track Toggle */}
          <div className="hero-section">
            <div className="hero-text">
              <h1 className="hero-title">Discover Your Guide</h1>
              <p className="hero-subtitle">
                Find mentors who have successfully navigated the paths you're exploring today. From Myanmar to the world.
              </p>
            </div>
            <div className="track-toggle">
              <button
                className={`track-pill ${track === 'career' ? 'active' : ''}`}
                onClick={() => handleTrackToggle('career')}
              >
                Career Track
              </button>
              <button
                className={`track-pill ${track === 'university' ? 'active' : ''}`}
                onClick={() => handleTrackToggle('university')}
              >
                University Track
              </button>
            </div>
          </div>

          {/* 12-Col Grid */}
          <div className="discovery-grid">

            {/* ═══ Filter Sidebar ═══ */}
            <aside className="sidebar">

              {/* Mascot Card */}
              <div className="mascot-card">
                <div className="mascot-avatar">
                  <span className="material-symbols-outlined" style={{fontSize: 48, color: 'var(--color-primary)'}}>psychology</span>
                </div>
                <p className="mascot-text">
                  Hi! I'm your guide. Need help finding the right mentor?
                </p>
              </div>

              {/* Filter Card */}
              <div className="filter-card">
                <div className="filter-header">
                  <h3 className="filter-title">
                    <span className="material-symbols-outlined">filter_list</span> Filters
                  </h3>
                  <button className="filter-clear" onClick={() => {
                    const clean = { track, availableNow: true };
                    setFilters(clean);
                    fetchMentors({ track });
                  }}>Clear all</button>
                </div>

                <div className="filter-section">
                  {/* Career Filters */}
                  {isCareerTrack && (
                    <>
                      <div className="filter-group">
                        <label className="filter-label">Industry</label>
                        <div className="checkbox-list">
                          {INDUSTRIES.map(ind => (
                            <label key={ind} className="checkbox-item">
                              <input type="checkbox"
                                checked={filters.industry === ind}
                                onChange={() => handleFilterChange('industry', filters.industry === ind ? undefined : ind)} />
                              <span>{ind}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">Role Level</label>
                        <select className="filter-select"
                          value={filters.roleLevel || ''}
                          onChange={e => handleFilterChange('roleLevel', e.target.value || undefined)}>
                          {ROLE_LEVELS.map(rl => <option key={rl} value={rl === 'Any Level' ? '' : rl}>{rl}</option>)}
                        </select>
                      </div>
                    </>
                  )}

                  {/* University Filters */}
                  {!isCareerTrack && (
                    <>
                      <div className="filter-group">
                        <label className="filter-label">Destination Country</label>
                        <div className="checkbox-list">
                          {DEST_COUNTRIES.map(c => (
                            <label key={c} className="checkbox-item">
                              <input type="checkbox"
                                checked={filters.destinationCountry === c}
                                onChange={() => handleFilterChange('destinationCountry', filters.destinationCountry === c ? undefined : c)} />
                              <span>{c}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div className="filter-group">
                        <label className="filter-label">Scholarship Type</label>
                        <div className="checkbox-list">
                          {SCHOLARSHIP_TYPES.map(s => (
                            <label key={s} className="checkbox-item">
                              <input type="checkbox"
                                checked={s === 'Full Scholarship' ? filters.hasScholarshipExperience === true : false}
                                onChange={() => handleFilterChange('hasScholarshipExperience', filters.hasScholarshipExperience ? undefined : true)} />
                              <span>{s}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Availability Toggle */}
                  <hr className="filter-divider" />
                  <div className="toggle-row">
                    <label className="toggle-switch">
                      <input type="checkbox" checked={filters.availableNow || false}
                        onChange={e => setFilters({ ...filters, availableNow: e.target.checked })} />
                      <div className="toggle-track" />
                    </label>
                    <span className="toggle-label">Available now</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* ═══ Mentor Grid Area ═══ */}
            <div className="mentor-area">
              {/* Search + Count */}
              <div className="search-bar-row">
                <div className="search-input-wrap">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input className="search-input" type="text" placeholder="Search by name, role, or uni…" />
                </div>
                <p className="results-count">
                  Showing <strong>{mentors.length}</strong> mentors
                </p>
              </div>

              {/* Mentor Grid */}
              <div className="mentor-grid">
                {mentors.map((m, i) => {
                  const photoIdx = i % MENTOR_PHOTOS.length;
                  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
                  const now = new Date();
                  // pick a plausible next available day (for display only)
                  const nextDay = days[(now.getDay() + 1 + i) % 7];
                  const nextDate = new Date(now);
                  nextDate.setDate(nextDate.getDate() + 1 + i);
                  const dateStr = nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                  return (
                    <div key={m.id} className="mentor-card">
                      {/* Photo */}
                      <div className="mentor-photo-wrap">
                        <img className="mentor-photo" src={MENTOR_PHOTOS[photoIdx]} alt={m.name}
                          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <div className="mentor-photo-fallback" style={{display: 'none'}}>
                          {m.name.charAt(0)}
                        </div>
                        {/* Badge */}
                        {m.hasScholarshipExperience && (
                          <span className="mentor-badge top-mentor">Top Mentor</span>
                        )}
                        {!m.hasScholarshipExperience && (
                          <span className="mentor-badge available">Available</span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="mentor-body">
                        <div className="mentor-name-row">
                          <h3 className="mentor-name">{m.name}</h3>
                          <p className="mentor-role">{(m.company || m.university) ? `${m.roleLevel ? m.roleLevel + ' ' : ''}at ${m.company || m.university}` : (m.industry || m.destinationCountry || 'Mentor')}</p>
                        </div>

                        <div className="mentor-content">
                          <div className="mentor-tags">
                            {m.industry && <span className="mentor-tag">{m.industry}</span>}
                            {m.specialism && <span className="mentor-tag">{m.specialism}</span>}
                            {m.destinationCountry && <span className="mentor-tag">{m.destinationCountry}</span>}
                            {m.hasScholarshipExperience && <span className="mentor-tag">🎖 Scholarship</span>}
                            {m.targetMajor && <span className="mentor-tag">{m.targetMajor}</span>}
                          </div>
                          {m.bio && (
                            <p className="mentor-bio">"{m.bio}"</p>
                          )}
                        </div>

                        {/* Footer */}
                        <div className="mentor-footer">
                          <div className="mentor-slot">
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span>Next: {nextDay}, {dateStr}</span>
                          </div>
                          <button className="mentor-view-link">
                            View Profile <span className="material-symbols-outlined" style={{fontSize: '14px'}}>arrow_forward</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {mentors.length === 0 && (
                  <p className="empty-state">No mentors found. Try adjusting your filters.</p>
                )}
              </div>

              {/* Pagination */}
              {mentors.length > 0 && (
                <div className="pagination">
                  <button className="page-btn" disabled>
                    <span className="material-symbols-outlined">chevron_left</span>
                  </button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
                  <span className="page-dots">…</span>
                  <button className="page-btn">12</button>
                  <button className="page-btn">
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════
          AGENDA VIEW
          ════════════════════════════════════════════════════════════ */}
      {view === 'agenda' && (
        <main className="main-wrapper">
          <div className="agenda-view">
            <h1 className="section-title">Session Agenda</h1>

            {!agenda && (
              <form className="form-card" onSubmit={handleAgendaSubmit}>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">I'm looking for</legend>
                  <div className="track-grid">
                    {TRACKS.map(t => (
                      <label key={t.value} className={`track-card ${agendaTrack === t.value ? 'selected' : ''}`}>
                        <input type="radio" name="agendaTrack" value={t.value}
                          checked={agendaTrack === t.value} onChange={e => setAgendaTrack(e.target.value)} />
                        <span className="track-emoji">{t.emoji}</span>
                        <span className="track-label">{t.label}</span>
                        <span className="track-desc">{t.desc}</span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <hr className="section-divider" />
                <p className="section-header">Session details</p>

                <label className="form-field">
                  <div className="field-label-row">
                    <span className="field-label">Mentor name</span>
                    <span className="field-hint">{mentorName.trim().length}/2 min</span>
                  </div>
                  <input type="text" className="text-input" placeholder="e.g. Su Myat Noe"
                    value={mentorName} onChange={e => setMentorName(e.target.value)} />
                </label>

                {questions.map((q, i) => (
                  <label key={i} className="form-field">
                    <div className="field-label-row">
                      <span className="field-label">Question {i + 1}</span>
                      <span className="field-hint">{q.trim().length}/10 min</span>
                    </div>
                    <textarea className="text-area" rows={3}
                      placeholder={`What's your question #${i + 1} for the mentor?`}
                      value={q} onChange={e => setQ(i, e.target.value)} />
                  </label>
                ))}

                {errors.length > 0 && (
                  <div className="error-alert">
                    {errors.map((e, i) => <div key={i} className="error-item">⚠ {e}</div>)}
                  </div>
                )}

                <button type="submit" className={`btn-generate ${loading ? 'loading' : ''}`}
                  disabled={loading || !allFilled}>
                  {loading && <span className="spinner" />}
                  {loading ? 'Building your agenda…' : 'Generate Agenda'}
                </button>
              </form>
            )}

            {agenda && (
              <>
                <section className="agenda-panel">
                  <div className="agenda-header">
                    <span className="agenda-header-icon">📋</span>
                    <h2>Your Session Agenda</h2>
                    <span className="track-badge">{agendaTrack}</span>
                  </div>
                  <div className="agenda-body">
                    <div className="agenda-meta">
                      <div className="session-line">{agenda.session}</div>
                      <div className="mentor-line">with {agenda.mentor} · 30 minutes</div>
                    </div>
                    <div className="agenda-blocks">
                      {agenda.blocks.map((b, i) => {
                        let ec = '';
                        if (b.isCheckin) ec = 'checkin-block';
                        else if (b.isGoal) ec = 'goal-block';
                        return (
                          <div key={i} className={`agenda-block ${ec}`}>
                            <span className="time-badge">{b.start}–{b.end}</span>
                            <div className="block-content">
                              <div className="block-title">{b.title}</div>
                              {b.bullets.length > 0 && (
                                <ul className="block-bullets">
                                  {b.bullets.map((pt, j) => <li key={j}>{pt}</li>)}
                                </ul>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {agenda.footer && (
                    <div className="agenda-footer"><p>{agenda.footer}</p></div>
                  )}
                </section>

                <div className="agenda-back-nav">
                  <button className="btn-new-session" onClick={resetAgenda}>
                    + New Session Prep
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════
          TIMEZONE BANNER
          ════════════════════════════════════════════════════════════ */}
      <div className="timezone-banner">
        <span>All session times are automatically adjusted to your timezone:</span>
        <strong>UTC+6:30 (Myanmar Time)</strong>
      </div>

      {/* ════════════════════════════════════════════════════════════
          FOOTER
          ════════════════════════════════════════════════════════════ */}
      <footer className="footer">
        <div className="footer-grid">
          <div className="footer-brand-col">
            <div className="footer-brand">GuidedUp</div>
            <p className="footer-brand-desc">
              Empowering Myanmar's next generation of leaders through structured mentorship and global opportunities.
            </p>
          </div>
          <div>
            <h4 className="footer-heading">Programs</h4>
            <ul className="footer-links">
              <li><a href="#">University Track</a></li>
              <li><a href="#">Career Track</a></li>
              <li><a href="#">Scholarship Guide</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Support</h4>
            <ul className="footer-links">
              <li><a href="#">Contact Us</a></li>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
            </ul>
          </div>
          <div>
            <h4 className="footer-heading">Connect</h4>
            <div className="social-links">
              <a className="social-btn" href="#">
                <span className="material-symbols-outlined">face_nod</span>
              </a>
              <a className="social-btn" href="#">
                <span className="material-symbols-outlined">link</span>
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2024 GuidedUp Myanmar. Bridging the gap to future success.</p>
        </div>
      </footer>
    </div>
  );
}
