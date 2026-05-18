import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { PermissionBadge, PermissionBadgeGroup } from './PermissionBadge';
import { Toast } from './Toast';
import styles from './ExtraPermissionsModal.module.css';

/**
 * Modal for viewing role permissions (read-only) and managing extra permissions.
 *
 * Props:
 *   isOpen, onClose
 *   targetName – display name of the user being edited
 *   rolePermissions – array of permission codes from the assigned role (read-only)
 *   extraPermissions – current extra permission codes
 *   availablePermissions – full list of permission objects/strings to pick from
 *   onSave(newExtraPermissions) – called with updated extra-permissions array
 */
export const ExtraPermissionsModal = ({
  isOpen,
  onClose,
  targetName,
  rolePermissions = [],
  extraPermissions = [],
  availablePermissions = [],
  onSave,
}) => {
  const [selected, setSelected] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setSelected(extraPermissions);
      setSearch('');
    }
  }, [isOpen, extraPermissions]);

  const addablePermissions = availablePermissions
    .map((p) => (typeof p === 'string' ? p : p.code || p.name || ''))
    .filter((code) => code && !rolePermissions.includes(code));

  const filtered = addablePermissions.filter((code) =>
    code.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (code) => {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(selected);
      setToast({ type: 'success', message: 'Permissions updated' });
      onClose();
    } catch {
      setToast({ type: 'error', message: 'Failed to save permissions' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
      <Modal isOpen={isOpen} onClose={onClose} title={`Permissions — ${targetName}`} size="md">
        <div className={styles.body}>
          {rolePermissions.length > 0 && (
            <section className={styles.section}>
              <div className={styles.sectionLabel}>
                <span className={styles.sectionTitle}>Core (from role)</span>
                <span className={styles.sectionHint}>Read-only</span>
              </div>
              <div className={styles.permList}>
                <PermissionBadgeGroup codes={rolePermissions} />
              </div>
            </section>
          )}

          <section className={styles.section}>
            <div className={styles.sectionLabel}>
              <span className={styles.sectionTitle}>Additional Permissions</span>
            </div>

            <input
              className={styles.search}
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {selected.filter((c) => !rolePermissions.includes(c)).length > 0 && (
              <div className={styles.selectedRow}>
                {selected
                  .filter((c) => !rolePermissions.includes(c))
                  .map((code) => (
                    <button
                      key={code}
                      type="button"
                      className={styles.selectedChip}
                      onClick={() => toggle(code)}
                      title="Click to remove"
                    >
                      <PermissionBadge code={code} />
                      <span className={styles.removeX}>×</span>
                    </button>
                  ))}
              </div>
            )}

            <div className={styles.permGrid}>
              {filtered.length === 0 ? (
                <div className={styles.empty}>No permissions available</div>
              ) : (
                filtered.map((code) => {
                  const isChecked = selected.includes(code);
                  return (
                    <label key={code} className={`${styles.permItem} ${isChecked ? styles.checked : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggle(code)}
                        className={styles.checkbox}
                      />
                      <PermissionBadge code={code} />
                    </label>
                  );
                })
              )}
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} loading={saving}>
            Save Permissions
          </Button>
        </div>
      </Modal>
    </>
  );
};
