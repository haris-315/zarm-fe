import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorsList.css';

export const OrganizationMembers = () => {
    const navigate = useNavigate();
    const { orgId } = useParams();
    const { user, logout, roles } = useAuthStore();
    const {
        selectedOrganization,
        organizationMembers,
        totalMembers,
        membersCurrentPage,
        membersPageSize,
        membersLoading,
        error,
        fetchOrganization,
        fetchOrganizationMembers,
        updateOrganizationMember,
        removeOrganizationMember,
        inviteOrganizationMember,
        setMembersPage,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [editingMember, setEditingMember] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteFormData, setInviteFormData] = useState({
        email: '',
        role: 'member',
    });

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }

        if (orgId) {
            console.log('Fetching organization members for orgId:', orgId);
            fetchOrganization(orgId);
            fetchOrganizationMembers(orgId, membersCurrentPage, membersPageSize);
        }
    }, [orgId, membersCurrentPage, membersPageSize]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRemoveMember = async (memberId) => {
        try {
            setSubmitting(true);
            await removeOrganizationMember(orgId, memberId);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to remove member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMemberRole = async (memberId, newRole) => {
        try {
            setSubmitting(true);
            await updateOrganizationMember(orgId, memberId, { role: newRole });
            setEditingMember(null);
        } catch (err) {
            console.error('Failed to update member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePageChange = (newPage) => {
        setMembersPage(newPage);
        fetchOrganizationMembers(orgId, newPage, membersPageSize);
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        if (!inviteFormData.email) {
            alert('Email is required');
            return;
        }

        try {
            setSubmitting(true);
            const payload = {
                email: inviteFormData.email,
                role: inviteFormData.role,
            };
            await inviteOrganizationMember(orgId, payload);
            setInviteModalOpen(false);
            setInviteFormData({
                email: '',
                role: 'member',
            });
        } catch (err) {
            console.error('Failed to invite member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteFormChange = (e) => {
        const { name, value } = e.target;
        setInviteFormData((prev) => ({ ...prev, [name]: value }));
    };

    const filteredMembers = organizationMembers.filter(
        (member) =>
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalMembers / membersPageSize);

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
                        <Link to="/admin/settings" className="nav-link">
                            Settings
                        </Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header">
                        <div>
                            <h2>Organization Members</h2>
                            {selectedOrganization && (
                                <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                    {selectedOrganization.name}
                                </p>
                            )}
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setInviteModalOpen(true)}
                                className="btn-primary"
                            >
                                + Send Invite
                            </button>
                            <Link
                                to={`/admin/organizations/${orgId}`}
                                className="btn-secondary"
                            >
                                ← Back to Organization
                            </Link>
                        </div>
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
                            placeholder="Search by email, name, or title..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="filter-info">
                            Showing {filteredMembers.length} of {totalMembers}
                        </div>
                    </div>

                    {membersLoading ? (
                        <div className="loading">Loading members...</div>
                    ) : filteredMembers.length > 0 ? (
                        <>
                            <div className="table-responsive">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Email</th>
                                            <th>Full Name</th>
                                            <th>Title</th>
                                            <th>Role</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredMembers.map((member) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <strong>{member.email}</strong>
                                                </td>
                                                <td>{member.full_name || '—'}</td>
                                                <td>{member.title || '—'}</td>
                                                <td>
                                                    {editingMember === member.id ? (
                                                        <select
                                                            value={member.roles?.[0] || 'member'}
                                                            onChange={(e) =>
                                                                handleUpdateMemberRole(
                                                                    member.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            disabled={submitting}
                                                        >
                                                            <option value="member">Member</option>
                                                            <option value="manager">Manager</option>
                                                            <option value="org_admin">
                                                                Organization Admin
                                                            </option>
                                                        </select>
                                                    ) : (
                                                        <span
                                                            className="role-badge"
                                                            style={{
                                                                padding: '4px 8px',
                                                                background: '#e0e7ff',
                                                                borderRadius: '4px',
                                                                fontSize: '12px',
                                                            }}
                                                        >
                                                            {member.roles?.[0] || 'member'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    <span
                                                        className={`status-badge status-${member.status}`}
                                                    >
                                                        {member.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {editingMember !== member.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        setEditingMember(member.id)
                                                                    }
                                                                    className="btn-icon edit"
                                                                    title="Edit Role"
                                                                    disabled={submitting}
                                                                >
                                                                    ✎
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        setDeleteConfirm(member.id)
                                                                    }
                                                                    className="btn-icon delete"
                                                                    title="Remove"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <button
                                                                onClick={() =>
                                                                    setEditingMember(null)
                                                                }
                                                                className="btn-icon view"
                                                                title="Cancel"
                                                                disabled={submitting}
                                                            >
                                                                ✕
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
                                    onClick={() => handlePageChange(membersCurrentPage - 1)}
                                    disabled={membersCurrentPage === 1}
                                    className="btn-pagination"
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {membersCurrentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(membersCurrentPage + 1)}
                                    disabled={membersCurrentPage === totalPages}
                                    className="btn-pagination"
                                >
                                    Next →
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="no-data">
                            <p>No members found</p>
                        </div>
                    )}
                </section>
            </main>

            {inviteModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Invite New Member</h3>
                        <form onSubmit={handleInviteMember}>
                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={inviteFormData.email}
                                    onChange={handleInviteFormChange}
                                    required
                                    placeholder="member@example.com"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={inviteFormData.role}
                                    onChange={handleInviteFormChange}
                                    disabled={submitting}
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="org_admin">Organization Admin</option>
                                </select>
                            </div>

                            {error && (
                                <div className="error-message" style={{ marginBottom: '15px' }}>
                                    {error}
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setInviteModalOpen(false);
                                        setInviteFormData({
                                            email: '',
                                            role: 'member',
                                        });
                                    }}
                                    className="btn-secondary"
                                    disabled={submitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={submitting}
                                >
                                    {submitting ? 'Sending Invite...' : 'Send Invite'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteConfirm && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Remove Member?</h3>
                        <p>This action will remove the member from the organization.</p>
                        <div className="modal-actions">
                            <button
                                onClick={() => setDeleteConfirm(null)}
                                className="btn-secondary"
                                disabled={submitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleRemoveMember(deleteConfirm)}
                                className="btn-danger"
                                disabled={submitting}
                            >
                                {submitting ? 'Removing...' : 'Remove'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
