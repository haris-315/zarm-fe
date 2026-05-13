import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorsList.css';

export const OrgMembersPage = () => {
    const navigate = useNavigate();
    const { user, logout, roles } = useAuthStore();
    const {
        orgMembers,
        totalOrgMembers,
        orgMembersCurrentPage,
        orgMembersPageSize,
        orgMembersLoading,
        availablePermissions,
        error,
        fetchOrgMembers,
        fetchAvailablePermissions,
        updateOrgMember,
        removeOrgMember,
        inviteOrgMember,
        setOrgMembersPage,
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
        extra_permissions: [],
    });
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({
        id: '',
        role: 'member',
        extra_permissions: [],
    });

    useEffect(() => {
        if (!(roles.includes('org_admin') || roles.includes('manager'))) {
            navigate('/dashboard');
            return;
        }

        fetchOrgMembers(orgMembersCurrentPage, orgMembersPageSize);
        fetchAvailablePermissions();
    }, [orgMembersCurrentPage, orgMembersPageSize]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleRemoveMember = async (memberId) => {
        try {
            setSubmitting(true);
            await removeOrgMember(memberId);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to remove member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMember = async (e) => {
        if (e) e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                role: editFormData.role,
                extra_permissions: editFormData.extra_permissions,
            };
            await updateOrgMember(editFormData.id, payload);
            setEditModalOpen(false);
            setEditingMember(null);
        } catch (err) {
            console.error('Failed to update member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePageChange = (newPage) => {
        setOrgMembersPage(newPage);
        fetchOrgMembers(newPage, orgMembersPageSize);
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
                extra_permissions: inviteFormData.extra_permissions,
            };
            await inviteOrgMember(payload);
            setInviteModalOpen(false);
            setInviteFormData({
                email: '',
                role: 'member',
                extra_permissions: [],
            });
        } catch (err) {
            console.error('Failed to invite member:', err);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setInviteFormData((prev) => {
                const currentPerms = prev.extra_permissions || [];
                if (checked) {
                    return { ...prev, extra_permissions: [...currentPerms, value] };
                } else {
                    return {
                        ...prev,
                        extra_permissions: currentPerms.filter((p) => p !== value),
                    };
                }
            });
        } else {
            setInviteFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setEditFormData((prev) => {
                const currentPerms = prev.extra_permissions || [];
                if (checked) {
                    return { ...prev, extra_permissions: [...currentPerms, value] };
                } else {
                    return {
                        ...prev,
                        extra_permissions: currentPerms.filter((p) => p !== value),
                    };
                }
            });
        } else {
            setEditFormData((prev) => ({ ...prev, [name]: value }));
        }
    };

    const filteredMembers = orgMembers.filter(
        (member) =>
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalOrgMembers / orgMembersPageSize);

    return (
        <div className="super-admin-container">
            <header className="admin-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Organization Admin</h1>
                        <span className="user-type">Team Management</span>
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
                        <a href="/dashboard" className="nav-link">
                            Dashboard
                        </a>
                        <a href="#" className="nav-link active">
                            Team Members
                        </a>
                        <a href="#" className="nav-link">
                            Settings
                        </a>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header">
                        <div>
                            <h2>Team Members</h2>
                            <p style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                Manage your organization members
                            </p>
                        </div>
                        <button
                            onClick={() => setInviteModalOpen(true)}
                            className="btn-primary"
                        >
                            + Send Invite
                        </button>
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
                            Showing {filteredMembers.length} of {totalOrgMembers}
                        </div>
                    </div>

                    {orgMembersLoading ? (
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
                                            <th>Extra Permissions</th>
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
                                                    <span
                                                        className="role-badge"
                                                        style={{
                                                            padding: '4px 8px',
                                                            background: '#e0e7ff',
                                                            borderRadius: '4px',
                                                            fontSize: '12px',
                                                        }}
                                                    >
                                                        {member.role || 'member'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                        {member.extra_permissions && member.extra_permissions.length > 0 ? (
                                                            member.extra_permissions.map(perm => (
                                                                <span 
                                                                    key={perm}
                                                                    style={{
                                                                        padding: '2px 6px',
                                                                        background: '#f1f5f9',
                                                                        border: '1px solid #e2e8f0',
                                                                        borderRadius: '3px',
                                                                        fontSize: '11px',
                                                                        color: '#475569'
                                                                    }}
                                                                >
                                                                    {perm}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>None</span>
                                                        )}
                                                    </div>
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
                                                        <button
                                                            onClick={() => {
                                                                setEditFormData({
                                                                    id: member.id,
                                                                    role: member.role || 'member',
                                                                    extra_permissions: member.extra_permissions || [],
                                                                });
                                                                setEditModalOpen(true);
                                                            }}
                                                            className="btn-icon edit"
                                                            title="Edit Member"
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
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pagination">
                                <button
                                    onClick={() => handlePageChange(orgMembersCurrentPage - 1)}
                                    disabled={orgMembersCurrentPage === 1}
                                    className="btn-pagination"
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {orgMembersCurrentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => handlePageChange(orgMembersCurrentPage + 1)}
                                    disabled={orgMembersCurrentPage === totalPages}
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

                            {availablePermissions && availablePermissions.length > 0 && (
                                <div className="form-group">
                                    <label>Extra Permissions</label>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gap: '10px', 
                                        marginTop: '10px',
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {availablePermissions.map(perm => (
                                            <label key={perm.code} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                fontWeight: 'normal'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    name="extra_permissions"
                                                    value={perm.code}
                                                    checked={inviteFormData.extra_permissions.includes(perm.code)}
                                                    onChange={handleInviteFormChange}
                                                    disabled={submitting}
                                                />
                                                {perm.code}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

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
                                            extra_permissions: [],
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

            {editModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Edit Member</h3>
                        <form onSubmit={handleUpdateMember}>
                            <div className="form-group">
                                <label htmlFor="edit-role">Role</label>
                                <select
                                    id="edit-role"
                                    name="role"
                                    value={editFormData.role}
                                    onChange={handleEditFormChange}
                                    disabled={submitting}
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="org_admin">Organization Admin</option>
                                </select>
                            </div>

                            {availablePermissions && availablePermissions.length > 0 && (
                                <div className="form-group">
                                    <label>Extra Permissions</label>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gap: '10px', 
                                        marginTop: '10px',
                                        padding: '12px',
                                        background: '#f8fafc',
                                        borderRadius: '6px',
                                        border: '1px solid #e2e8f0'
                                    }}>
                                        {availablePermissions.map(perm => (
                                            <label key={perm.code} style={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: '8px',
                                                fontSize: '13px',
                                                cursor: 'pointer',
                                                fontWeight: 'normal'
                                            }}>
                                                <input
                                                    type="checkbox"
                                                    name="extra_permissions"
                                                    value={perm.code}
                                                    checked={editFormData.extra_permissions.includes(perm.code)}
                                                    onChange={handleEditFormChange}
                                                    disabled={submitting}
                                                />
                                                {perm.code}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setEditModalOpen(false)}
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
                                    {submitting ? 'Saving...' : 'Save Changes'}
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
                        <p>This action will remove the member from your organization.</p>
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
