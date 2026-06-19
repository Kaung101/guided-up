import { useState, useEffect, useCallback } from 'react';

/* ── Constants ── */
const TRACKS = [
  { value: 'career',  label: 'Career Growth',            emoji: '💼', desc: 'Level up your professional path' },
  { value: 'university', label: 'University Applications', emoji: '🎓', desc: 'Navigate admissions with confidence' },
];

const INDUSTRIES     = ['Technology & Software', 'Business & Management', 'Design & Creative'];
const ROLE_LEVELS    = ['Any Level', 'Entry Level / Junior', 'Mid-Senior Level', 'Director / Lead'];
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

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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

/* ── Dummy profile (for demo dashboard — replace with real auth) ── */
const DEMO_PROFILE = { id: 1, name: 'Zaw Min', track: 'career', role: 'mentee' };

/* ================================================================
 * APP
 * ================================================================ */
export default function App() {
  /* ── View state ── */
  const [view, setView] = useState('landing'); // landing | discover | dashboard | agenda | mentor
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashSidebarOpen, setDashSidebarOpen] = useState(false);
  const [dashTab, setDashTab] = useState('overview');

  /* ── Mentor discovery state ── */
  const [track, setTrack] = useState('career');
  const [mentors, setMentors] = useState([]);
  const [filters, setFilters] = useState({ availableNow: true });

  /* ── Agenda state ── */
  const [agendaTrack, setAgendaTrack] = useState('');
  const [mentorName, setMentorName] = useState('');
  const [questions, setQuestions] = useState(['', '', '']);
  const [agenda, setAgenda] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  /* ── Dashboard state ── */
  const [dashProfile] = useState(DEMO_PROFILE);
  const [bookings, setBookings] = useState([]);
  const [goals, setGoals] = useState([]);
  const [schoolTargets, setSchoolTargets] = useState([]);

  /* ── Booking state ── */
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [bookingModal, setBookingModal] = useState(null); // null | 'confirm' | 'success'
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');

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

  useEffect(() => { fetchMentors({ track }); }, []);

  /* ── Fetch dashboard data ── */
  const fetchDashboard = useCallback(() => {
    fetch(`/bookings?profileId=${dashProfile.id}`)
      .then(r => r.json()).then(setBookings).catch(() => {});
    // Fetch goals for the first active booking
    const active = bookings.find(b => b.status === 'Confirmed');
    if (active) {
      fetch(`/goals?bookingId=${active.id}`)
        .then(r => r.json()).then(setGoals).catch(() => {});
    }
    fetch(`/school-targets?profileId=${dashProfile.id}`)
      .then(r => r.json()).then(setSchoolTargets).catch(() => {});
  }, [dashProfile.id, bookings.length]);

  useEffect(() => {
    if (view === 'dashboard') fetchDashboard();
  }, [view, fetchDashboard]);

  /* ── Filter handlers ── */
  const handleFilterChange = (key, value) => {
    const next = { ...filters, [key]: value };
    setFilters(next);
    fetchMentors({ track, ...next });
  };

  const handleTrackToggle = (t) => {
    setTrack(t);
    setFilters({ availableNow: true });
    fetchMentors({ track: t });
  };

  /* ── Agenda handlers ── */
  const setQ = (i, v) => { const n = [...questions]; n[i] = v; setQuestions(n); };
  const allFilled = agendaTrack && mentorName.trim().length >= 2 &&
    questions.every(q => q.trim().length >= 10);

  const handleAgendaSubmit = async (e) => {
    e.preventDefault(); setErrors([]); setAgenda(null);
    if (!allFilled) { setErrors(['Please fill all fields before generating.']); return; }
    setLoading(true);
    try {
      const res = await fetch('/agenda', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          track: agendaTrack, mentorName: mentorName.trim(),
          question1: questions[0].trim(), question2: questions[1].trim(), question3: questions[2].trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) setErrors(data.errors || ['Something went wrong.']);
      else setAgenda(parseAgenda(data.agenda));
    } catch { setErrors(['Could not reach the server. Make sure the backend is running.']); }
    finally { setLoading(false); }
  };

  const resetAgenda = () => {
    setAgenda(null); setErrors([]); setAgendaTrack(''); setMentorName(''); setQuestions(['', '', '']);
  };

  /* ── Booking handlers ── */
  const handleBookSession = async () => {
    if (!selectedMentor || !selectedSlot) return;
    setBookingLoading(true); setBookingError('');
    try {
      const start = new Date(selectedSlot);
      const end = new Date(start.getTime() + 30 * 60000);
      const res = await fetch('/bookings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menteeProfileId: dashProfile.id,
          mentorProfileId: selectedMentor.id,
          slotStart: start.toISOString(),
          slotEnd: end.toISOString(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.errors?.join(', ') || 'Booking failed');
      }
      setBookingModal('success');
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  /* ── Goal toggle ── */
  const toggleGoal = async (goal) => {
    try {
      await fetch(`/goals/${goal.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDone: !goal.isDone }),
      });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, isDone: !goal.isDone } : g));
    } catch { /* ignore */ }
  };

  /* ── School target cycle ── */
  const cycleSchoolStatus = async (s) => {
    const order = ['Researching', 'Drafting', 'Submitted', 'Accepted', 'Rejected'];
    const idx = order.indexOf(s.status);
    const next = order[(idx + 1) % order.length];
    try {
      await fetch(`/school-targets/${s.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setSchoolTargets(prev => prev.map(t => t.id === s.id ? { ...t, status: next } : t));
    } catch { /* ignore */ }
  };

  /* ── Generate slots for a mentor ── */
  const generateSlots = (mentor) => {
    const today = new Date();
    const slots = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() + d);
      for (let h = 9; h <= 16; h++) {
        slots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 0));
        slots.push(new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, 30));
      }
    }
    return slots;
  };

  /* ── Utility ── */
  const isCareerTrack = track === 'career';
  const isUniversityTrack = track === 'university';

  /* ================================================================
   * RENDER
   * ================================================================ */
  return (
    <div className="app">

      {/* ═══ HEADER ═══ */}
      <header className="header">
        <div className="header-inner">
          <a className="logo" href="#" onClick={() => setView('landing')}>GuidedUp</a>
          <nav className="nav-links">
            <a className={`nav-link ${view === 'discover' ? 'active' : ''}`}
               href="#" onClick={() => setView('discover')}>Find a Mentor</a>
            <a className={`nav-link ${view === 'dashboard' ? 'active' : ''}`}
               href="#" onClick={() => { setView('dashboard'); fetchDashboard(); }}>Dashboard</a>
            <a className={`nav-link ${view === 'agenda' ? 'active' : ''}`}
               href="#" onClick={() => setView('agenda')}>Agenda</a>
          </nav>
          <div className="header-actions">
            <button className="btn-text">Login</button>
            <button className="btn-primary-sm">Sign Up</button>
            <button className="btn-menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div style={{
            background:'var(--color-surface)', borderBottom:'1px solid var(--color-border)',
            boxShadow:'var(--shadow-card)', padding:'var(--space-lg) var(--space-2xl)',
            display:'flex', flexDirection:'column', gap:'12px',
          }}>
            {['Find a Mentor','Dashboard','Agenda'].map((l,i) => {
              const vs = ['discover','dashboard','agenda'];
              return <a key={l} className="nav-link" href="#" onClick={() => {
                setView(vs[i]); setMobileMenuOpen(false); if (vs[i]==='dashboard') fetchDashboard();
              }}>{l}</a>;
            })}
          </div>
        )}
      </header>

      {/* ════════════════════════════════════════════════════════════
          1. LANDING PAGE
          ════════════════════════════════════════════════════════════ */}
      {view === 'landing' && (
        <>
          <section className="landing-hero">
            <div className="landing-hero-inner">
              <div className="landing-mascot">
                <span className="material-symbols-outlined" style={{fontSize:64, color:'white'}}>psychology</span>
              </div>
              <h1 className="landing-headline">Your Stepping Stone to What's Next</h1>
              <p className="landing-subhead">
                Structured mentorship for Myanmar's next generation. Find a mentor who's been
                there, book a session, and follow a real plan — every two weeks.
              </p>
              <div className="landing-cta-row">
                <button className="btn-cta btn-cta-primary" onClick={() => setView('discover')}>
                  Find Your Mentor
                </button>
                <button className="btn-cta btn-cta-outline" onClick={() => setView('dashboard')}>
                  Go to Dashboard
                </button>
              </div>
            </div>
          </section>

          <section className="how-section">
            <h2 className="how-title">How It Works</h2>
            <p className="how-subtitle">Three simple steps to structured mentorship</p>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3 className="step-title">Find Your Guide</h3>
                <p className="step-desc">Browse mentors in your track — career growth or university applications. Filter by industry, role, or destination country.</p>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3 className="step-title">Book a Session</h3>
                <p className="step-desc">Pick a 30-minute slot that works for both of you. Submit 3 questions beforehand so every minute counts.</p>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3 className="step-title">Follow the Plan</h3>
                <p className="step-desc">Get a structured agenda before the call. Track your goals between sessions. Come back in two weeks with progress.</p>
              </div>
            </div>
          </section>

          <section className="tracks-section">
            <div className="tracks-inner">
              <h2 className="how-title">Two Tracks, One Platform</h2>
              <p className="how-subtitle">Specialized mentorship for different journeys</p>
              <div className="tracks-showcase">
                <div className="track-showcase-card" onClick={() => { setView('discover'); }}>
                  <div className="track-showcase-icon">💼</div>
                  <h3 className="track-showcase-title">Career Track</h3>
                  <p className="track-showcase-desc">For professionals navigating promotions, job searches, or skill growth. Mentors in tech, business, and design.</p>
                </div>
                <div className="track-showcase-card" onClick={() => { setView('discover'); }}>
                  <div className="track-showcase-icon">🎓</div>
                  <h3 className="track-showcase-title">University Track</h3>
                  <p className="track-showcase-desc">For students applying abroad. Mentors who've been through Thailand, Japan, Singapore, US, and Australia admissions.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="timezone-banner">
            <span>All session times are automatically adjusted to your timezone:</span>
            <strong>UTC+6:30 (Myanmar Time)</strong>
          </div>

          <footer className="footer">
            <div className="footer-grid">
              <div className="footer-brand-col">
                <div className="footer-brand">GuidedUp</div>
                <p className="footer-brand-desc">Empowering Myanmar's next generation of leaders through structured mentorship and global opportunities.</p>
              </div>
              <div>
                <h4 className="footer-heading">Programs</h4>
                <ul className="footer-links"><li><a href="#">University Track</a></li><li><a href="#">Career Track</a></li><li><a href="#">Scholarship Guide</a></li></ul>
              </div>
              <div>
                <h4 className="footer-heading">Support</h4>
                <ul className="footer-links"><li><a href="#">Contact Us</a></li><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li></ul>
              </div>
              <div>
                <h4 className="footer-heading">Connect</h4>
                <div className="social-links">
                  <a className="social-btn" href="#"><span className="material-symbols-outlined">face_nod</span></a>
                  <a className="social-btn" href="#"><span className="material-symbols-outlined">link</span></a>
                </div>
              </div>
            </div>
            <div className="footer-bottom"><p>© 2024 GuidedUp Myanmar. Bridging the gap to future success.</p></div>
          </footer>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════
          2. MENTOR DISCOVERY
          ════════════════════════════════════════════════════════════ */}
      {view === 'discover' && (
        <main className="main-wrapper">
          <div className="hero-section">
            <div className="hero-text">
              <h1 className="hero-title">Discover Your Guide</h1>
              <p className="hero-subtitle">Find mentors who have successfully navigated the paths you're exploring today. From Myanmar to the world.</p>
            </div>
            <div className="track-toggle">
              <button className={`track-pill ${track === 'career' ? 'active' : ''}`} onClick={() => handleTrackToggle('career')}>Career Track</button>
              <button className={`track-pill ${track === 'university' ? 'active' : ''}`} onClick={() => handleTrackToggle('university')}>University Track</button>
            </div>
          </div>

          <div className="discovery-grid">
            <aside className="sidebar">
              <div className="mascot-card">
                <div className="mascot-avatar">
                  <span className="material-symbols-outlined" style={{fontSize:48, color:'var(--color-primary)'}}>psychology</span>
                </div>
                <p className="mascot-text">Hi! I'm your guide. Need help finding the right mentor?</p>
              </div>

              <div className="filter-card">
                <div className="filter-header">
                  <h3 className="filter-title"><span className="material-symbols-outlined">filter_list</span> Filters</h3>
                  <button className="filter-clear" onClick={() => { setFilters({ track, availableNow: true }); fetchMentors({ track }); }}>Clear all</button>
                </div>
                <div className="filter-section">
                  {isCareerTrack && <>
                    <div className="filter-group">
                      <label className="filter-label">Industry</label>
                      <div className="checkbox-list">
                        {INDUSTRIES.map(ind => (
                          <label key={ind} className="checkbox-item">
                            <input type="checkbox" checked={filters.industry === ind} onChange={() => handleFilterChange('industry', filters.industry === ind ? undefined : ind)} />
                            <span>{ind}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="filter-group">
                      <label className="filter-label">Role Level</label>
                      <select className="filter-select" value={filters.roleLevel || ''} onChange={e => handleFilterChange('roleLevel', e.target.value || undefined)}>
                        {ROLE_LEVELS.map(rl => <option key={rl} value={rl === 'Any Level' ? '' : rl}>{rl}</option>)}
                      </select>
                    </div>
                  </>}
                  {!isCareerTrack && <>
                    <div className="filter-group">
                      <label className="filter-label">Destination Country</label>
                      <div className="checkbox-list">
                        {DEST_COUNTRIES.map(c => (
                          <label key={c} className="checkbox-item">
                            <input type="checkbox" checked={filters.destinationCountry === c} onChange={() => handleFilterChange('destinationCountry', filters.destinationCountry === c ? undefined : c)} />
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
                            <input type="checkbox" checked={s === 'Full Scholarship' ? filters.hasScholarshipExperience === true : false} onChange={() => handleFilterChange('hasScholarshipExperience', filters.hasScholarshipExperience ? undefined : true)} />
                            <span>{s}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>}
                  <hr className="filter-divider" />
                  <div className="toggle-row">
                    <label className="toggle-switch">
                      <input type="checkbox" checked={filters.availableNow || false} onChange={e => setFilters({ ...filters, availableNow: e.target.checked })} />
                      <div className="toggle-track" />
                    </label>
                    <span className="toggle-label">Available now</span>
                  </div>
                </div>
              </div>
            </aside>

            <div className="mentor-area">
              <div className="search-bar-row">
                <div className="search-input-wrap">
                  <span className="material-symbols-outlined search-icon">search</span>
                  <input className="search-input" type="text" placeholder="Search by name, role, or uni…" />
                </div>
                <p className="results-count">Showing <strong>{mentors.length}</strong> mentors</p>
              </div>

              <div className="mentor-grid">
                {mentors.map((m, i) => {
                  const photoIdx = i % MENTOR_PHOTOS.length;
                  const nextDate = new Date();
                  nextDate.setDate(nextDate.getDate() + 1 + i);
                  return (
                    <div key={m.id} className="mentor-card" onClick={() => { setSelectedMentor(m); setView('mentor'); }}>
                      <div className="mentor-photo-wrap">
                        <img className="mentor-photo" src={MENTOR_PHOTOS[photoIdx]} alt={m.name}
                          onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                        <div className="mentor-photo-fallback" style={{display:'none'}}>{m.name.charAt(0)}</div>
                        <span className={`mentor-badge ${m.hasScholarshipExperience ? 'top-mentor' : 'available'}`}>
                          {m.hasScholarshipExperience ? 'Top Mentor' : 'Available'}
                        </span>
                      </div>
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
                          {m.bio && <p className="mentor-bio">"{m.bio}"</p>}
                        </div>
                        <div className="mentor-footer">
                          <div className="mentor-slot">
                            <span className="material-symbols-outlined">calendar_today</span>
                            <span>Next: {DAYS[(new Date().getDay() + 1 + i) % 7]}, {nextDate.toLocaleDateString('en-US', {month:'short',day:'numeric'})}</span>
                          </div>
                          <button className="mentor-view-link">View Profile <span className="material-symbols-outlined" style={{fontSize:'14px'}}>arrow_forward</span></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {mentors.length === 0 && <p className="empty-state">No mentors found. Try adjusting your filters.</p>}
              </div>

              {mentors.length > 0 && (
                <div className="pagination">
                  <button className="page-btn" disabled><span className="material-symbols-outlined">chevron_left</span></button>
                  <button className="page-btn active">1</button>
                  <button className="page-btn">2</button>
                  <button className="page-btn">3</button>
                  <span className="page-dots">…</span>
                  <button className="page-btn">12</button>
                  <button className="page-btn"><span className="material-symbols-outlined">chevron_right</span></button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════
          3. MENTEE DASHBOARD
          ════════════════════════════════════════════════════════════ */}
      {view === 'dashboard' && (
        <div className="dash-layout">
          {dashSidebarOpen && <div className="dash-overlay" onClick={() => setDashSidebarOpen(false)} />}
          <aside className={`dash-sidebar ${dashSidebarOpen ? 'mobile-open' : ''}`}>
            <div className="dash-profile">
              <div className="dash-avatar">{dashProfile.name.charAt(0)}</div>
              <div>
                <div className="dash-profile-name">{dashProfile.name}</div>
                <div className="dash-profile-track">{dashProfile.track === 'career' ? '💼 Career' : '🎓 University'}</div>
              </div>
            </div>
            <nav className="dash-nav">
              {[
                { key:'overview', label:'Overview', icon:'dashboard' },
                { key:'sessions', label:'Sessions', icon:'calendar_today' },
                { key:'goals', label:'Goals', icon:'track_changes' },
              ].map(item => (
                <button key={item.key}
                  className={`dash-nav-item ${dashTab === item.key ? 'active' : ''}`}
                  onClick={() => setDashTab(item.key)}>
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="dash-mascot-card">
              <div className="dash-mascot-img">
                <span className="material-symbols-outlined" style={{fontSize:32, color:'var(--color-primary)'}}>psychology</span>
              </div>
              <p className="dash-mascot-text">You're doing great! Keep going.</p>
            </div>
          </aside>

          <button className="btn-menu" style={{position:'absolute', top:12, left:12, zIndex:50}}
            onClick={() => setDashSidebarOpen(!dashSidebarOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>

          <main className="dash-main">
            {dashTab === 'overview' && <>
              <h1 className="dash-greeting">
                Welcome back, <span>{dashProfile.name.split(' ')[0]}</span> 👋
              </h1>

              <div className="dash-cards">
                {/* Next Session */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3 className="dash-card-title">
                      <span className="material-symbols-outlined">event_upcoming</span> Next Session
                    </h3>
                  </div>
                  {bookings.filter(b => b.status === 'Confirmed').slice(0,1).map(b => {
                    const d = new Date(b.slotStart);
                    return (
                      <div key={b.id} className="session-item">
                        <div className="session-date">
                          <div className="session-day">{d.getDate()}</div>
                          <div className="session-month">{d.toLocaleString('en-US', {month:'short'})}</div>
                        </div>
                        <div className="session-details">
                          <div className="session-mentor">Session with Mentor #{b.mentorProfileId}</div>
                          <div className="session-track">{d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})} · 30 min</div>
                        </div>
                        <div className="session-actions">
                          <button className="btn-action-sm primary-action" onClick={() => setView('agenda')}>Prep</button>
                        </div>
                      </div>
                    );
                  })}
                  {bookings.filter(b => b.status === 'Confirmed').length === 0 && (
                    <div className="goal-empty">No upcoming sessions. <a href="#" onClick={() => setView('discover')} style={{color:'var(--color-primary)',fontWeight:600}}>Book one now</a>.</div>
                  )}
                </div>

                {/* Goals / School Targets */}
                <div className="dash-card">
                  <div className="dash-card-header">
                    <h3 className="dash-card-title">
                      <span className="material-symbols-outlined">track_changes</span>
                      {dashProfile.track === 'career' ? 'Active Goals' : 'School Targets'}
                    </h3>
                    {dashProfile.track === 'career' && <span className="badge-count">{goals.filter(g => !g.isDone).length}</span>}
                  </div>
                  {dashProfile.track === 'career' && <>
                    {goals.length === 0 && <div className="goal-empty">No goals yet. Goals appear after a session.</div>}
                    {goals.map(g => (
                      <div key={g.id} className={`goal-item ${g.isDone ? 'is-done' : ''}`}>
                        <button className={`goal-toggle ${g.isDone ? 'is-done' : ''}`}
                          onClick={() => toggleGoal(g)}>
                          {g.isDone && <span className="material-symbols-outlined" style={{fontSize:16}}>check</span>}
                        </button>
                        <span className="goal-text">{g.description}</span>
                      </div>
                    ))}
                  </>}
                  {dashProfile.track === 'university' && <>
                    {schoolTargets.length === 0 && <div className="goal-empty">No school targets yet. Add your first school.</div>}
                    {schoolTargets.map(s => (
                      <div key={s.id} className="school-item">
                        <div className="school-info">
                          <div className="school-name">{s.schoolName}</div>
                          <div className="school-meta">{s.country} · {s.major}</div>
                        </div>
                        <span className={`school-status ${s.status?.toLowerCase()}`} onClick={() => cycleSchoolStatus(s)} style={{cursor:'pointer'}}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </>}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="dash-card">
                <div className="dash-card-header">
                  <h3 className="dash-card-title">
                    <span className="material-symbols-outlined">bolt</span> Quick Actions
                  </h3>
                </div>
                <div style={{display:'flex', gap:'var(--space-md)', flexWrap:'wrap'}}>
                  <button className="btn-action-sm primary-action" onClick={() => setView('discover')}>Find a Mentor</button>
                  <button className="btn-action-sm outline-action" onClick={() => setView('agenda')}>Prep for Session</button>
                </div>
              </div>
            </>}

            {dashTab === 'sessions' && <>
              <h1 className="dash-greeting">Your <span>Sessions</span></h1>
              <div className="dash-card">
                <div className="dash-card-header"><h3 className="dash-card-title"><span className="material-symbols-outlined">calendar_today</span> All Sessions</h3></div>
                <div className="session-list">
                  {bookings.length === 0 && <div className="goal-empty">No sessions yet.</div>}
                  {bookings.map(b => {
                    const d = new Date(b.slotStart);
                    return (
                      <div key={b.id} className="session-item">
                        <div className="session-date">
                          <div className="session-day">{d.getDate()}</div>
                          <div className="session-month">{d.toLocaleString('en-US', {month:'short'})}</div>
                        </div>
                        <div className="session-details">
                          <div className="session-mentor">Mentor #{b.mentorProfileId}</div>
                          <div className="session-track">{d.toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})} · {b.status}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>}

            {dashTab === 'goals' && <>
              <h1 className="dash-greeting">{dashProfile.track === 'career' ? <><span>Goals</span> Tracker</> : <><span>School</span> Targets</>}</h1>
              <div className="dash-card">
                {dashProfile.track === 'career' && <>
                  <div className="goal-list">
                    {goals.length === 0 && <div className="goal-empty">No goals recorded yet.</div>}
                    {goals.map(g => (
                      <div key={g.id} className={`goal-item ${g.isDone ? 'is-done' : ''}`}>
                        <button className={`goal-toggle ${g.isDone ? 'is-done' : ''}`} onClick={() => toggleGoal(g)}>
                          {g.isDone && <span className="material-symbols-outlined" style={{fontSize:16}}>check</span>}
                        </button>
                        <span className="goal-text">{g.description}</span>
                      </div>
                    ))}
                  </div>
                </>}
                {dashProfile.track === 'university' && (
                  <div className="school-list">
                    {schoolTargets.length === 0 && <div className="goal-empty">No school targets yet.</div>}
                    {schoolTargets.map(s => (
                      <div key={s.id} className="school-item">
                        <div className="school-info">
                          <div className="school-name">{s.schoolName}</div>
                          <div className="school-meta">{s.country} · {s.major}{s.deadline ? ` · Deadline: ${new Date(s.deadline).toLocaleDateString()}` : ''}</div>
                        </div>
                        <span className={`school-status ${s.status?.toLowerCase()}`} onClick={() => cycleSchoolStatus(s)} style={{cursor:'pointer'}}>
                          {s.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>}
          </main>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════
          4. MENTOR PROFILE & BOOKING
          ════════════════════════════════════════════════════════════ */}
      {view === 'mentor' && selectedMentor && (
        <main className="mentor-profile-container">
          <button className="profile-back" onClick={() => { setView('discover'); setSelectedMentor(null); setSelectedSlot(null); setBookingModal(null); }}>
            <span className="material-symbols-outlined">arrow_back</span> Back to Mentors
          </button>

          <div className="profile-layout">
            <div className="profile-left">
              <div className="profile-photo-card">
                <div className="profile-photo">
                  <img src={MENTOR_PHOTOS[selectedMentor.id % MENTOR_PHOTOS.length]} alt={selectedMentor.name}
                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                  <div className="profile-photo-fallback" style={{display:'none'}}>{selectedMentor.name.charAt(0)}</div>
                </div>
              </div>

              <div className="profile-info-card">
                <h1 className="profile-name">{selectedMentor.name}</h1>
                <p className="profile-role-full">{(selectedMentor.company || selectedMentor.university) ? `${selectedMentor.roleLevel || ''} at ${selectedMentor.company || selectedMentor.university}` : (selectedMentor.industry || selectedMentor.destinationCountry || 'Mentor')}</p>

                {selectedMentor.bio && <p className="profile-bio-full">"{selectedMentor.bio}"</p>}

                <div className="profile-tags">
                  {selectedMentor.industry && <span className="mentor-tag">{selectedMentor.industry}</span>}
                  {selectedMentor.specialism && <span className="mentor-tag">{selectedMentor.specialism}</span>}
                  {selectedMentor.destinationCountry && <span className="mentor-tag">{selectedMentor.destinationCountry}</span>}
                  {selectedMentor.hasScholarshipExperience && <span className="mentor-tag">🎖 Scholarship Experience</span>}
                  {selectedMentor.targetMajor && <span className="mentor-tag">{selectedMentor.targetMajor}</span>}
                </div>

                <hr className="profile-divider" />

                <div className="profile-detail-row">
                  <span className="material-symbols-outlined">language</span>
                  <span>Timezone: Asia/Yangon (UTC+6:30)</span>
                </div>
                <div className="profile-detail-row">
                  <span className="material-symbols-outlined">schedule</span>
                  <span>Session length: 30 minutes</span>
                </div>
                <div className="profile-detail-row">
                  <span className="material-symbols-outlined">{selectedMentor.track === 'career' ? 'work' : 'school'}</span>
                  <span>Track: {selectedMentor.track === 'career' ? 'Career Growth' : 'University Applications'}</span>
                </div>
              </div>
            </div>

            <div className="profile-right">
              <div className="booking-card">
                <h2 className="booking-card-title">Book a Session</h2>
                <div className="booking-timezone">
                  <span className="material-symbols-outlined">schedule</span>
                  UTC+6:30 Myanmar Time
                </div>

                <label className="availability-label">Available This Week</label>
                {[0,1,2,3,4].map(dayOffset => {
                  const date = new Date();
                  date.setDate(date.getDate() + dayOffset);
                  const dayLabel = dayOffset === 0 ? 'Today' : dayOffset === 1 ? 'Tomorrow' : DAYS[date.getDay()];
                  return (
                    <div key={dayOffset}>
                      <div className="slot-day-label">{dayLabel}, {date.toLocaleDateString('en-US', {month:'short',day:'numeric'})}</div>
                      <div className="availability-grid">
                        {['09:00','09:30','10:00','10:30','11:00','14:00','14:30','15:00'].map(time => {
                          const slotDate = new Date(date);
                          const [h, m] = time.split(':');
                          slotDate.setHours(parseInt(h), parseInt(m), 0, 0);
                          const slotKey = slotDate.toISOString();
                          return (
                            <button key={slotKey}
                              className={`slot-pill ${selectedSlot === slotKey ? 'selected' : ''}`}
                              onClick={() => setSelectedSlot(slotKey)}>
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <button className="btn-book"
                  disabled={!selectedSlot}
                  onClick={() => setBookingModal('confirm')}>
                  {selectedSlot ? `Book ${new Date(selectedSlot).toLocaleDateString('en-US', {weekday:'short',month:'short',day:'numeric'})} at ${new Date(selectedSlot).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'})}` : 'Select a time slot'}
                </button>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* ════════════════════════════════════════════════════════════
          5. AGENDA VIEW
          ════════════════════════════════════════════════════════════ */}
      {view === 'agenda' && (
        <main className="main-wrapper">
          <div className="agenda-view">
            <button className="profile-back" onClick={() => setView('dashboard')}>
              <span className="material-symbols-outlined">arrow_back</span> Back to Dashboard
            </button>
            <h1 className="section-title">Session Agenda</h1>

            {!agenda && (
              <form className="form-card" onSubmit={handleAgendaSubmit}>
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">I'm looking for</legend>
                  <div className="track-grid">
                    {TRACKS.map(t => (
                      <label key={t.value} className={`track-card ${agendaTrack === t.value ? 'selected' : ''}`}>
                        <input type="radio" name="agendaTrack" value={t.value} checked={agendaTrack === t.value} onChange={e => setAgendaTrack(e.target.value)} />
                        <span className="track-emoji">{t.emoji}</span>
                        <span className="track-label">{t.label}</span>
                        <span className="track-desc">{t.desc}</span>
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

            {agenda && (
              <>
                <section className="agenda-panel">
                  <div className="agenda-header"><span className="agenda-header-icon">📋</span><h2>Your Session Agenda</h2><span className="track-badge">{agendaTrack}</span></div>
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
                </section>
                <div className="agenda-back-nav"><button className="btn-new-session" onClick={resetAgenda}>+ New Session Prep</button></div>
              </>
            )}
          </div>
        </main>
      )}

      {/* ═══ TIMEZONE BANNER (not on dashboard) ═══ */}
      {view !== 'dashboard' && view !== 'landing' && (
        <div className="timezone-banner">
          <span>All session times are automatically adjusted to your timezone:</span>
          <strong>UTC+6:30 (Myanmar Time)</strong>
        </div>
      )}

      {/* ═══ FOOTER (not on dashboard) ═══ */}
      {view !== 'dashboard' && view !== 'landing' && (
        <footer className="footer">
          <div className="footer-grid">
            <div className="footer-brand-col">
              <div className="footer-brand">GuidedUp</div>
              <p className="footer-brand-desc">Empowering Myanmar's next generation of leaders through structured mentorship and global opportunities.</p>
            </div>
            <div><h4 className="footer-heading">Programs</h4><ul className="footer-links"><li><a href="#">University Track</a></li><li><a href="#">Career Track</a></li><li><a href="#">Scholarship Guide</a></li></ul></div>
            <div><h4 className="footer-heading">Support</h4><ul className="footer-links"><li><a href="#">Contact Us</a></li><li><a href="#">Privacy Policy</a></li><li><a href="#">Terms of Service</a></li></ul></div>
            <div><h4 className="footer-heading">Connect</h4><div className="social-links"><a className="social-btn" href="#"><span className="material-symbols-outlined">face_nod</span></a><a className="social-btn" href="#"><span className="material-symbols-outlined">link</span></a></div></div>
          </div>
          <div className="footer-bottom"><p>© 2024 GuidedUp Myanmar. Bridging the gap to future success.</p></div>
        </footer>
      )}

      {/* ═══ BOOKING MODAL ═══ */}
      {bookingModal === 'confirm' && (
        <div className="modal-overlay" onClick={() => setBookingModal(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <h2 className="modal-title">Confirm Booking</h2>
            <div className="modal-body">
              <p><strong>Mentor:</strong> {selectedMentor?.name}</p>
              <p><strong>Date:</strong> {selectedSlot ? new Date(selectedSlot).toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'}) : ''}</p>
              <p><strong>Time:</strong> {selectedSlot ? new Date(selectedSlot).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : ''} (30 min)</p>
              <p><strong>Timezone:</strong> UTC+6:30 (Myanmar Time)</p>
              <p style={{marginTop:'12px',fontSize:'0.82rem',color:'var(--color-text-muted)',fontStyle:'italic'}}>
                By booking, you agree to our 14-day policy: one session per mentor every two weeks.
              </p>
              {bookingError && <p style={{color:'var(--color-error)',marginTop:8,fontSize:'0.82rem'}}>⚠ {bookingError}</p>}
            </div>
            <div className="modal-actions">
              <button className="btn-modal btn-modal-secondary" onClick={() => setBookingModal(null)}>Cancel</button>
              <button className="btn-modal btn-modal-primary" onClick={handleBookSession} disabled={bookingLoading}>
                {bookingLoading ? 'Booking…' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}

      {bookingModal === 'success' && (
        <div className="modal-overlay" onClick={() => { setBookingModal(null); setSelectedSlot(null); setView('dashboard'); }}>
          <div className="modal-card" onClick={e => e.stopPropagation()} style={{textAlign:'center'}}>
            <div className="booking-success-icon"><span className="material-symbols-outlined">check_circle</span></div>
            <h2 className="modal-title">Session Booked!</h2>
            <div className="modal-body">
              <p>Your session with <strong>{selectedMentor?.name}</strong> is confirmed.</p>
              <p style={{marginTop:8,fontSize:'0.85rem',color:'var(--color-text-muted)'}}>
                {selectedSlot ? new Date(selectedSlot).toLocaleDateString('en-US', {weekday:'long',month:'long',day:'numeric'}) : ''}
                <br />
                {selectedSlot ? new Date(selectedSlot).toLocaleTimeString('en-US', {hour:'2-digit',minute:'2-digit'}) : ''} · 30 min
              </p>
              <p style={{marginTop:12,fontSize:'0.82rem',fontStyle:'italic',color:'var(--color-text-muted)'}}>
                Submit your 3 questions before the session to generate a custom agenda.
              </p>
            </div>
            <div className="modal-actions">
              <button className="btn-modal btn-modal-primary" onClick={() => { setBookingModal(null); setSelectedSlot(null); setView('agenda'); }}>
                Prep Questions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
