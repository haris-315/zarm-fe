import React, { useEffect, useState } from 'react';
import { useAdminStore } from '../context/adminStore';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { PermissionBadgeGroup, PermissionBadge } from '../components/PermissionBadge';
import { Toast } from '../components/Toast';
import styles from './RolesPage.module.css';

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
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [templateSource, setTemplateSource] = useState(null);

    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formPerms, setFormPerms] = useState([]);
    const [permSearch, setPermSearch] = useState('');

    useEffect(() => {
        fetchRoles();
        fetchAvailableRolePermissions();
    }, [fetchRoles, fetchAvailableRolePermissions]);

    const openCreate = (template = null) => {
        setFormName('');
        setFormDesc('');
        setFormPerms(template ? [...(template.permissions || [])] : []);
        setTemplateSource(template ? template.name : null);
        setEditTarget(null);
        setCreateModalOpen(true);
    };

    const openEdit = (role) => {
        setFormName(role.name);
        setFormDesc(role.description || '');
        setFormPerms([...(role.permissions || [])]);
        setPermSearch('');
        setTemplateSource(null);
        setEditTarget(role);
        setCreateModalOpen(true);
    };

    const closeModal = () => {
        setCreateModalOpen(false);
        setEditTarget(null);
        setFormName('');
        setFormDesc('');
        setFormPerms([]);
        setPermSearch('');
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
        } catch {
            setToast({ type: 'error', message: error || 'Operation failed' });
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteRole(deleteTarget.id);
            setToast({ type: 'success', message: `Role "${deleteTarget.name}" deleted` });
            setDeleteTarget(null);
        } catch {
            setToast({ type: 'error', message: error || 'Failed to delete role' });
        }
    };

    const availableCodes = availableRolePermissions
        .map((p) => (typeof p === 'string' ? p : p.code || p.name || ''))
        .filter(Boolean);

    const filteredCodes = availableCodes.filter((code) =>
        code.toLowerCase().includes(permSearch.toLowerCase())
    );

    const togglePerm = (code) => {
        setFormPerms((prev) =>
            prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
        );
    };

    const systemRoles = roles.filter((r) => !r.is_custom);
    const customRoles = roles.filter((r) => r.is_custom);

    return (
        <AppShell
            title="Roles & Permissions"
            actions={
                <Button onClick={() => openCreate()}>+ Create Role</Button>
            }
        >
            {toast && (
                <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>×</button>
                </div>
            )}

            {/* System Roles */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>System Roles</h3>
                    <span className={styles.sectionHint}>Read-only · managed by the platform</span>
                </div>
                <div className={styles.roleGrid}>
                    {rolesLoading && systemRoles.length === 0
                        ? [1, 2, 3].map((i) => <div key={i} className={`${styles.roleCard} ${styles.skeleton}`} />)
                        : systemRoles.map((role) => (
                            <div key={role.id} className={`${styles.roleCard} ${styles.systemCard}`}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.roleName}>{role.name}</div>
                                    <Badge status="planning">System</Badge>
                                </div>
                                {role.description && (
                                    <p className={styles.roleDesc}>{role.description}</p>
                                )}
                                {role.permissions?.length > 0 && (
                                    <div className={styles.permRow}>
                                        <PermissionBadgeGroup codes={role.permissions} max={6} />
                                    </div>
                                )}
                                <div className={styles.cardFooter}>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openCreate(role)}
                                        title="Duplicate this role as a template for a new custom role"
                                    >
                                        Use as template
                                    </Button>
                                </div>
                            </div>
                        ))}
                </div>
            </section>

            {/* Custom Roles */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        Custom Roles
                        {customRoles.length > 0 && (
                            <span className={styles.countBadge}>{customRoles.length}</span>
                        )}
                    </h3>
                </div>

                {customRoles.length === 0 && !rolesLoading ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /><path d="M19 11l2 2-5 5" /></svg>
                        </div>
                        <div className={styles.emptyTitle}>No custom roles yet</div>
                        <div className={styles.emptyText}>Create a role with specific permission packs to assign to facilitators and org members.</div>
                        <Button onClick={() => openCreate()} style={{ marginTop: 16 }}>+ Create First Role</Button>
                    </div>
                ) : (
                    <div className={styles.roleGrid}>
                        {customRoles.map((role) => (
                            <div key={role.id} className={styles.roleCard}>
                                <div className={styles.cardHeader}>
                                    <div className={styles.roleName}>{role.name}</div>
                                    <Badge status="in_progress">Custom</Badge>
                                </div>
                                {role.description && (
                                    <p className={styles.roleDesc}>{role.description}</p>
                                )}
                                {role.permissions?.length > 0 ? (
                                    <div className={styles.permRow}>
                                        <PermissionBadgeGroup codes={role.permissions} max={8} />
                                    </div>
                                ) : (
                                    <div className={styles.noPerms}>No permissions assigned</div>
                                )}
                                <div className={styles.cardFooter}>
                                    <Button variant="ghost" size="sm" onClick={() => openEdit(role)}>Edit</Button>
                                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(role)}>Delete</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Create / Edit Modal */}
            <Modal
                isOpen={createModalOpen}
                onClose={closeModal}
                title={editTarget ? `Edit Role — ${editTarget.name}` : 'Create Custom Role'}
                size="md"
            >
                <form onSubmit={handleSubmit} className={styles.modalForm}>
                    {templateSource && (
                        <div className={styles.templateBanner}>
                            Duplicated from template: <strong>{templateSource}</strong>
                        </div>
                    )}

                    <Input
                        label="Role Name"
                        required
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
                    />

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
                                        onClick={() => togglePerm(code)}
                                        title="Remove"
                                    >
                                        <PermissionBadge code={code} />
                                        <span className={styles.removeX}>×</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        <input
                            className={styles.permSearch}
                            placeholder="Search permissions..."
                            value={permSearch}
                            onChange={(e) => setPermSearch(e.target.value)}
                        />

                        <div className={styles.permGrid}>
                            {filteredCodes.length === 0 ? (
                                <div className={styles.noPerms}>No permissions found</div>
                            ) : (
                                filteredCodes.map((code) => {
                                    const checked = formPerms.includes(code);
                                    return (
                                        <label
                                            key={code}
                                            className={`${styles.permItem} ${checked ? styles.checked : ''}`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={checked}
                                                onChange={() => togglePerm(code)}
                                                className={styles.checkbox}
                                            />
                                            <PermissionBadge code={code} />
                                        </label>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={closeModal}>Cancel</Button>
                        <Button type="submit" loading={isLoading}>
                            {editTarget ? 'Save Changes' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                title="Delete Role?"
            >
                <p className={styles.deleteText}>
                    Are you sure you want to delete the role <strong>"{deleteTarget?.name}"</strong>?
                    Users assigned this role will lose it.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                    <Button variant="danger" loading={isLoading} onClick={handleDelete}>Delete Role</Button>
                </div>
            </Modal>
        </AppShell>
    );
};
