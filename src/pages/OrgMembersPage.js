import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
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
    const { user, organization } = useAuthStore();
    const {
        orgMembers,
        totalOrgMembers,
        orgMembersCurrentPage,
        orgMembersPageSize,
        orgMembersLoading,
        roles: platformRoles,
        availablePermissions,
        availableRolePermissions,
        error,
        fetchOrgMembers,
        fetchAvailablePermissions,
        fetchRoles,
        fetchAvailableRolePermissions,
        removeOrgMember,
        inviteOrgMember,
        assignOrgMemberRole,
        setOrgMemberExtraPermissions,
        setOrgMembersPage,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [roleDropdown, setRoleDropdown] = useState(null);
    const [permTarget, setPermTarget] = useState(null);
    const [toast, setToast] = useState(null);

    const [inviteFormData, setInviteFormData] = useState({ email: '', role: 'member' });

    useEffect(() => {
        fetchOrgMembers(orgMembersCurrentPage, orgMembersPageSize);
        fetchAvailablePermissions();
        fetchRoles();
        fetchAvailableRolePermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgMembersCurrentPage]);

    const handleRemoveMember = async (memberId) => {
        setSubmitting(true);
        try {
            await removeOrgMember(memberId);
            setDeleteConfirm(null);
            setToast({ type: 'success', message: 'Member removed' });
        } catch {
            setToast({ type: 'error', message: 'Failed to remove member' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await inviteOrgMember(inviteFormData);
            setInviteModalOpen(false);
            setInviteFormData({ email: '', role: 'member' });
            setToast({ type: 'success', message: 'Invitation sent' });
        } catch {
            setToast({ type: 'error', message: 'Failed to send invite' });
        } finally {
            setSubmitting(false);
        }
    };

    const handleRoleAssign = async (memberId, roleId) => {
        setRoleDropdown(null);
        try {
            await assignOrgMemberRole(memberId, roleId);
            setToast({ type: 'success', message: 'Role assigned' });
        } catch {
            setToast({ type: 'error', message: 'Failed to assign role' });
        }
    };

    const handleSaveExtraPerms = async (newPerms) => {
        if (!permTarget) return;
        await setOrgMemberExtraPermissions(permTarget.id, newPerms);
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

    const filteredMembers = orgMembers.filter(
        (member) =>
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const combinedAvailablePerms = [
        ...(availableRolePermissions || []),
        ...(availablePermissions || []),
    ].filter((v, i, arr) => {
        const code = typeof v === 'string' ? v : v.code || v.name;
        return arr.findIndex((x) => (typeof x === 'string' ? x : x.code || x.name) === code) === i;
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
                                    {platformRoles.length === 0 ? (
                                        <div className={styles.dropdownEmpty}>No roles available</div>
                                    ) : (
                                        platformRoles.map((r) => (
                                            <button
                                                key={r.id}
                                                className={`${styles.dropdownItem} ${roleName === r.name ? styles.dropdownItemActive : ''}`}
                                                onClick={() => handleRoleAssign(row.id, r.id)}
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

    const totalPages = Math.ceil(totalOrgMembers / orgMembersPageSize);

    return (
        <AppShell
            title="Team Members"
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
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>}

            {/* Close dropdown on outside click */}
            {roleDropdown && (
                <div className={styles.dropdownOverlay} onClick={() => setRoleDropdown(null)} />
            )}

            {/* Org summary strip for the admin */}
            {organization && (
                <div className={styles.orgStrip}>
                    <div className={styles.orgStripLeft}>
                        <div className={styles.orgLogoSmall}>
                            {organization.logo_url
                                ? <img src={organization.logo_url} alt="" />
                                : organization.name?.charAt(0)}
                        </div>
                        <div>
                            <div className={styles.orgName}>{organization.name}</div>
                            <div className={styles.orgMeta}>{organization.industry || 'Organization'}</div>
                        </div>
                    </div>
                    <div className={styles.orgStripRight}>
                        <Badge status={organization.status}>{organization.status}</Badge>
                        <span className={styles.memberCount}>{totalOrgMembers} members</span>
                    </div>
                </div>
            )}

            <div className={styles.tableCard}>
                <DataTable
                    columns={columns}
                    data={filteredMembers}
                    loading={orgMembersLoading}
                />
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={orgMembersCurrentPage === 1}
                        onClick={() => setOrgMembersPage(orgMembersCurrentPage - 1)}
                    >
                        Previous
                    </Button>
                    <div className={styles.pageInfo}>
                        Page {orgMembersCurrentPage} of {totalPages}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={orgMembersCurrentPage === totalPages}
                        onClick={() => setOrgMembersPage(orgMembersCurrentPage + 1)}
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
                availablePermissions={combinedAvailablePerms}
                onSave={handleSaveExtraPerms}
            />
        </AppShell>
    );
};
