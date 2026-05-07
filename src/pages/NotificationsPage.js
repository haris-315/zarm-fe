import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorsList.css';

export const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const {
        organizations,
        isLoading,
        error,
        fetchOrganizations,
        clearError,
    } = useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchOrganizations(1, 100);
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
                        <Link to="/admin" className="nav-link">
                            Dashboard
                        </Link>
                        <Link to="/admin/facilitators" className="nav-link">
                            Facilitators
                        </Link>
                        <Link to="/admin/organizations" className="nav-link">
                            Organizations
                        </Link>
                        <Link to="/admin/notifications" className="nav-link active">
                            Notifications
                        </Link>
                        <Link to="/admin/settings" className="nav-link">
                            Settings
                        </Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header">
                        <h2>Notifications & Approvals</h2>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={clearError} className="btn-close">
                                ×
                            </button>
                        </div>
                    )}

                    <div className="notifications-list">
                        <h3>Pending Organization Approvals</h3>
                        {isLoading ? (
                            <div className="loading">Loading notifications...</div>
                        ) : pendingOrganizations.length > 0 ? (
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Organization Name</th>
                                            <th>Industry</th>
                                            <th>Contact Person</th>
                                            <th>Registration Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingOrganizations.map((org) => (
                                            <tr key={org.id} style={{ backgroundColor: '#fffbe6' }}>
                                                <td>
                                                    <strong>{org.name}</strong>
                                                </td>
                                                <td>{org.industry || '—'}</td>
                                                <td>{org.primary_contact_name || '—'}</td>
                                                <td>{org.created_at ? new Date(org.created_at).toLocaleDateString() : 'N/A'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <Link
                                                            to={`/admin/organizations/${org.id}`}
                                                            className="btn-primary"
                                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                                        >
                                                            Review & Approve
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="no-data">
                                <p>No new notifications at this time.</p>
                            </div>
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};
