import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import styles from './OrganizationsList.module.css';
import membersStyles from './OrganizationMembers.module.css';

const AVAILABLE_PERMISSIONS = [
    { code: 'sprint.create', label: 'Create Sprint' },
    { code: 'sprint.read', label: 'Read Sprint' },
    { code: 'sprint.update', label: 'Update Sprint' },
    { code: 'process.score', label: 'Score Process' },
    { code: 'process.read', label: 'Read Process' },
    { code: 'org.members.manage', label: 'Manage Members' },
    { code: 'org.roles.manage', label: 'Manage Roles' },
    { code: 'org.dashboard.view', label: 'View Dashboard' },
];

export const OrganizationMembers = () => {
    const navigate = useNavigate();
    const { orgId } = useParams();
    const { user, roles } = useAuthStore();
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
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [inviteFormData, setInviteFormData] = useState({
        email: '',
        role: 'member',
        extra_permissions: [],
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        role: 'member',
        extra_permissions: [],
    });

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        if (orgId) {
            fetchOrganization(orgId);
            fetchOrganizationMembers(orgId, membersCurrentPage, membersPageSize);
        }
    }, [orgId, membersCurrentPage, membersPageSize, roles, user?.user_type, navigate, fetchOrganization, fetchOrganizationMembers]);

    const handleRemoveMember = async (memberId) => {
        setSubmitting(true);
        try {
            await removeOrganizationMember(orgId, memberId);
            setDeleteConfirm(null);
        } finally { setSubmitting(false); }
    };

    const handleUpdateMember = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await updateOrganizationMember(orgId, editFormData.id, {
                role: editFormData.role,
                extra_permissions: editFormData.extra_permissions,
            });
            setEditModalOpen(false);
        } finally { setSubmitting(false); }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await inviteOrganizationMember(orgId, inviteFormData);
            setInviteModalOpen(false);
            setInviteFormData({ email: '', role: 'member', extra_permissions: [] });
        } finally { setSubmitting(false); }
    };

    const togglePermission = (setter, perms, code) => {
        setter(prev => ({
            ...prev,
            extra_permissions: prev.extra_permissions.includes(code)
                ? prev.extra_permissions.filter(p => p !== code)
                : [...prev.extra_permissions, code]
        }));
    };

    const filteredMembers = organizationMembers.filter(
        (member) =>
            member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(totalMembers / membersPageSize);

    const columns = [
        {
            key: 'email',
            label: 'Member',
            render: (val, row) => (
                <div className={styles.orgCell}>
                    <div className={styles.logo}>{val?.charAt(0).toUpperCase()}</div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{row.full_name || 'Pending Invite'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{val}</div>
                    </div>
                </div>
            )
        },
        { key: 'roles', label: 'Role', render: (val) => <Badge status="planning">{val?.[0] || 'member'}</Badge> },
        { key: 'status', label: 'Status', render: (val) => <Badge status={val}>{val}</Badge> },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Button
                        variant="ghost" size="sm"
                        onClick={() => {
                            setEditFormData({ id: row.id, role: row.roles?.[0] || 'member', extra_permissions: row.extra_permissions || [] });
                            setEditModalOpen(true);
                        }}
                    >Edit</Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(row.id)}>Remove</Button>
                </div>
            )
        }
    ];

    const breadcrumbs = (
        <div className={membersStyles.breadcrumbs}>
            <Link to="/admin/organizations">Organizations</Link>
            <span>/</span>
            <Link to={`/admin/organizations/${orgId}`}>{selectedOrganization?.name || 'Detail'}</Link>
            <span>/</span>
            <span>Members</span>
        </div>
    );

    return (
        <AppShell
            title={breadcrumbs}
            actions={
                <div className={styles.topActions}>
                    <Input
                        placeholder="Search members..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <Button onClick={() => setInviteModalOpen(true)}>+ Invite Member</Button>
                </div>
            }
        >
            {error && <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>}

            <div className={styles.tableCard}>
                <DataTable
                    columns={columns}
                    data={filteredMembers}
                    loading={membersLoading}
                />
            </div>

            <div className={styles.pagination}>
                <Button variant="secondary" size="sm" disabled={membersCurrentPage === 1} onClick={() => setMembersPage(membersCurrentPage - 1)}>Previous</Button>
                <div className={styles.pageInfo}>Page {membersCurrentPage} of {totalPages}</div>
                <Button variant="secondary" size="sm" disabled={membersCurrentPage === totalPages} onClick={() => setMembersPage(membersCurrentPage + 1)}>Next</Button>
            </div>

            {/* Invite Modal */}
            <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite New Member">
                <form onSubmit={handleInviteMember} className={styles.modalForm}>
                    <Input label="Email Address *" type="email" required value={inviteFormData.email} onChange={e => setInviteFormData({...inviteFormData, email: e.target.value})} placeholder="colleague@company.com" />
                    <Select
                        label="Role"
                        value={inviteFormData.role}
                        onChange={e => setInviteFormData({...inviteFormData, role: e.target.value})}
                        options={[
                            { label: 'Member', value: 'member' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Organization Admin', value: 'org_admin' }
                        ]}
                    />
                    <div className={membersStyles.permissionsGroup}>
                        <label className={membersStyles.permLabel}>Extra Permissions</label>
                        <div className={membersStyles.permGrid}>
                            {AVAILABLE_PERMISSIONS.map(perm => (
                                <label key={perm.code} className={membersStyles.permItem}>
                                    <input
                                        type="checkbox"
                                        checked={inviteFormData.extra_permissions.includes(perm.code)}
                                        onChange={() => togglePermission(setInviteFormData, inviteFormData.extra_permissions, perm.code)}
                                    />
                                    {perm.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Send Invite</Button>
                    </div>
                </form>
            </Modal>

            {/* Edit Modal */}
            <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Member">
                <form onSubmit={handleUpdateMember} className={styles.modalForm}>
                    <Select
                        label="Role"
                        value={editFormData.role}
                        onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                        options={[
                            { label: 'Member', value: 'member' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Organization Admin', value: 'org_admin' }
                        ]}
                    />
                    <div className={membersStyles.permissionsGroup}>
                        <label className={membersStyles.permLabel}>Extra Permissions</label>
                        <div className={membersStyles.permGrid}>
                            {AVAILABLE_PERMISSIONS.map(perm => (
                                <label key={perm.code} className={membersStyles.permItem}>
                                    <input
                                        type="checkbox"
                                        checked={editFormData.extra_permissions.includes(perm.code)}
                                        onChange={() => togglePermission(setEditFormData, editFormData.extra_permissions, perm.code)}
                                    />
                                    {perm.label}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Save Changes</Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm Modal */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Member?">
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                    This will permanently remove the member from this organization.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button variant="danger" loading={submitting} onClick={() => handleRemoveMember(deleteConfirm)}>Remove</Button>
                </div>
            </Modal>
        </AppShell>
    );
};