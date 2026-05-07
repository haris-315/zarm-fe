import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorDetail.css';

export const FacilitatorDetail = () => {
    const navigate = useNavigate();
    const { facilitatorId } = useParams();
    const { user, logout, roles } = useAuthStore();
    const { selectedFacilitator, isLoading, error, fetchFacilitator, clearSelectedFacilitator } =
        useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }

        if (facilitatorId) {
            console.log('Fetching facilitator:', facilitatorId);
            fetchFacilitator(facilitatorId);
        }

        return () => {
            clearSelectedFacilitator();
        };
    }, [facilitatorId]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

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
                        <Link to="/admin/facilitators" className="nav-link active">
                            Facilitators
                        </Link>
                        <Link to="/admin/organizations" className="nav-link">
                            Organizations
                        </Link>
                        <Link to="/admin/notifications" className="nav-link">
                            Notifications
                        </Link>
                        <Link to="/admin/settings" className="nav-link">
                            Settings
                        </Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header">
                        <h2>Facilitator Details</h2>
                        <Link to="/admin/facilitators" className="btn-secondary">
                            ← Back to List
                        </Link>
                    </div>

                    {error && <div className="error-message">{error}</div>}

                    {isLoading ? (
                        <div className="loading">Loading facilitator details...</div>
                    ) : selectedFacilitator ? (
                        <div className="detail-container">
                            <div className="detail-card">
                                <h3>Basic Information</h3>
                                <div className="detail-grid">
                                    <div className="detail-item">
                                        <label>ID</label>
                                        <p>{selectedFacilitator.id}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Email</label>
                                        <p>{selectedFacilitator.email}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Full Name</label>
                                        <p>{selectedFacilitator.full_name || '—'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Title</label>
                                        <p>{selectedFacilitator.title || '—'}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>User Type</label>
                                        <p>{selectedFacilitator.user_type}</p>
                                    </div>
                                    <div className="detail-item">
                                        <label>Status</label>
                                        <p>
                                            <span
                                                className={`status-badge status-${selectedFacilitator.status}`}
                                            >
                                                {selectedFacilitator.status}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-actions">
                                <Link
                                    to={`/admin/facilitators/${facilitatorId}/edit`}
                                    className="btn-primary"
                                >
                                    Edit Facilitator
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="no-data">Facilitator not found</div>
                    )}
                </section>
            </main>
        </div>
    );
};
