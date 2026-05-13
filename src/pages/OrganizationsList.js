import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorsList.css';

export const OrganizationsList = () => {
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const {
        organizations,
        totalOrganizations,
        orgCurrentPage,
        orgPageSize,
        isLoading,
        error,
        fetchOrganizations,
        setOrgPage,
        suspendOrganization,
        activateOrganization,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [actionConfirm, setActionConfirm] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [rejectConfirm, setRejectConfirm] = useState(null);

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        console.log('Fetching organizations, page:', orgCurrentPage);
        fetchOrganizations(orgCurrentPage, orgPageSize);
    }, [orgCurrentPage, orgPageSize]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleToggleStatus = async (orgId, currentStatus) => {
        try {
            const { activateOrganization, suspendOrganization, approveOrganization } = useAdminStore.getState();
            if (currentStatus === 'active') {
                await suspendOrganization(orgId);
            } else if (currentStatus === 'pending' || currentStatus === 'rejected') {
                await approveOrganization(orgId);
            } else {
                await activateOrganization(orgId);
            }
            setActionConfirm(null);
        } catch (err) {
            console.error('Failed to change organization status:', err);
        }
    };

    const handleReject = async () => {
        if (!rejectConfirm) return;
        try {
            const { rejectOrganization } = useAdminStore.getState();
            await rejectOrganization(rejectConfirm, rejectReason);
            setRejectConfirm(null);
            setRejectReason('');
        } catch (err) {
            console.error('Failed to reject organization:', err);
        }
    };

    const handlePageChange = (newPage) => {
        setOrgPage(newPage);
        fetchOrganizations(newPage, orgPageSize);
    };

    const filteredOrganizations = organizations.filter(
        (org) =>
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.slug?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalOrganizations / orgPageSize);

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
                        <Link to="/admin/organizations" className="nav-link active">
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
                        <h2>Manage Organizations</h2>
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
                            placeholder="Search by name, slug, or industry..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="filter-info">
                            Showing {filteredOrganizations.length} of {totalOrganizations}
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading">Loading organizations...</div>
                    ) : filteredOrganizations.length > 0 ? (
                        <>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Industry</th>
                                            <th>Headcount</th>
                                            <th>Status</th>
                                            <th>Contact</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrganizations.map((org) => (
                                            <tr key={org.id}>
                                                <td>
                                                    <strong>{org.name}</strong>
                                                </td>
                                                <td>{org.industry || '—'}</td>
                                                <td>{org.headcount || '—'}</td>
                                                <td>
                                                    <span
                                                        className={`status-badge status-${org.status}`}
                                                    >
                                                        {org.status}
                                                    </span>
                                                </td>
                                                <td>{org.primary_contact_name || '—'}</td>
                                                <td>
                                                    <div className="action-buttons">
                                                        <Link
                                                            to={`/admin/organizations/${org.id}`}
                                                            className="btn-icon view"
                                                            title="View"
                                                        >
                                                            👁️
                                                        </Link>
                                                        <Link
                                                            to={`/admin/organizations/${org.id}/members`}
                                                            className="btn-icon view"
                                                            title="Members"
                                                        >
                                                            👥
                                                        </Link>
                                                        <Link
                                                            to={`/admin/organizations/${org.id}/sprints`}
                                                            className="btn-icon view"
                                                            title="Sprints"
                                                        >
                                                            🏃
                                                        </Link>
                                                        <button
                                                            onClick={() =>
                                                                setActionConfirm({
                                                                    orgId: org.id,
                                                                    action:
                                                                        org.status === 'active'
                                                                            ? 'suspend'
                                                                            : 'activate',
                                                                    currentStatus: org.status,
                                                                })
                                                            }
                                                            className="btn-icon delete"
                                                            title={
                                                                org.status === 'active'
                                                                    ? 'Suspend'
                                                                    : 'Approve / Activate'
                                                            }
                                                        >
                                                            {org.status === 'active'
                                                                ? '⏸️'
                                                                : '✅'}
                                                        </button>
                                                        {org.status === 'pending' && (
                                                            <button
                                                                onClick={() => setRejectConfirm(org.id)}
                                                                className="btn-icon delete"
                                                                title="Reject"
                                                            >
                                                                ❌
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <button
                                    onClick={() => handlePageChange(orgCurrentPage - 1)}
                                    disabled={orgCurrentPage === 1}
                                    className="btn-pagination"
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {orgCurrentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(orgCurrentPage + 1)}
                                    disabled={orgCurrentPage === totalPages}
                                    className="btn-pagination"
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-data">
                            <p>No organizations found</p>
                        </div>
                    )}
                </section>
            </main>

            {actionConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>
                            {actionConfirm.action === 'suspend'
                                ? 'Suspend Organization?'
                                : 'Activate/Approve Organization?'}
                        </h3>
                        <p>
                            {actionConfirm.action === 'suspend'
                                ? 'This action will suspend the organization account.'
                                : 'This action will activate and approve the organization account.'}
                        </p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setActionConfirm(null)}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() =>
                                    handleToggleStatus(actionConfirm.orgId, actionConfirm.currentStatus)
                                }
                                className={
                                    actionConfirm.action === 'suspend' ? 'btn-danger' : 'btn-primary'
                                }
                            >
                                {actionConfirm.action === 'suspend' ? 'Suspend' : 'Activate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {rejectConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content" style={{ minWidth: '400px' }}>
                        <h3>Reject Organization?</h3>
                        <p>Please provide a reason for rejecting the organization.</p>
                        <textarea
                            style={{ width: '100%', minHeight: '100px', margin: '15px 0', padding: '10px' }}
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Reason for rejection..."
                        />
                        <div className="modal-actions">
                            <button
                                onClick={() => {
                                    setRejectConfirm(null);
                                    setRejectReason('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectReason.trim()}
                                className="btn-danger"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
