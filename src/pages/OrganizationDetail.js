import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import styles from './OrganizationDetail.module.css';

export const OrganizationDetail = () => {
    const navigate = useNavigate();
    const { orgId } = useParams();
    const { user, roles } = useAuthStore();
    const {
        selectedOrganization,
        isLoading,
        error,
        fetchOrganization,
        updateOrganization,
        approveOrganization,
        rejectOrganization,
        suspendOrganization,
        activateOrganization,
        clearSelectedOrganization,
    } = useAdminStore();

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        if (orgId) fetchOrganization(orgId);
        return () => clearSelectedOrganization();
    }, [orgId, roles, user?.user_type, navigate, fetchOrganization, clearSelectedOrganization]);

    useEffect(() => {
        if (selectedOrganization) {
            setFormData({
                name: selectedOrganization.name || '',
                industry: selectedOrganization.industry || '',
                headcount: selectedOrganization.headcount || '',
                annual_revenue: selectedOrganization.annual_revenue || '',
                headquarters_location: selectedOrganization.headquarters_location || '',
                primary_contact_name: selectedOrganization.primary_contact_name || '',
                primary_contact_email: selectedOrganization.primary_contact_email || '',
                contact_phone: selectedOrganization.contact_phone || '',
            });
        }
    }, [selectedOrganization]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await updateOrganization(orgId, formData);
            setSuccess('Organization updated');
            setIsEditing(false);
            fetchOrganization(orgId);
        } catch (err) {
            setLocalError('Update failed');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAction = async (action) => {
        setSubmitting(true);
        try {
            if (action === 'approve') await approveOrganization(orgId);
            if (action === 'suspend') await suspendOrganization(orgId);
            if (action === 'activate') await activateOrganization(orgId);
            setSuccess(`Organization ${action}ed`);
            fetchOrganization(orgId);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        setSubmitting(true);
        try {
            await rejectOrganization(orgId, rejectionReason);
            setSuccess('Organization rejected');
            setShowRejectModal(false);
            fetchOrganization(orgId);
        } finally {
            setSubmitting(false);
        }
    };

    const breadcrumbs = (
        <div className={styles.breadcrumbs}>
            <Link to="/admin/organizations">Organizations</Link>
            <span>/</span>
            <span>{selectedOrganization?.name || 'Detail'}</span>
        </div>
    );

    return (
        <AppShell title={breadcrumbs}>
            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {selectedOrganization && (
                <div className={styles.container}>
                    <div className={styles.headerCard}>
                        <div className={styles.headerMain}>
                            <div className={styles.orgLogo}>
                                {selectedOrganization.logo_url ? <img src={selectedOrganization.logo_url} alt="" /> : selectedOrganization.name.charAt(0)}
                            </div>
                            <div className={styles.headerInfo}>
                                <h1 className={styles.orgName}>{selectedOrganization.name}</h1>
                                <div className={styles.orgMeta}>
                                    <Badge status={selectedOrganization.status}>{selectedOrganization.status}</Badge>
                                    <span>{selectedOrganization.industry || 'General'}</span>
                                </div>
                            </div>
                        </div>
                        <div className={styles.headerActions}>
                            {selectedOrganization.status === 'pending' && (
                                <>
                                    <Button onClick={() => handleAction('approve')} loading={submitting}>Approve</Button>
                                    <Button variant="danger" onClick={() => setShowRejectModal(true)}>Reject</Button>
                                </>
                            )}
                            {selectedOrganization.status === 'active' && (
                                <Button variant="danger" onClick={() => handleAction('suspend')}>Suspend</Button>
                            )}
                            {selectedOrganization.status === 'suspended' && (
                                <Button onClick={() => handleAction('activate')}>Activate</Button>
                            )}
                            <Button variant="secondary" onClick={() => setIsEditing(!isEditing)}>
                                {isEditing ? 'Cancel Edit' : 'Edit Organization'}
                            </Button>
                        </div>
                    </div>

                    <div className={styles.contentGrid}>
                        <div className={styles.mainCol}>
                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Profile Details</h3>
                                <form onSubmit={handleSubmit} className={styles.form}>
                                    <div className={styles.fieldGrid}>
                                        <Input
                                            label="Organization Name"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            disabled={!isEditing || submitting}
                                        />
                                        <Input
                                            label="Industry"
                                            name="industry"
                                            value={formData.industry}
                                            onChange={handleChange}
                                            disabled={!isEditing || submitting}
                                        />
                                        <Input
                                            label="Headcount"
                                            name="headcount"
                                            value={formData.headcount}
                                            onChange={handleChange}
                                            disabled={!isEditing || submitting}
                                        />
                                        <Input
                                            label="Annual Revenue"
                                            name="annual_revenue"
                                            value={formData.annual_revenue}
                                            onChange={handleChange}
                                            disabled={!isEditing || submitting}
                                        />
                                        <Input
                                            label="Headquarters"
                                            name="headquarters_location"
                                            value={formData.headquarters_location}
                                            onChange={handleChange}
                                            disabled={!isEditing || submitting}
                                        />
                                    </div>
                                    {isEditing && (
                                        <div className={styles.formFooter}>
                                            <Button type="submit" loading={submitting}>Save Changes</Button>
                                        </div>
                                    )}
                                </form>
                            </div>
                        </div>

                        <div className={styles.sideCol}>
                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Primary Contact</h3>
                                <div className={styles.contactInfo}>
                                    <div className={styles.contactItem}>
                                        <label>Name</label>
                                        <div>{selectedOrganization.primary_contact_name || '—'}</div>
                                    </div>
                                    <div className={styles.contactItem}>
                                        <label>Email</label>
                                        <div>{selectedOrganization.primary_contact_email || '—'}</div>
                                    </div>
                                    <div className={styles.contactItem}>
                                        <label>Phone</label>
                                        <div>{selectedOrganization.contact_phone || '—'}</div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Quick Links</h3>
                                <div className={styles.links}>
                                    <Link to={`/admin/organizations/${orgId}/members`} className={styles.linkItem}>
                                        Manage Members →
                                    </Link>
                                    <Link to={`/admin/organizations/${orgId}/sprints`} className={styles.linkItem}>
                                        View Sprints →
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <Modal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                title="Reject Organization"
            >
                <p>Please provide a reason for rejection.</p>
                <Input
                    type="textarea"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Reason..."
                />
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setShowRejectModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleReject} disabled={!rejectionReason.trim()} loading={submitting}>
                        Reject Organization
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
};
