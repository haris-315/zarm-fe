import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { facilitatorAPI } from '../api/facilitators';
import { organizationAPI } from '../api/organizations';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import styles from './FacilitatorDetail.module.css';

export const FacilitatorForm = () => {
    const navigate = useNavigate();
    const { facilitatorId } = useParams();
    const { user, roles } = useAuthStore();
    const {
        selectedFacilitator,
        isLoading,
        error,
        fetchFacilitator,
        createFacilitator,
        updateFacilitator,
        clearError,
        clearSelectedFacilitator,
    } = useAdminStore();

    const isEditMode = !!facilitatorId;

    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        title: '',
        status: 'active',
    });

    const [allOrganizations, setAllOrganizations] = useState([]);
    const [assignedOrgIds, setAssignedOrgIds] = useState(new Set());
    const [selectedOrgIds, setSelectedOrgIds] = useState(new Set());
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState(false);

    // Fetch all organizations
    useEffect(() => {
        const fetchOrgs = async () => {
            try {
                setLoadingOrgs(true);
                const response = await organizationAPI.listOrganizations(1, 1000);
                setAllOrganizations(response.items || []);
            } catch (err) {
                console.error('Failed to fetch organizations:', err);
            } finally {
                setLoadingOrgs(false);
            }
        };
        fetchOrgs();
    }, []);

    // Fetch facilitator details and assigned orgs
    useEffect(() => {
        if (isEditMode) {
            fetchFacilitator(facilitatorId);
        }
        return () => clearSelectedFacilitator();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, facilitatorId]);

    // Load assigned organizations when facilitator is loaded
    useEffect(() => {
        if (isEditMode && selectedFacilitator) {
            setFormData({
                email: selectedFacilitator.email,
                full_name: selectedFacilitator.full_name || '',
                title: selectedFacilitator.title || '',
                status: selectedFacilitator.status || 'active',
                password: '',
            });

            // Fetch assigned organizations
            const fetchAssignedOrgs = async () => {
                try {
                    const response = await facilitatorAPI.getAssignedOrgs(facilitatorId);
                    console.log('Assigned orgs response:', response);

                    // Handle both array and { items: [...] } response formats
                    const orgs = Array.isArray(response) ? response : (response.items || []);
                    console.log('Parsed orgs:', orgs);

                    const orgIds = new Set(orgs.map(org => org.id));
                    console.log('Org IDs to select:', orgIds);

                    setAssignedOrgIds(orgIds);
                    setSelectedOrgIds(new Set(orgIds)); // Pre-select assigned orgs
                } catch (err) {
                    console.error('Failed to fetch assigned organizations:', err);
                    setLocalError(`Failed to load assigned organizations: ${err.message}`);
                }
            };
            fetchAssignedOrgs();
        }
    }, [selectedFacilitator, isEditMode, facilitatorId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleOrgToggle = (orgId) => {
        setSelectedOrgIds(prev => {
            const next = new Set(prev);
            if (next.has(orgId)) {
                next.delete(orgId);
            } else {
                next.add(orgId);
            }
            return next;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccess('');
        setSubmitting(true);

        try {
            if (!formData.email) { setLocalError('Email is required'); setSubmitting(false); return; }
            if (!isEditMode && !formData.title) { setLocalError('Title is required'); setSubmitting(false); return; }

            if (isEditMode) {
                const updatePayload = {};
                if (formData.email) updatePayload.email = formData.email;
                if (formData.full_name) updatePayload.full_name = formData.full_name;
                if (formData.title) updatePayload.title = formData.title;
                if (formData.status) updatePayload.status = formData.status;
                await updateFacilitator(facilitatorId, updatePayload);

                // Handle organization assignment changes
                const toRemove = Array.from(assignedOrgIds).filter(id => !selectedOrgIds.has(id));
                const toAdd = Array.from(selectedOrgIds).filter(id => !assignedOrgIds.has(id));

                // Remove unselected organizations
                for (const orgId of toRemove) {
                    await facilitatorAPI.removeOrg(facilitatorId, orgId);
                }

                // If there are new selections or removals, update the full list
                if (toAdd.length > 0 || toRemove.length > 0) {
                    await facilitatorAPI.assignOrgs(facilitatorId, Array.from(selectedOrgIds));
                }

                setSuccess('Facilitator and organizations updated successfully');
                setTimeout(() => navigate('/admin/facilitators'), 1500);
            } else {
                const createPayload = { email: formData.email, title: formData.title };
                if (formData.full_name) createPayload.full_name = formData.full_name;
                await createFacilitator(createPayload);
                setSuccess('Invitation sent successfully');
                setTimeout(() => navigate('/admin/facilitators'), 1500);
            }
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to save facilitator');
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbs = (
        <div className={styles.breadcrumbs}>
            <Link to="/admin/facilitators">Facilitators</Link>
            <span>/</span>
            <span>{isEditMode ? 'Edit' : 'Invite New'}</span>
        </div>
    );

    return (
        <AppShell title={breadcrumbs}>
            {(error || localError) && (
                <div className={styles.error}>{localError || error}</div>
            )}
            {success && <div className={styles.successBanner}>{success}</div>}

            <div className={styles.formContainer}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.infoCard}>
                        <h3 className={styles.sectionTitle}>
                            {isEditMode ? 'Edit Facilitator' : 'Invite New Facilitator'}
                        </h3>

                        <div className={styles.infoGrid}>
                            <Input
                                label="Email Address *"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="facilitator@example.com"
                                required
                                disabled={submitting}
                            />
                            <Input
                                label="Full Name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="Jane Doe"
                                disabled={submitting}
                            />
                            <Input
                                label={`Title${!isEditMode ? ' *' : ''}`}
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Senior Facilitator"
                                required={!isEditMode}
                                disabled={submitting}
                            />
                            {isEditMode && (
                                <Select
                                    label="Status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    disabled={submitting}
                                    options={[
                                        { label: 'Active', value: 'active' },
                                        { label: 'Disabled', value: 'disabled' }
                                    ]}
                                />
                            )}
                        </div>
                    </div>

                    {isEditMode && (
                        <div className={styles.infoCard}>
                            <h3 className={styles.sectionTitle}>
                                Assigned Organizations
                                {selectedOrgIds.size > 0 && (
                                    <span style={{ fontSize: '13px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
                                        ({selectedOrgIds.size} selected)
                                    </span>
                                )}
                            </h3>
                            {loadingOrgs ? (
                                <div className={styles.loading}>Loading organizations...</div>
                            ) : allOrganizations.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
                                    {allOrganizations.map(org => {
                                        const isSelected = selectedOrgIds.has(org.id);
                                        const wasAssigned = assignedOrgIds.has(org.id);
                                        const isBeingRemoved = wasAssigned && !isSelected;
                                        const isBeingAdded = !wasAssigned && isSelected;

                                        return (
                                            <div
                                                key={org.id}
                                                style={{
                                                    padding: '12px',
                                                    border: `2px solid ${isSelected ? '#3b82f6' : isBeingRemoved ? '#ef4444' : '#e5e7eb'}`,
                                                    borderRadius: '6px',
                                                    cursor: 'pointer',
                                                    backgroundColor: isSelected ? '#f0f7ff' : isBeingRemoved ? '#fef2f2' : '#fff',
                                                    transition: 'all 0.2s',
                                                }}
                                                onClick={() => handleOrgToggle(org.id)}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => handleOrgToggle(org.id)}
                                                        disabled={submitting}
                                                        style={{ cursor: 'pointer' }}
                                                    />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '500' }}>
                                                            {org.name}
                                                            {wasAssigned && (
                                                                <span style={{ fontSize: '11px', marginLeft: '6px', color: '#666' }}>
                                                                    (currently assigned)
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{ fontSize: '12px', color: '#666' }}>
                                                            {org.industry || 'General'}
                                                        </div>
                                                    </div>
                                                    {isBeingRemoved && (
                                                        <div style={{ fontSize: '11px', color: '#dc2626', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                            ✕ Removing
                                                        </div>
                                                    )}
                                                    {isBeingAdded && (
                                                        <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: '500', whiteSpace: 'nowrap' }}>
                                                            + Adding
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                    No organizations available
                                </div>
                            )}
                        </div>
                    )}

                    <div className={styles.formActions}>
                        <Button variant="secondary" type="button" onClick={() => navigate('/admin/facilitators')}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={submitting || isLoading}>
                            {isEditMode ? 'Update Facilitator' : 'Send Invitation'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppShell>
    );
};
