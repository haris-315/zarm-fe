import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { userAPI } from '../api';
import { useAuthStore } from '../context/authStore';
import '../styles/Dashboard.css';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, roles, organization, logout } = useAuthStore();
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Redirect super admin to admin dashboard
        if (roles.includes('super_admin') || user?.user_type === 'super_admin') {
            navigate('/admin', { replace: true });
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                const sprintsData = await userAPI.listSprints();
                setSprints(sprintsData);
            } catch (err) {
                setError('Failed to load sprints');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [roles, navigate, user?.user_type]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getUserTypeLabel = (userType) => {
        const types = {
            super_admin: 'Super Admin',
            facilitator: 'Facilitator/Analyst',
            organization: 'Organization',
        };
        return types[userType] || userType;
    };

    return (
        <div className="dashboard-container">
            <header className="dashboard-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Zylo AI Platform</h1>
                        <span className="user-type">{getUserTypeLabel(user?.user_type)}</span>
                    </div>
                    <div className="header-actions">
                        <span className="user-info">{user?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="dashboard-main">
                <aside className="sidebar">
                    <nav className="sidebar-nav">
                        <a href="#overview" className="nav-link active">
                            Overview
                        </a>
                        {user?.user_type === 'super_admin' && (
                            <>
                                <a href="#users" className="nav-link">
                                    Users
                                </a>
                                <a href="#organizations" className="nav-link">
                                    Organizations
                                </a>
                                <a href="#settings" className="nav-link">
                                    Settings
                                </a>
                            </>
                        )}
                        {user?.user_type === 'facilitator' && (
                            <>
                                <a href="#sprints" className="nav-link">
                                    Sprints
                                </a>
                                <a href="#clients" className="nav-link">
                                    Clients
                                </a>
                                <a href="#reports" className="nav-link">
                                    Reports
                                </a>
                            </>
                        )}
                        {(user?.user_type === 'organization' || roles.includes('org_admin') || roles.includes('manager')) && (
                            <>
                                <a href="#sprints" className="nav-link">
                                    My Sprints
                                </a>
                                <Link to="/org/members" className="nav-link">
                                    Team Members
                                </Link>
                                <a href="#insights" className="nav-link">
                                    Insights
                                </a>
                            </>
                        )}
                    </nav>
                </aside>

                <section className="dashboard-content">
                    <div className="welcome-card">
                        <div className="user-avatar-section">
                            <div className="avatar-preview">
                                {user?.avatar_url ? (
                                    <img src={user.avatar_url} alt="Profile" />
                                ) : (
                                    <span style={{ fontSize: '24px', color: '#cbd5e1' }}>
                                        {user?.email?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className="avatar-info">
                                <h2>Welcome, {user?.full_name || user?.email}!</h2>
                                <label className="avatar-upload-btn">
                                    {loading ? 'Uploading...' : 'Update Photo'}
                                    <input 
                                        type="file" 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                try {
                                                    await useAuthStore.getState().updateAvatar(file);
                                                } catch (err) {
                                                    console.error('Failed to upload avatar:', err);
                                                }
                                            }
                                        }}
                                        disabled={loading}
                                    />
                                </label>
                            </div>
                        </div>
                        {organization && (
                            <p className="org-name">Organization: {organization.name}</p>
                        )}
                    </div>

                    {organization && organization.status === 'suspended' && (
                        <div style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ffeeba' }}>
                            <strong>⚠️ Account Suspended:</strong> Your organization account is currently suspended. Some features may be restricted. Please contact support for more information.
                        </div>
                    )}
                    
                    {organization && organization.status === 'rejected' && (
                        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f5c6cb' }}>
                            <strong>🚫 Account Rejected:</strong> Your organization account application has been rejected.
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}

                    {loading ? (
                        <div className="loading">Loading data...</div>
                    ) : (
                        <div className="dashboard-grid">
                            <div className="card">
                                <h3>Sprints</h3>
                                <p className="card-value">{sprints.length || 0}</p>
                                <p className="card-label">Active/Completed</p>
                            </div>

                            <div className="card">
                                <h3>User Type</h3>
                                <p className="card-value">{getUserTypeLabel(user?.user_type)}</p>
                            </div>

                            {user?.user_type === 'facilitator' && (
                                <div className="card">
                                    <h3>Assigned Clients</h3>
                                    <p className="card-value">0</p>
                                </div>
                            )}

                            {(user?.user_type === 'organization' || roles.includes('org_admin') || roles.includes('manager')) && (
                                <div className="card">
                                    <h3>Team Members</h3>
                                    <p className="card-value">Manage Team</p>
                                    <button 
                                        onClick={() => navigate('/org/members')} 
                                        className="btn-primary" 
                                        style={{ marginTop: '10px', width: '100%' }}
                                        disabled={organization?.status === 'suspended' || organization?.status === 'rejected'}
                                    >
                                        Manage Members
                                    </button>
                                </div>
                            )}

                            {organization && (
                                <div className="card" style={{ gridColumn: '1 / -1', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                                    <h3>Organization Info</h3>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginTop: '15px', fontSize: '14px', flex: 1 }}>
                                            <div>
                                                <strong style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</strong>
                                                <span style={{ textTransform: 'capitalize', fontWeight: '500', color: organization.status === 'active' ? '#16a34a' : '#ea580c' }}>
                                                    {organization.status || 'N/A'}
                                                </span>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Industry</strong>
                                                <span>{organization.industry || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Headcount</strong>
                                                <span>{organization.headcount || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <strong style={{ color: '#64748b', display: 'block', marginBottom: '4px' }}>Location</strong>
                                                <span>{organization.headquarters_location || 'N/A'}</span>
                                            </div>
                                        </div>
                                        
                                        {(user?.user_type === 'organization' || roles.includes('org_admin')) && (
                                            <div className="logo-upload-container" style={{ margin: 0, padding: '15px', width: '200px' }}>
                                                <div className="org-logo-preview" style={{ margin: '0 auto 10px auto' }}>
                                                    {organization.logo_url ? (
                                                        <img src={organization.logo_url} alt="Logo" />
                                                    ) : (
                                                        <span style={{ color: '#94a3b8', fontSize: '12px' }}>No Logo</span>
                                                    )}
                                                </div>
                                                <label className="avatar-upload-btn" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                                                    {loading ? '...' : 'Upload Logo'}
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={async (e) => {
                                                            const file = e.target.files[0];
                                                            if (file) {
                                                                try {
                                                                    // Dynamic import to avoid circular dependency if any
                                                                    const { useAdminStore } = await import('../context/adminStore');
                                                                    await useAdminStore.getState().updateOrgLogo(file);
                                                                } catch (err) {
                                                                    console.error('Failed to upload logo:', err);
                                                                }
                                                            }
                                                        }}
                                                        disabled={loading}
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <section className="sprints-section">
                        <h3>Recent Sprints</h3>
                        {sprints.length > 0 ? (
                            <div className="sprints-list">
                                {sprints.map((sprint) => (
                                    <div key={sprint.id} className="sprint-item">
                                        <h4>{sprint.name || 'Sprint'}</h4>
                                        <p>{sprint.description || 'No description'}</p>
                                        <span className="sprint-status">{sprint.status || 'pending'}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="no-data">No sprints available yet</p>
                        )}
                    </section>
                </section>
            </main>
        </div>
    );
};
