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

export const AdminOrgSprintsPage = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const {
        sprints, totalSprints, sprintsPage, sprintsPageSize,
        isLoading, error,
        fetchSprints, createSprint, clearError,
    } = useSprintStore();

    const [orgName, setOrgName] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        engagement_name: '',
        scheduled_start: '',
        scheduled_end: '',
        notes: '',
    });

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchSprints(orgId, 1);
    }, [orgId]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSprint(orgId, {
                ...form,
                scheduled_start: new Date(form.scheduled_start + 'T00:00:00').toISOString(),
                scheduled_end: new Date(form.scheduled_end + 'T23:59:59').toISOString(),
            });
            setShowCreateModal(false);
            setForm({ title: '', engagement_name: '', scheduled_start: '', scheduled_end: '', notes: '' });
        } catch (_) {}
    };

    const totalPages = Math.ceil(totalSprints / sprintsPageSize);

    return (
        <div className="super-admin-container">
            <header className="admin-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Zylo Admin</h1>
                        <span className="user-type">Super Administrator</span>
                    </div>
                    <div className="header-actions">
                        <span className="user-info">{user?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                <aside className="admin-sidebar">
                    <nav className="sidebar-nav">
                        <Link to="/admin" className="nav-link">Dashboard</Link>
                        <Link to="/admin/facilitators" className="nav-link">Facilitators</Link>
                        <Link to="/admin/organizations" className="nav-link active">Organizations</Link>
                        <Link to="/admin/notifications" className="nav-link">Notifications</Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                <Link to={`/admin/organizations/${orgId}`} style={{ color: '#64748b', textDecoration: 'none', fontSize: '14px' }}>
                                    ← Back to Organization
                                </Link>
                            </div>
                            <h2 style={{ margin: 0 }}>Sprints</h2>
                            <p style={{ color: '#64748b', margin: '4px 0 0', fontSize: '14px' }}>
                                {totalSprints} sprint{totalSprints !== 1 ? 's' : ''} for this organization
                            </p>
                        </div>
                        <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                            + New Sprint
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={clearError} className="btn-close">×</button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading">Loading sprints...</div>
                    ) : sprints.length > 0 ? (
                        <>
                            <div className="sprints-list-grid">
                                {sprints.map((sprint) => (
                                    <div
                                        key={sprint.id}
                                        className="sprint-card"
                                        onClick={() => navigate(`/admin/sprints/${sprint.id}`)}
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
                        <div className="no-data">
                            <p>No sprints yet for this organization.</p>
                            <button onClick={() => setShowCreateModal(true)} className="btn-primary" style={{ marginTop: '12px' }}>
                                Create First Sprint
                            </button>
                        </div>
                    )}
                </section>
            </main>

            {showCreateModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-wide">
                        <h3>Create New Sprint</h3>
                        <form onSubmit={handleCreate} className="sprint-form">
                            <div className="form-group">
                                <label>Sprint Title *</label>
                                <input
                                    required
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    placeholder="e.g. TechCorp AI Readiness Sprint"
                                />
                            </div>
                            <div className="form-group">
                                <label>Engagement Name</label>
                                <input
                                    value={form.engagement_name}
                                    onChange={(e) => setForm({ ...form, engagement_name: e.target.value })}
                                    placeholder="e.g. Q2 AI Strategy"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Date *</label>
                                    <input
                                        required
                                        type="date"
                                        value={form.scheduled_start}
                                        onChange={(e) => setForm({ ...form, scheduled_start: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Date *</label>
                                    <input
                                        required
                                        type="date"
                                        value={form.scheduled_end}
                                        onChange={(e) => setForm({ ...form, scheduled_end: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    value={form.notes}
                                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                    placeholder="Internal notes..."
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Creating...' : 'Create Sprint'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
