import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import '../styles/Sprint.css';

const DAY_LABELS = ['Day 1: Discovery', 'Day 2: Analysis', 'Day 3: Scoring', 'Day 4: Strategy', 'Day 5: Delivery'];

const STATUS_COLORS = {
    planning: '#64748b',
    in_progress: '#2563eb',
    completed: '#16a34a',
};

export const OrgSprintsPage = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const {
        sprints, totalSprints, sprintsPage, sprintsPageSize,
        isLoading, error,
        fetchSprints, clearError,
    } = useSprintStore();

    const [orgName, setOrgName] = useState('');

    useEffect(() => {
        fetchSprints(orgId, 1);
        const { organizations } = useSprintStore.getState();
        const org = organizations.find((o) => o.id === orgId);
        if (org) setOrgName(org.name);
    }, [orgId]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const totalPages = Math.ceil(totalSprints / sprintsPageSize);

    return (
        <div className="sprint-container">
            <header className="sprint-header">
                <div className="header-content">
                    <div className="logo-section">
                        <Link to="/facilitator/organizations" className="back-link">← Organizations</Link>
                        <h1>{orgName || 'Organization'}</h1>
                        <span className="user-type-badge">Facilitator</span>
                    </div>
                    <div className="header-actions">
                        <span className="user-info">{user?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </header>

            <main className="sprint-main">
                <aside className="sprint-sidebar">
                    <nav className="sidebar-nav">
                        <Link to="/facilitator/organizations" className="nav-link">← All Organizations</Link>
                        <span className="nav-link active">Sprints</span>
                    </nav>
                </aside>

                <section className="sprint-content">
                    <div className="page-header">
                        <div>
                            <h2>Sprints</h2>
                            <p className="page-subtitle">{totalSprints} sprint{totalSprints !== 1 ? 's' : ''} for this organization</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                            <button onClick={clearError} className="btn-close">×</button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading-state">Loading sprints...</div>
                    ) : sprints.length > 0 ? (
                        <>
                            <div className="sprints-list-grid">
                                {sprints.map((sprint) => (
                                    <div
                                        key={sprint.id}
                                        className="sprint-card"
                                        onClick={() => navigate(`/facilitator/sprints/${sprint.id}`)}
                                    >
                                        <div className="sprint-card-header">
                                            <h3>{sprint.title}</h3>
                                            <span
                                                className="sprint-status-badge"
                                                style={{ background: STATUS_COLORS[sprint.status] || '#64748b' }}
                                            >
                                                {sprint.status}
                                            </span>
                                        </div>
                                        {sprint.engagement_name && (
                                            <p className="sprint-engagement">{sprint.engagement_name}</p>
                                        )}
                                        <div className="sprint-day-progress">
                                            {DAY_LABELS.map((label, i) => (
                                                <div
                                                    key={i}
                                                    className={`day-pip ${i < sprint.current_day ? 'completed' : i === sprint.current_day - 1 ? 'current' : ''}`}
                                                    title={label}
                                                />
                                            ))}
                                        </div>
                                        <div className="sprint-card-footer">
                                            <span>Day {sprint.current_day} of 5</span>
                                            <span>
                                                {new Date(sprint.scheduled_start).toLocaleDateString()} →{' '}
                                                {new Date(sprint.scheduled_end).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="pagination">
                                    <button
                                        onClick={() => fetchSprints(orgId, sprintsPage - 1)}
                                        disabled={sprintsPage === 1}
                                        className="btn-pagination"
                                    >
                                        ← Previous
                                    </button>
                                    <span className="page-info">Page {sprintsPage} of {totalPages}</span>
                                    <button
                                        onClick={() => fetchSprints(orgId, sprintsPage + 1)}
                                        disabled={sprintsPage === totalPages}
                                        className="btn-pagination"
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <p>No sprints have been created for this organization yet.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
