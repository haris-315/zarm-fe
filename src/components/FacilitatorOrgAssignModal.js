import React, { useEffect, useState, useMemo } from 'react';
import { useAdminStore } from '../context/adminStore';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { Badge } from './Badge';
import styles from './FacilitatorOrgAssignModal.module.css';

export const FacilitatorOrgAssignModal = ({ isOpen, onClose, facilitator, onSaved }) => {
    const {
        organizations,
        totalOrganizations,
        facilitatorOrgs,
        facilitatorOrgsLoading,
        fetchOrganizations,
        fetchFacilitatorOrgs,
        assignFacilitatorOrgs,
    } = useAdminStore();

    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!isOpen || !facilitator) return;
        setSearch('');
        setToast(null);
        fetchOrganizations(1, 100);
        fetchFacilitatorOrgs(facilitator.id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, facilitator?.id]);

    useEffect(() => {
        if (isOpen) {
            setSelected(new Set(facilitatorOrgs.map((o) => o.id)));
        }
    }, [facilitatorOrgs, isOpen]);

    const filtered = useMemo(() =>
        organizations.filter((o) =>
            o.name?.toLowerCase().includes(search.toLowerCase()) ||
            o.industry?.toLowerCase().includes(search.toLowerCase())
        ),
    [organizations, search]);

    const toggle = (id) => {
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await assignFacilitatorOrgs(facilitator.id, [...selected]);
            setToast({ type: 'success', message: 'Organizations assigned successfully' });
            setTimeout(() => {
                setToast(null);
                onClose();
                if (onSaved) onSaved([...selected]);
            }, 900);
        } catch (err) {
            setToast({ type: 'error', message: err.notReady ? 'Backend endpoint not ready yet' : 'Failed to assign organizations' });
            setSaving(false);
        }
    };

    const loading = facilitatorOrgsLoading && organizations.length === 0;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Assign Organizations — ${facilitator?.full_name || facilitator?.email || ''}`}
            size="lg"
        >
            <div className={styles.container}>
                <div className={styles.meta}>
                    <span className={styles.counter}>
                        <strong>{selected.size}</strong> of {totalOrganizations} orgs assigned
                    </span>
                    <Input
                        placeholder="Search organizations..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={styles.search}
                    />
                </div>

                {toast && (
                    <div className={`${styles.toast} ${styles[toast.type]}`}>
                        {toast.message}
                    </div>
                )}

                {loading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.empty}>No organizations match your search.</div>
                ) : (
                    <div className={styles.list}>
                        {filtered.map((org) => {
                            const checked = selected.has(org.id);
                            return (
                                <label key={org.id} className={`${styles.row} ${checked ? styles.rowChecked : ''}`}>
                                    <input
                                        type="checkbox"
                                        className={styles.checkbox}
                                        checked={checked}
                                        onChange={() => toggle(org.id)}
                                    />
                                    <div className={styles.orgLogo}>
                                        {org.logo_url
                                            ? <img src={org.logo_url} alt="" />
                                            : org.name?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className={styles.orgInfo}>
                                        <span className={styles.orgName}>{org.name}</span>
                                        <span className={styles.orgMeta}>{org.industry || 'Organization'}</span>
                                    </div>
                                    <Badge status={org.status}>{org.status}</Badge>
                                </label>
                            );
                        })}
                    </div>
                )}

                <div className={styles.footer}>
                    <Button variant="secondary" onClick={onClose} disabled={saving}>Cancel</Button>
                    <Button onClick={handleSave} loading={saving}>Save Assignments</Button>
                </div>
            </div>
        </Modal>
    );
};
