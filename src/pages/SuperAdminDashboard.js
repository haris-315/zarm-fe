import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/SuperAdmin.css';

export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const { 
        facilitators, 
        totalFacilitators, 
        organizations,
        totalOrganizations,
        isLoading, 
        error, 
        fetchFacilitators,
        fetchOrganizations
    } = useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        console.log('Fetching dashboard data');
        fetchFacilitators();
        fetchOrganizations(1, 100); // Fetch a larger batch to count pending
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const pendingOrganizations = organizations.filter(org => org.status === 'pending');

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
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                <aside className="admin-sidebar">
                    <nav className="sidebar-nav">
                        <Link to="/admin" className="nav-link active">
                            Dashboard
                        </Link>
                        <Link to="/admin/facilitators" className="nav-link">
                            Facilitators
                        </Link>
                        <Link to="/admin/organizations" className="nav-link">
                            Organizations
                        </Link>
                        <Link to="/admin/notifications" className="nav-link" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            Notifications
                            {pendingOrganizations.length > 0 && (
                                <span style={{ 
                                    backgroundColor: '#ff4d4f', 
                                    color: 'white', 
                                    borderRadius: '10px', 
                                    padding: '2px 8px', 
                                    fontSize: '10px',
                                    fontWeight: 'bold'
                                }}>
                                    {pendingOrganizations.length}
                                </span>
                            )}
                        </Link>
                        <Link to="/admin/settings" className="nav-link">
                            Settings
                        </Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="welcome-card">
                        <h2>Super Admin Dashboard</h2>
                        <p>Manage the platform and all facilitators</p>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    <div className="admin-grid">
                        <div className="stat-card">
                            <h3>Total Facilitators</h3>
                            <p className="stat-value">{totalFacilitators}</p>
                            <p className="stat-label">Active Facilitators</p>
                        </div>

                        <div className="stat-card">
                            <h3>Organizations</h3>
                            <p className="stat-value">{totalOrganizations}</p>
                            <p className="stat-label">Total Organizations</p>
                        </div>

                        <div className="stat-card" style={{ borderLeftColor: pendingOrganizations.length > 0 ? '#faad14' : '#2c3e50' }}>
                            <h3>Pending Approvals</h3>
                            <p className="stat-value" style={{ color: pendingOrganizations.length > 0 ? '#faad14' : '#2c3e50' }}>
                                {pendingOrganizations.length}
                            </p>
                            <p className="stat-label">Organizations Awaiting Review</p>
                        </div>

                        <div className="stat-card">
                            <h3>Recent Signups</h3>
                            <p className="stat-value">{organizations.length}</p>
                            <p className="stat-label">Last 30 Days</p>
                        </div>
                    </div>

                    {pendingOrganizations.length > 0 && (
                        <section className="notifications-section" style={{ marginBottom: '30px' }}>
                            <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                🔔 Action Required: Pending Approvals
                            </h3>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Organization Name</th>
                                            <th>Industry</th>
                                            <th>Primary Contact</th>
                                            <th>Email</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingOrganizations.map((org) => (
                                            <tr key={org.id} style={{ backgroundColor: '#fffbe6' }}>
                                                <td><strong>{org.name}</strong></td>
                                                <td>{org.industry || '—'}</td>
                                                <td>{org.primary_contact_name || '—'}</td>
                                                <td>{org.primary_contact_email}</td>
                                                <td>
                                                    <Link
                                                        to={`/admin/organizations/${org.id}`}
                                                        className="btn-primary"
                                                        style={{ padding: '4px 12px', fontSize: '12px' }}
                                                    >
                                                        Review & Approve
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}

                    <div className="quick-actions">
                        <h3>Quick Actions</h3>
                        <div className="action-buttons">
                            <Link to="/admin/facilitators/new" className="btn-action">
                                + Add New Facilitator
                            </Link>
                            <Link to="/admin/facilitators" className="btn-action secondary">
                                View All Facilitators
                            </Link>
                            <Link to="/admin/organizations" className="btn-action secondary">
                                Manage Organizations
                            </Link>
                        </div>
                    </div>

                    <section className="recent-facilitators">
                        <h3>Recent Facilitators</h3>
                        {isLoading ? (
                            <div className="loading">Loading...</div>
                        ) : facilitators.length > 0 ? (
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Name</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {facilitators.slice(0, 5).map((facilitator) => (
                                            <tr key={facilitator.id}>
                                                <td>{facilitator.email}</td>
                                                <td>{facilitator.full_name || 'N/A'}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge status-${facilitator.status}`}
                                                    >
                                                        {facilitator.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Link
                                                        to={`/admin/facilitators/${facilitator.id}`}
                                                        className="link-action"
                                                    >
                                                        View
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data">No facilitators yet</div>
                        )}
                    </section>
                </section>
            </main>
        </div>
    );
};
