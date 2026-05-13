import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import '../styles/Sprint.css';

export const FacilitatorOrgsPage = () => {
    const navigate = useNavigate();
    const { user, roles, logout } = useAuthStore();
    const { organizations, isLoading, error, fetchOrganizations, clearError } = useSprintStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrganizations(1);
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const filtered = organizations.filter((org) =>
        org.name?.toLowerCase().includes(search.toLowerCase()) ||
        org.industry?.toLowerCase().includes(search.toLowerCase())
    );

    const statusColor = (status) => {
        const map = { active: '#16a34a', suspended: '#dc2626', pending: '#d97706', rejected: '#dc2626' };
        return map[status] || '#64748b';
    };

    return (
        <div className="sprint-container">
            <header className="sprint-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Zylo AI Platform</h1>
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
                        <Link to="/facilitator/organizations" className="nav-link active">Organizations</Link>
                        <Link to="/dashboard" className="nav-link">Dashboard</Link>
                    </nav>
                </aside>

                <section className="sprint-content">
                    <div className="page-header">
                        <div>
                            <h2>Client Organizations</h2>
                            <p className="page-subtitle">Select an organization to manage its sprints</p>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error">
                            {error}
                            <button onClick={clearError} className="btn-close">×</button>
                        </div>
                    )}

                    <div className="filters-section">
                        <input
                            type="text"
                            placeholder="Search organizations..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="search-input"
                        />
                        <span className="filter-info">{filtered.length} organizations</span>
                    </div>

                    {isLoading ? (
                        <div className="loading-state">Loading organizations...</div>
                    ) : filtered.length > 0 ? (
                        <div className="org-cards-grid">
                            {filtered.map((org) => (
                                <div
                                    key={org.id}
                                    className="org-card"
                                    onClick={() => navigate(`/facilitator/organizations/${org.id}/sprints`)}
                                >
                                    <div className="org-card-logo">
                                        {org.logo_url ? (
                                            <img src={org.logo_url} alt={org.name} />
                                        ) : (
                                            <span className="org-initials">
                                                {org.name?.charAt(0).toUpperCase()}
                                            </span>
                                        )}
                                    </div>
                                    <div className="org-card-info">
                                        <h3>{org.name}</h3>
                                        <p>{org.industry || 'No industry'}</p>
                                        <div className="org-card-meta">
                                            <span className="org-headcount">
                                                👥 {org.headcount || 'N/A'}
                                            </span>
                                            <span
                                                className="status-dot"
                                                style={{ background: statusColor(org.status) }}
                                            />
                                            <span style={{ color: statusColor(org.status), fontSize: '12px', fontWeight: '600' }}>
                                                {org.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="org-card-arrow">→</div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No organizations found</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};
