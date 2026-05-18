import React, { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '../context/adminStore';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { PermissionBadgeGroup, PermissionBadge } from '../components/PermissionBadge';
import { Toast } from '../components/Toast';
import styles from './RolesPage.module.css';

// ─── Icons ────────────────────────────────────────────────────────────────────
const LockIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);
const ShieldIcon = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);
const TrashIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
);
const EditIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toCodeList = (perms = []) =>
    perms.map((p) => (typeof p === 'string' ? p : p.code || p.name || '')).filter(Boolean);

const extractApiError = (err) => {
    const detail = err?.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
    if (typeof detail === 'string') return detail;
    return err?.message || 'An unexpected error occurred';
};

const getCategoryLabel = (code) => {
    const prefix = (typeof code === 'string' ? code : code?.code || '').split('.')[0];
    const map = {
        sprint: 'Sprint',
        finding: 'Finding',
        decision: 'Decision',
        organization: 'Organization',
        org: 'Organization',
        report: 'Report',
        platform: 'Platform',
        process: 'Process',
    };
    return map[prefix] || 'Other';
};

// Group [{code, description}] by category prefix
const groupPermissions = (perms) => {
    const groups = {};
    perms.forEach((p) => {
        const cat = getCategoryLabel(p.code || p);
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

// ─── Component ────────────────────────────────────────────────────────────────
export const RolesPage = () => {
    const {
        roles,
        availableRolePermissions,
        rolesLoading,
        isLoading,
        error,
        fetchRoles,
        fetchAvailableRolePermissions,
        createRole,
        updateRole,
        deleteRole,
        clearError,
    } = useAdminStore();

    const [toast, setToast] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);   // role object being edited
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [templateSource, setTemplateSource] = useState(null);

    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formPerms, setFormPerms] = useState([]);
    const [permSearch, setPermSearch] = useState('');

    useEffect(() => {
        fetchRoles();
        fetchAvailableRolePermissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Modal helpers ──
    const openCreate = (template = null) => {
        setFormName('');
        setFormDesc('');
        setFormPerms(template ? toCodeList(template.permissions) : []);
        setTemplateSource(template ? template.name : null);
        setEditTarget(null);
        setPermSearch('');
        setModalOpen(true);
    };

    const openEdit = (role) => {
        if (!role.is_modifiable) {
            setToast({ type: 'error', message: `The "${role.name}" role cannot be modified` });
            return;
        }
        setFormName(role.name);
        setFormDesc(role.description || '');
        setFormPerms(toCodeList(role.permissions));
        setPermSearch('');
        setTemplateSource(null);
        setEditTarget(role);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditTarget(null);
        setFormName('');
        setFormDesc('');
        setFormPerms([]);
        setPermSearch('');
        setTemplateSource(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editTarget) {
                await updateRole(editTarget.id, formDesc, formPerms);
                setToast({ type: 'success', message: `Role "${editTarget.name}" updated` });
            } else {
                const created = await createRole(formName.trim(), formDesc.trim(), formPerms);
                setToast({ type: 'success', message: `Role "${created.name}" created` });
            }
            closeModal();
        } catch (err) {
            const msg = extractApiError(err);
            setToast({ type: 'error', message: msg });
        }
    };

    const handleDeleteClick = (role) => {
        if (!role.is_deletable) {
            setToast({ type: 'error', message: `Cannot delete system role "${role.name}"` });
            return;
        }
        setDeleteTarget(role);
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteRole(deleteTarget.id);
            setToast({ type: 'success', message: `Role "${deleteTarget.name}" deleted` });
            setDeleteTarget(null);
        } catch (err) {
            const msg = extractApiError(err);
            setToast({ type: 'error', message: msg });
            setDeleteTarget(null);
        }
    };

    // ── Permission picker ──
    const normalizedAvailable = useMemo(() =>
        availableRolePermissions.map((p) =>
            typeof p === 'string' ? { code: p, description: '' } : p
        ).filter((p) => p.code),
    [availableRolePermissions]);

    const filteredAvailable = useMemo(() =>
        normalizedAvailable.filter((p) =>
            p.code.toLowerCase().includes(permSearch.toLowerCase()) ||
            p.description?.toLowerCase().includes(permSearch.toLowerCase())
        ),
    [normalizedAvailable, permSearch]);

    const groupedAvailable = useMemo(() => groupPermissions(filteredAvailable), [filteredAvailable]);

    const togglePerm = (code) => {
        setFormPerms((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    // ── Partition roles ──
    const systemRoles = roles.filter((r) => r.is_system);
    const customRoles = roles.filter((r) => !r.is_system);

    const isFormDisabled = editTarget && !editTarget.is_modifiable;

    return (
        <AppShell
            title="Roles & Permissions"
            actions={<Button onClick={() => openCreate()}>+ Create Role</Button>}
        >
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && (
                <div className={styles.error}>{error}<button onClick={clearError}>×</button></div>
            )}

            {/* ── All Roles unified list ── */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        All Roles
                        {!rolesLoading && <span className={styles.countBadge}>{roles.length}</span>}
                    </h3>
                </div>

                {rolesLoading && roles.length === 0 ? (
                    <div className={styles.roleGrid}>
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className={`${styles.roleCard} ${styles.skeleton}`} />
                        ))}
                    </div>
                ) : roles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <div className={styles.emptyTitle}>No roles found</div>
                        <div className={styles.emptyText}>Platform roles will appear here once loaded.</div>
                    </div>
                ) : (
                    <div className={styles.roleGrid}>
                        {/* System roles first */}
                        {systemRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={openEdit}
                                onDelete={handleDeleteClick}
                                onUseTemplate={openCreate}
                            />
                        ))}
                        {/* Custom roles */}
                        {customRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={openEdit}
                                onDelete={handleDeleteClick}
                                onUseTemplate={openCreate}
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editTarget ? `Edit Role — ${editTarget.name}` : 'Create Custom Role'}
                size="md"
            >
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {isFormDisabled && (
                        <div className={styles.protectedBanner}>
                            <ShieldIcon />
                            <span>The <strong>{editTarget.name}</strong> role cannot be modified.</span>
                        </div>
                    )}

                    {templateSource && (
                        <div className={styles.templateBanner}>
                            Duplicated from template: <strong>{templateSource}</strong>
                        </div>
                    )}

                    <Input
                        label="Role Name"
                        required={!editTarget}
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g. Sprint Analyst"
                        disabled={!!editTarget}
                    />

                    <Input
                        label="Description"
                        type="textarea"
                        rows={2}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Brief description of this role's responsibilities"
                        disabled={isFormDisabled}
                    />

                    {/* Permission picker */}
                    <div className={styles.permPickerWrapper}>
                        <div className={styles.permPickerLabel}>
                            <span>Permissions</span>
                            {formPerms.length > 0 && (
                                <span className={styles.countBadge}>{formPerms.length} selected</span>
                            )}
                        </div>

                        {formPerms.length > 0 && (
                            <div className={styles.selectedPerms}>
                                {formPerms.map((code) => (
                                    <button
                                        key={code}
                                        type="button"
                                        className={styles.selectedChip}
                                        onClick={() => !isFormDisabled && togglePerm(code)}
                                        disabled={isFormDisabled}
                                        title="Remove"
                                    >
                                        <PermissionBadge code={code} />
                                        {!isFormDisabled && <span className={styles.removeX}>×</span>}
                                    </button>
                                ))}
                            </div>
                        )}

                        <input
                            className={styles.permSearch}
                            placeholder="Search permissions..."
                            value={permSearch}
                            onChange={(e) => setPermSearch(e.target.value)}
                            disabled={isFormDisabled}
                        />

                        <div className={styles.permGrid}>
                            {groupedAvailable.length === 0 ? (
                                <div className={styles.noPerms}>No permissions found</div>
                            ) : (
                                groupedAvailable.map(([category, perms]) => (
                                    <div key={category} className={styles.permCategory}>
                                        <div className={styles.permCategoryLabel}>{category}</div>
                                        {perms.map((p) => {
                                            const checked = formPerms.includes(p.code);
                                            return (
                                                <label
                                                    key={p.code}
                                                    className={`${styles.permItem} ${checked ? styles.checked : ''} ${isFormDisabled ? styles.permItemDisabled : ''}`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => togglePerm(p.code)}
                                                        className={styles.checkbox}
                                                        disabled={isFormDisabled}
                                                    />
                                                    <div className={styles.permItemContent}>
                                                        <PermissionBadge code={p.code} />
                                                        {p.description && (
                                                            <span className={styles.permDesc}>{p.description}</span>
                                                        )}
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
                        {isFormDisabled ? (
                            <Button type="button" variant="secondary" onClick={closeModal}>Close</Button>
                        ) : (
                            <Button type="submit" loading={isLoading}>
                                {editTarget ? 'Save Changes' : 'Create Role'}
                            </Button>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title={`Delete "${deleteTarget?.name}"?`}
            >
                <p className={styles.deleteText}>
                    This will permanently delete the role. Users assigned to{' '}
                    <strong>{deleteTarget?.name}</strong> will need to be reassigned.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" loading={isLoading} onClick={handleDelete}>
                        Yes, Delete
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
};

// ─── Role Card sub-component ──────────────────────────────────────────────────
const RoleCard = ({ role, onEdit, onDelete, onUseTemplate }) => {
    const permCodes = role.permissions?.map((p) =>
        typeof p === 'string' ? p : p.code || ''
    ).filter(Boolean) || [];

    const canEdit = role.is_modifiable;
    const canDelete = role.is_deletable;

    const editTitle = !canEdit
        ? `The "${role.name}" role cannot be modified`
        : 'Edit role';
    const deleteTitle = !canDelete
        ? `System roles cannot be deleted`
        : 'Delete role';

    return (
        <div className={`${styles.roleCard} ${role.is_system ? styles.systemCard : ''}`}>
            <div className={styles.cardHeader}>
                <div className={styles.cardTitleRow}>
                    <div className={styles.roleName}>{role.name}</div>
                    <div className={styles.cardBadges}>
                        {role.is_system ? (
                            <span className={styles.systemBadge}>System</span>
                        ) : (
                            <span className={styles.customBadge}>Custom</span>
                        )}
                        {!canDelete && (
                            <span className={styles.lockIcon} title={deleteTitle}><LockIcon /></span>
                        )}
                        {!canEdit && (
                            <span className={styles.shieldIcon} title={editTitle}><ShieldIcon /></span>
                        )}
                    </div>
                </div>
            </div>

            {role.description && (
                <p className={styles.roleDesc}>{role.description}</p>
            )}

            <div className={styles.permSummary}>
                {permCodes.length > 0 ? (
                    <>
                        <PermissionBadgeGroup codes={permCodes} max={5} />
                        {permCodes.length > 0 && (
                            <span className={styles.permCount}>
                                {permCodes.length} permission{permCodes.length !== 1 ? 's' : ''}
                            </span>
                        )}
                    </>
                ) : (
                    <span className={styles.noPerms}>No permissions assigned</span>
                )}
            </div>

            <div className={styles.cardFooter}>
                <button
                    className={`${styles.iconBtn} ${!canEdit ? styles.iconBtnDisabled : ''}`}
                    onClick={() => onEdit(role)}
                    disabled={!canEdit}
                    title={editTitle}
                >
                    <EditIcon />
                    <span>Edit</span>
                </button>

                <button
                    className={`${styles.iconBtn} ${styles.iconBtnDanger} ${!canDelete ? styles.iconBtnDisabled : ''}`}
                    onClick={() => onDelete(role)}
                    disabled={!canDelete}
                    title={deleteTitle}
                >
                    <TrashIcon />
                    <span>Delete</span>
                </button>

                <button
                    className={`${styles.iconBtn} ${styles.iconBtnGhost}`}
                    onClick={() => onUseTemplate(role)}
                    title="Duplicate as template for a new custom role"
                >
                    <span>Use as template</span>
                </button>
            </div>
        </div>
    );
};
