import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Input } from '../components/Input';
import { PermissionBadgeGroup, PermissionBadge } from '../components/PermissionBadge';
import { Toast } from '../components/Toast';
import { organizationAPI } from '../api/organizations';
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
        member: 'Members',
        tenant: 'Organization',
    };
    return map[prefix] || 'Other';
};

const groupPermissions = (perms) => {
    const groups = {};
    perms.forEach((p) => {
        const cat = getCategoryLabel(p.code || p);
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(p);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
};

const RoleCard = ({ role, onEdit, onDelete, onUseTemplate }) => {
    const isDefault = role.is_system;

    return (
        <div className={styles.roleCard}>
            <div className={styles.roleCardHeader}>
                <div className={styles.roleCardTitle}>{role.name}</div>
                {isDefault && (
                    <div className={styles.roleCardBadge}>
                        <ShieldIcon />
                        Default
                    </div>
                )}
            </div>

            {role.description && (
                <div className={styles.roleCardDesc}>{role.description}</div>
            )}

            {role.permissions?.length > 0 && (
                <div className={styles.roleCardPerms}>
                    <PermissionBadgeGroup permissions={role.permissions} max={3} />
                </div>
            )}

            <div className={styles.roleCardFooter}>
                {role.is_modifiable && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(role)}
                            className={styles.roleCardBtn}
                        >
                            <EditIcon /> Edit
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(role)}
                            className={styles.roleCardBtn}
                        >
                            <TrashIcon />
                        </Button>
                    </>
                )}
                {!isDefault && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onUseTemplate(role)}
                        className={styles.roleCardBtn}
                    >
                        Use as Template
                    </Button>
                )}
                {isDefault && !role.is_modifiable && (
                    <div className={styles.roleCardLocked}>
                        <LockIcon /> Cannot modify
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Component ────────────────────────────────────────────────────────────────
export const OrgRolesPage = () => {
    const { user } = useAuthStore();
    const orgId = user?.organization_id;

    const [roles, setRoles] = useState([]);
    const [availablePermissions, setAvailablePermissions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [templateSource, setTemplateSource] = useState(null);

    const [formName, setFormName] = useState('');
    const [formDesc, setFormDesc] = useState('');
    const [formPerms, setFormPerms] = useState([]);
    const [permSearch, setPermSearch] = useState('');

    // Load roles and permissions
    useEffect(() => {
        if (!orgId) return;
        const loadData = async () => {
            try {
                setLoading(true);
                const [rolesData, permsData] = await Promise.all([
                    organizationAPI.listOrgRoles(orgId),
                    organizationAPI.listOrgRolePermissions(orgId),
                ]);
                setRoles(rolesData.items || rolesData || []);
                setAvailablePermissions(permsData || []);
            } catch (err) {
                console.error('Failed to load org roles:', err);
                setToast({ type: 'error', message: 'Failed to load roles' });
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [orgId]);

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
                await organizationAPI.updateOrgRole(orgId, editTarget.id, {
                    description: formDesc,
                    permission_codes: formPerms,
                });
                setToast({ type: 'success', message: `Role "${editTarget.name}" updated` });
            } else {
                await organizationAPI.createOrgRole(orgId, {
                    name: formName.trim(),
                    description: formDesc.trim(),
                    permission_codes: formPerms,
                });
                setToast({ type: 'success', message: `Role "${formName}" created` });
            }
            closeModal();
            // Reload roles
            const rolesData = await organizationAPI.listOrgRoles(orgId);
            setRoles(rolesData.items || rolesData || []);
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
            await organizationAPI.deleteOrgRole(orgId, deleteTarget.id);
            setToast({ type: 'success', message: `Role "${deleteTarget.name}" deleted` });
            setDeleteTarget(null);
            const rolesData = await organizationAPI.listOrgRoles(orgId);
            setRoles(rolesData.items || rolesData || []);
        } catch (err) {
            const msg = extractApiError(err);
            setToast({ type: 'error', message: msg });
            setDeleteTarget(null);
        }
    };

    // Permission picker
    const normalizedAvailable = useMemo(() =>
        availablePermissions.map((p) =>
            typeof p === 'string' ? { code: p, description: '' } : p
        ).filter((p) => p.code && p.code.startsWith('tenant.')),
    [availablePermissions]);

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

    const systemRoles = roles.filter((r) => r.is_system);
    const customRoles = roles.filter((r) => !r.is_system);
    const isFormDisabled = editTarget && !editTarget.is_modifiable;

    return (
        <AppShell
            title="Organization Management"
            actions={<Button onClick={() => openCreate()}>+ Create Role</Button>}
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
                    color: '#6b7280',
                    textDecoration: 'none',
                    borderBottom: '2px solid transparent',
                    fontWeight: '500',
                    fontSize: '14px',
                    transition: 'all 0.2s',
                }}>
                    Members
                </a>
                <a href="/org/roles" style={{
                    padding: '12px 16px',
                    color: '#374151',
                    textDecoration: 'none',
                    borderBottom: '2px solid #3b82f6',
                    fontWeight: '500',
                    fontSize: '14px',
                }}>
                    Roles & Permissions
                </a>
            </div>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        All Roles
                        {!loading && <span className={styles.countBadge}>{roles.length}</span>}
                    </h3>
                </div>

                {loading && roles.length === 0 ? (
                    <div className={styles.roleGrid}>
                        {[1, 2, 3].map((i) => (
                            <div key={i} className={`${styles.roleCard} ${styles.skeleton}`} />
                        ))}
                    </div>
                ) : roles.length === 0 ? (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <ShieldIcon />
                        </div>
                        <div className={styles.emptyTitle}>No roles found</div>
                    </div>
                ) : (
                    <div className={styles.roleGrid}>
                        {systemRoles.map((role) => (
                            <RoleCard
                                key={role.id}
                                role={role}
                                onEdit={openEdit}
                                onDelete={handleDeleteClick}
                                onUseTemplate={openCreate}
                            />
                        ))}
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
                title={editTarget ? `Edit Role — ${editTarget.name}` : 'Create Role'}
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
                        onChange={(e) => setFormName(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        placeholder="e.g. manager, senior_analyst"
                        disabled={!!editTarget}
                        helperText="Use lowercase letters, numbers, hyphens, and underscores only"
                    />

                    <Input
                        label="Description"
                        type="textarea"
                        rows={2}
                        value={formDesc}
                        onChange={(e) => setFormDesc(e.target.value)}
                        placeholder="Brief description"
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
                        <Button type="submit" loading={false} disabled={isFormDisabled}>
                            {editTarget ? 'Update Role' : 'Create Role'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete confirmation modal */}
            {deleteTarget && (
                <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Role">
                    <div style={{ padding: '20px' }}>
                        <p>Are you sure you want to delete the <strong>{deleteTarget.name}</strong> role?</p>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
                            <Button variant="danger" onClick={handleDelete}>Delete</Button>
                        </div>
                    </div>
                </Modal>
            )}
        </AppShell>
    );
};
