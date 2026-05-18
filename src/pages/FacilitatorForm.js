import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
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

    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isEditMode) fetchFacilitator(facilitatorId);
        return () => clearSelectedFacilitator();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode, facilitatorId]);

    useEffect(() => {
        if (isEditMode && selectedFacilitator) {
            setFormData({
                email: selectedFacilitator.email,
                full_name: selectedFacilitator.full_name || '',
                title: selectedFacilitator.title || '',
                status: selectedFacilitator.status || 'active',
                password: '',
            });
        }
    }, [selectedFacilitator, isEditMode]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
                setSuccess('Facilitator updated successfully');
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
