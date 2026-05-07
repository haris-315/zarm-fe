import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorsList.css';

export const FacilitatorsList = () => {
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const {
        facilitators,
        totalFacilitators,
        currentPage,
        pageSize,
        isLoading,
        error,
        fetchFacilitators,
        setPage,
        disableFacilitator,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchFacilitators(currentPage, pageSize);
    }, [roles, user?.user_type, navigate, fetchFacilitators, currentPage, pageSize]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleDisable = async (facilitatorId) => {
        try {
            await disableFacilitator(facilitatorId);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to disable facilitator:', err);
        }
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        fetchFacilitators(newPage, pageSize);
    };

    const filteredFacilitators = facilitators.filter(
        (c) =>
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalFacilitators / pageSize);

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
                        <h2>Manage Facilitators</h2>
                        <Link to="/admin/facilitators/new" className="btn-primary">
                            + Add New Facilitator
                        </Link>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={clearError} className="btn-close">
                                ×
                            </button>
                        </div>
                    )}

                    <div className="filters-section">
                        <input
                            type="text"
                            placeholder="Search by email or name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="filter-info">
                            Showing {filteredFacilitators.length} of {totalFacilitators}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading">Loading facilitators...</div>
                    ) : filteredFacilitators.length > 0 ? (
                        <>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Full Name</th>
                                            <th>Title</th>
                                            <th>Status</th>
                                            <th>User Type</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredFacilitators.map((facilitator) => (
                                            <tr key={facilitator.id}>
                                                <td>
                                                    <strong>{facilitator.email}</strong>
                                                </td>
                                                <td>{facilitator.full_name || '—'}</td>
                                                <td>{facilitator.title || '—'}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge status-${facilitator.status}`}
                                                    >
                                                        {facilitator.status}
                                                    </span>
                                                </td>
                                                <td>{facilitator.user_type}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <Link
                                                            to={`/admin/facilitators/${facilitator.id}`}
                                                            className="btn-icon view"
                                                            title="View"
                                                        >
                                                            👁️
                                                        </Link>
                                                        <Link
                                                            to={`/admin/facilitators/${facilitator.id}/edit`}
                                                            className="btn-icon edit"
                                                            title="Edit"
                                                        >
                                                            ✎
                                                        </Link>
                                                        <button
                                                            onClick={() => setDeleteConfirm(facilitator.id)}
                                                            className="btn-icon delete"
                                                            title="Disable"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="btn-pagination"
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="btn-pagination"
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-data">
                            <p>No facilitators found</p>
                            <Link to="/admin/facilitators/new" className="btn-primary">
                                Create your first facilitator
                            </Link>
                        </div>
                    )}
                </section>
            </main>

            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Disable Facilitator?</h3>
                        <p>This action will disable the facilitator account.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDisable(deleteConfirm)}
                                className="btn-danger"
                            >
                                Disable
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
