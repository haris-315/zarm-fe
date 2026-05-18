import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import '../styles/Landing.css';

export const LandingPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();

    const handleGetStarted = () => {
        if (isAuthenticated) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="landing-page">
            {/* Dev banner */}
            <div className="dev-banner">
                <span className="dev-banner-dot" />
                <strong>Private Beta — Testing Environment</strong>
                &nbsp;· This platform is under active development. Features may change without notice.
            </div>

            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="logo">
                        <span className="logo-mark">Z</span>
                        <span className="logo-text">ylo AI</span>
                        <span className="logo-badge">BETA</span>
                    </div>
                    <div className="nav-links">
                        <button onClick={() => navigate('/login')} className="nav-btn">Sign In</button>
                        <button onClick={() => navigate('/signup')} className="nav-btn primary">Request Access</button>
                    </div>
                </div>
            </nav>

            <header className="landing-hero">
                <div className="hero-bg-grid" />
                <div className="hero-content">
                    <div className="hero-eyebrow">
                        <span className="eyebrow-dot" />
                        AI Strategy &amp; Readiness
                    </div>
                    <h1>
                        Know exactly where<br />
                        <span className="hero-highlight">AI fits your business</span>
                    </h1>
                    <p>
                        A structured 5-day sprint that maps your processes, scores AI readiness,
                        and produces a prioritised 90-day implementation roadmap.
                    </p>
                    <div className="hero-actions">
                        <button onClick={handleGetStarted} className="btn-cta">
                            {isAuthenticated ? 'Go to Dashboard' : 'Get Started'}
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
                        </button>
                        <span className="hero-note">Invite-only during beta</span>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="sprint-timeline">
                        {['Discovery', 'Analysis', 'Scoring', 'Strategy', 'Delivery'].map((day, i) => (
                            <div key={i} className={`timeline-step ${i < 3 ? 'done' : i === 3 ? 'active' : ''}`}>
                                <div className="timeline-pip">
                                    {i < 3
                                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                                        : <span>{i + 1}</span>
                                    }
                                </div>
                                <span className="timeline-label">{day}</span>
                            </div>
                        ))}
                    </div>
                    <div className="score-card">
                        <div className="score-row">
                            <span>Process Maturity</span>
                            <div className="score-bar"><div className="score-fill" style={{ width: '74%' }} /><span>74</span></div>
                        </div>
                        <div className="score-row">
                            <span>Data Readiness</span>
                            <div className="score-bar"><div className="score-fill" style={{ width: '61%' }} /><span>61</span></div>
                        </div>
                        <div className="score-row">
                            <span>Integration Fit</span>
                            <div className="score-bar"><div className="score-fill" style={{ width: '88%' }} /><span>88</span></div>
                        </div>
                        <div className="score-label">AI Readiness Matrix — sample output</div>
                    </div>
                </div>
            </header>

            <section className="features-section">
                <div className="section-label">What's included</div>
                <h2>A complete readiness assessment, start to finish</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                        </div>
                        <h3>5-Day Sprint</h3>
                        <p>Structured workshops across Discovery, Analysis, Scoring, Strategy, and Delivery — run by a dedicated facilitator.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20V10" /><path d="M18 20V4" /><path d="M6 20v-4" /></svg>
                        </div>
                        <h3>AI Readiness Matrix</h3>
                        <p>Scored across process maturity, data readiness, and integration complexity — with per-finding evidence.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        </div>
                        <h3>90-Day Roadmap</h3>
                        <p>A prioritised, time-boxed implementation plan with effort estimates and expected business impact.</p>
                    </div>
                    <div className="feature-card">
                        <div className="feature-icon">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                        <h3>Expert Facilitators</h3>
                        <p>Seasoned AI strategists and technical architects guide your team through every session.</p>
                    </div>
                </div>
            </section>

            <section className="dev-callout">
                <div className="dev-callout-inner">
                    <div className="dev-callout-icon">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                    </div>
                    <div>
                        <h3>This is a testing environment</h3>
                        <p>
                            Zylo AI is currently in <strong>private beta</strong>. Data may be reset, features are incomplete,
                            and things will break. If you have access credentials, <button onClick={() => navigate('/login')} className="inline-link">sign in here</button>.
                        </p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <div className="footer-inner">
                    <div className="footer-logo">
                        <span className="logo-mark small">Z</span>
                        <span>Zylo AI</span>
                        <span className="logo-badge dark">BETA</span>
                    </div>
                    <p>&copy; 2026 Zylo Solutions — Private Testing Environment</p>
                </div>
            </footer>
        </div>
    );
};
