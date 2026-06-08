import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../context/authStore';
import { organizationAPI } from '../api/organizations';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ExtraPermissionsModal } from '../components/ExtraPermissionsModal';
import { Toast } from '../components/Toast';
import styles from './OrgMembersPage.module.css';

const GearIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export const OrgMembersPage = () => {
    const { user } = useAuthStore();

    const [members, setMembers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [roleDropdown, setRoleDropdown] = useState(null);
    const [permTarget, setPermTarget] = useState(null);
    const [toast, setToast] = useState(null);
    const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'member' });

    // Load members and roles
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [membersData, rolesData] = await Promise.all([
                    organizationAPI.listOrgMembers(currentPage, pageSize),
                    organizationAPI.listOrgRoles(),
                ]);
                setMembers(membersData.items || []);
                setTotal(membersData.total || 0);
                setRoles(rolesData.items || rolesData || []);
            } catch (err) {
                console.error('Failed to load org data:', err);
                setError(err.response?.data?.detail || 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentPage, pageSize]);

    const handleRemoveMember = async (memberId) => {
        try {
            await organizationAPI.removeOrgMember(memberId);
            setDeleteConfirm(null);
            setToast({ type: 'success', message: 'Member removed' });
            // Reload members
            const data = await organizationAPI.listOrgMembers(currentPage, pageSize);
            setMembers(data.items || []);
            setTotal(data.total || 0);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to remove member' });
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        try {
            await organizationAPI.inviteOrgMember(inviteFormData);
            setInviteModalOpen(false);
            setInviteFormData({ email: '', role: 'member' });
            setToast({ type: 'success', message: 'Invitation sent' });
            // Reload members
            const data = await organizationAPI.listOrgMembers(currentPage, pageSize);
            setMembers(data.items || []);
            setTotal(data.total || 0);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to send invite' });
        }
    };

    const handleRoleAssign = async (memberId, roleName) => {
        setRoleDropdown(null);
        try {
            await organizationAPI.updateOrgMember(memberId, { role: roleName });
            setToast({ type: 'success', message: 'Role assigned' });
            // Reload members
            const data = await organizationAPI.listOrgMembers(currentPage, pageSize);
            setMembers(data.items || []);
            setTotal(data.total || 0);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to assign role' });
        }
    };

    const handleSaveExtraPerms = async (newPerms) => {
        if (!permTarget) return;
        try {
            await organizationAPI.updateOrgMember(permTarget.id, { extra_permissions: newPerms });
            setToast({ type: 'success', message: 'Permissions updated' });
            // Reload members
            const data = await organizationAPI.listOrgMembers(currentPage, pageSize);
            setMembers(data.items || []);
            setTotal(data.total || 0);
            setPermTarget(null);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to update permissions' });
        }
    };

    const getAssignedRoleName = (member) =>
        member.role?.name || member.roles?.[0] || null;

    // Derive role-sourced permissions: all_permissions minus extra_permissions
    const getRolePermCodes = (member) => {
        const extraCodes = member.extra_permissions || [];
        return (member.all_permissions || [])
            .map((p) => (typeof p === 'string' ? p : p.code || ''))
            .filter((code) => code && !extraCodes.includes(code));
    };

    const filteredMembers = members.filter(
        (member) =>
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get all unique permissions from all roles
    const allPermissions = [];
    roles.forEach(role => {
        if (role.permissions) {
            role.permissions.forEach(perm => {
                const code = typeof perm === 'string' ? perm : perm.code;
                if (!allPermissions.find(p => (typeof p === 'string' ? p : p.code) === code)) {
                    allPermissions.push(perm);
                }
            });
        }
    });

    const columns = [
        {
            key: 'email',
            label: 'Member',
            render: (val, row) => (
                <div className={styles.userCell}>
                    <div className={styles.avatar}>
                        {row.avatar_url
                            ? <img src={row.avatar_url} alt="" />
                            : val.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className={styles.userName}>{row.full_name || 'Pending Invite'}</div>
                        <div className={styles.userEmail}>{val}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'role',
            label: 'Role',
            render: (_, row) => {
                const roleName = getAssignedRoleName(row);
                const isOpen = roleDropdown === row.id;
                return (
                    <div className={styles.roleCell}>
                        <div className={styles.roleDropdownWrapper}>
                            <button
                                className={`${styles.roleBtn} ${!roleName ? styles.unassigned : ''}`}
                                onClick={(e) => { e.stopPropagation(); setRoleDropdown(isOpen ? null : row.id); }}
                            >
                                {roleName || 'Unassigned'}
                                <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </button>
                            {isOpen && (
                                <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                                    <div className={styles.dropdownHeader}>Assign Role</div>
                                    {roles.length === 0 ? (
                                        <div className={styles.dropdownEmpty}>No roles available</div>
                                    ) : (
                                        roles.map((r) => (
                                            <button
                                                key={r.id}
                                                className={`${styles.dropdownItem} ${roleName === r.name ? styles.dropdownItemActive : ''}`}
                                                onClick={() => handleRoleAssign(row.id, r.name)}
                                            >
                                                {r.name}
                                                {r.is_custom && <span className={styles.customTag}>Custom</span>}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => <Badge status={val}>{val}</Badge>,
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Manage extra permissions"
                        onClick={(e) => { e.stopPropagation(); setPermTarget(row); }}
                    >
                        <GearIcon />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id); }}>
                        Remove
                    </Button>
                </div>
            ),
        },
    ];

    const totalPages = Math.ceil(total / pageSize);

    return (
        <AppShell
            title="Organization Management"
            actions={
                <div className={styles.topActions}>
                    <Input
                        placeholder="Search team..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <Button onClick={() => setInviteModalOpen(true)}>+ Invite Member</Button>
                </div>
            }
        >
            {/* Navigation tabs */}
            <div style={{
                display: 'flex',
                gap: '0',
                borderBottom: '1px solid #e5e7eb',
                marginBottom: '24px',
            }}>
                <a href="/org/members" style={{
                    padding: '12px 16px',
                    color: '#374151',
                    textDecoration: 'none',
                    borderBottom: '2px solid #3b82f6',
                    fontWeight: '500',
                    fontSize: '14px',
                }}>
                    Members
                </a>
                <a href="/org/roles" style={{
                    padding: '12px 16px',
                    color: '#6b7280',
                    textDecoration: 'none',
                    borderBottom: '2px solid transparent',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                }}>
                    Roles & Permissions
                </a>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && <div className={styles.error}>{error} <button onClick={() => setError(null)}>×</button></div>}

            {/* Close dropdown on outside click */}
            {roleDropdown && (
                <div className={styles.dropdownOverlay} onClick={() => setRoleDropdown(null)} />
            )}

            <div className={styles.tableCard}>
                <DataTable
                    columns={columns}
                    data={filteredMembers}
                    loading={loading}
                />
            </div>

            {Math.ceil(total / pageSize) > 1 && (
                <div className={styles.pagination}>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <div className={styles.pageInfo}>
                        Page {currentPage} of {Math.ceil(total / pageSize)}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Invite Member Modal */}
            <Modal isOpen={inviteModalOpen} onClose={() => setInviteModalOpen(false)} title="Invite New Member">
                <form onSubmit={handleInviteMember} className={styles.modalForm}>
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={inviteFormData.email}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, email: e.target.value })}
                        placeholder="colleague@company.com"
                    />
                    <Select
                        label="Role"
                        value={inviteFormData.role}
                        onChange={(e) => setInviteFormData({ ...inviteFormData, role: e.target.value })}
                        options={[
                            { label: 'Member', value: 'member' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Organization Admin', value: 'org_admin' },
                        ]}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Send Invite</Button>
                    </div>
                </form>
            </Modal>

            {/* Remove Member Confirmation */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Remove Member?">
                <p className={styles.confirmText}>
                    Are you sure you want to remove this member from your organization? This action cannot be undone.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button variant="danger" loading={submitting} onClick={() => handleRemoveMember(deleteConfirm)}>
                        Remove Member
                    </Button>
                </div>
            </Modal>

            {/* Extra Permissions Modal */}
            <ExtraPermissionsModal
                isOpen={!!permTarget}
                onClose={() => setPermTarget(null)}
                targetName={permTarget?.full_name || permTarget?.email || ''}
                rolePermissions={permTarget ? getRolePermCodes(permTarget) : []}
                extraPermissions={permTarget?.extra_permissions || []}
                availablePermissions={allPermissions}
                onSave={handleSaveExtraPerms}
            />
        </AppShell>
    );
};
