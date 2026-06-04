import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { ExtraPermissionsModal } from '../components/ExtraPermissionsModal';
import { Toast } from '../components/Toast';
import { PermissionBadgeGroup } from '../components/PermissionBadge';
import { FacilitatorOrgAssignModal } from '../components/FacilitatorOrgAssignModal';
import styles from './FacilitatorsList.module.css';

const GearIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export const FacilitatorsList = () => {
    const navigate = useNavigate();
    const { user, roles: userRoles } = useAuthStore();
    const {
        facilitators,
        totalFacilitators,
        currentPage,
        pageSize,
        isLoading,
        roles: platformRoles,
        availableRolePermissions,
        error,
        fetchFacilitators,
        fetchRoles,
        fetchAvailableRolePermissions,
        setPage,
        disableFacilitator,
        assignFacilitatorRole,
        setFacilitatorExtraPermissions,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [roleDropdown, setRoleDropdown] = useState(null);
    const [permTarget, setPermTarget] = useState(null);
    const [orgAssignTarget, setOrgAssignTarget] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchFacilitators(currentPage, pageSize);
        fetchRoles();
        fetchAvailableRolePermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleDisable = async (facilitatorId) => {
        try {
            await disableFacilitator(facilitatorId);
            setDeleteConfirm(null);
            setToast({ type: 'success', message: 'Facilitator disabled' });
        } catch (err) {
            setToast({ type: 'error', message: 'Failed to disable facilitator' });
        }
    };

    const handleRoleAssign = async (facilitatorId, roleId) => {
        setRoleDropdown(null);
        try {
            await assignFacilitatorRole(facilitatorId, roleId);
            setToast({ type: 'success', message: 'Role assigned successfully' });
        } catch {
            setToast({ type: 'error', message: 'Failed to assign role' });
        }
    };

    const handleSaveExtraPerms = async (newPerms) => {
        if (!permTarget) return;
        await setFacilitatorExtraPermissions(permTarget.id, newPerms);
    };

    const filteredFacilitators = facilitators.filter(
        (c) =>
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // `role` is now an object {id, name, ...} from the API
    const getAssignedRoleName = (facilitator) =>
        facilitator.role?.name || facilitator.role_name || null;

    // Derive role-sourced permissions: all_permissions minus extra_permissions
    const getRolePermCodes = (facilitator) => {
        const extraCodes = facilitator.extra_permissions || [];
        return (facilitator.all_permissions || [])
            .map((p) => (typeof p === 'string' ? p : p.code || ''))
            .filter((code) => code && !extraCodes.includes(code));
    };

    const columns = [
        {
            key: 'email',
            label: 'Facilitator',
            render: (val, row) => (
                <div className={styles.userCell}>
                    <div className={styles.avatar}>
                        {row.avatar_url
                            ? <img src={row.avatar_url} alt="" />
                            : val.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className={styles.userName}>{row.full_name || 'No Name'}</div>
                        <div className={styles.userEmail}>{val}</div>
                    </div>
                </div>
            ),
        },
        { key: 'title', label: 'Title', render: (val) => val || <span className={styles.muted}>—</span> },
        {
            key: 'status',
            label: 'Status',
            render: (val) => <Badge status={val}>{val}</Badge>,
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
            key: 'permissions',
            label: 'Permissions',
            render: (_, row) => {
                const allPerms = (row.all_permissions || []).map((p) => typeof p === 'string' ? p : p.code || '').filter(Boolean);
                return allPerms.length > 0 ? (
                    <PermissionBadgeGroup codes={allPerms} max={3} />
                ) : (
                    <span className={styles.muted}>No permissions</span>
                );
            },
        },
        {
            key: 'organizations',
            label: 'Organizations',
            render: (_, row) => (
                <button
                    className={styles.orgAssignBtn}
                    onClick={(e) => { e.stopPropagation(); setOrgAssignTarget(row); }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Manage
                </button>
            ),
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Link to={`/admin/facilitators/${row.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Link to={`/admin/facilitators/${row.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="sm"
                        title="Manage extra permissions"
                        onClick={(e) => { e.stopPropagation(); setPermTarget(row); }}
                    >
                        <GearIcon />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setDeleteConfirm(row.id); }}>
                        Disable
                    </Button>
                </div>
            ),
        },
    ];

    const totalPages = Math.ceil(totalFacilitators / pageSize);

    return (
        <AppShell
            title="Facilitators"
            actions={
                <div className={styles.topActions}>
                    <Input
                        placeholder="Search facilitators..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <Button onClick={() => navigate('/admin/facilitators/new')}>+ New Facilitator</Button>
                </div>
            }
        >
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && (
                <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>
            )}

            {/* Close dropdown on outside click */}
            {roleDropdown && (
                <div className={styles.dropdownOverlay} onClick={() => setRoleDropdown(null)} />
            )}

            <div className={styles.tableCard}>
                <DataTable
                    columns={columns}
                    data={filteredFacilitators}
                    loading={isLoading}
                    onRowClick={(row) => navigate(`/admin/facilitators/${row.id}`)}
                />
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setPage(currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <div className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setPage(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Disable confirmation */}
            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Disable Facilitator?"
            >
                <p className={styles.confirmText}>
                    Are you sure you want to disable this facilitator account? They will no longer be able to log in.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button variant="danger" loading={isLoading} onClick={() => handleDisable(deleteConfirm)}>
                        Disable Account
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
                availablePermissions={availableRolePermissions}
                onSave={handleSaveExtraPerms}
            />

            {/* Organization Assignment Modal */}
            <FacilitatorOrgAssignModal
                isOpen={!!orgAssignTarget}
                onClose={() => setOrgAssignTarget(null)}
                facilitator={orgAssignTarget}
                onSaved={() => setToast({ type: 'success', message: 'Organizations updated' })}
            />
        </AppShell>
    );
};
