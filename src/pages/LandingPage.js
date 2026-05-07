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
            navigate('/signup');
        }
    };

    return (
        <div className="landing-page">
            <nav className="landing-nav">
                <div className="nav-container">
                    <div className="logo">Zylo AI</div>
                    <div className="nav-links">
                        <button onClick={() => navigate('/login')} className="nav-btn">
                            Sign In
                        </button>
                        <button onClick={() => navigate('/signup')} className="nav-btn primary">
                            Sign Up
                        </button>
                    </div>
                </div>
            </nav>

            <header className="landing-hero">
                <div className="hero-content">
                    <h1>AI Readiness Assessment Platform</h1>
                    <p>Transform your organization with data-driven AI implementation strategies</p>
                    <button onClick={handleGetStarted} className="btn-cta">
                        {isAuthenticated ? 'Go to Dashboard' : 'Get Started Today'}
                    </button>
                </div>
            </header>

            <section className="features-section">
                <h2>Our Platform Offers</h2>
                <div className="features-grid">
                    <div className="feature-card">
                        <h3>5-Day Sprint Assessment</h3>
                        <p>Comprehensive analysis of your business processes to identify AI opportunities</p>
                    </div>
                    <div className="feature-card">
                        <h3>AI Readiness Matrix</h3>
                        <p>Data-driven scoring across process maturity, data readiness, and integration complexity</p>
                    </div>
                    <div className="feature-card">
                        <h3>90-Day Roadmap</h3>
                        <p>Detailed implementation strategy with prioritized AI opportunities</p>
                    </div>
                    <div className="feature-card">
                        <h3>Expert Facilitators</h3>
                        <p>Work with seasoned AI strategists and technical architects</p>
                    </div>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2026 Zylo Solutions. All rights reserved.</p>
            </footer>
        </div>
    );
};
