import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorDetail.css';

export const OrganizationDetail = () => {
    const navigate = useNavigate();
    const { orgId } = useParams();
    const { user, logout, roles } = useAuthStore();
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
    
    // Modal state for rejection
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }

        if (orgId) {
            console.log('Fetching organization:', orgId);
            fetchOrganization(orgId);
        }

        return () => {
            clearSelectedOrganization();
        };
    }, [orgId]);

    useEffect(() => {
        if (selectedOrganization && isEditing) {
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
    }, [selectedOrganization, isEditing]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');
        setSuccess('');
        setSubmitting(true);

        try {
            if (!formData.name) {
                setLocalError('Organization name is required');
                setSubmitting(false);
                return;
            }

            await updateOrganization(orgId, formData);
            setSuccess('Organization updated successfully');
            setIsEditing(false);
            setTimeout(() => {
                fetchOrganization(orgId);
            }, 500);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to update organization');
        } finally {
            setSubmitting(false);
        }
    };

    const handleApprove = async () => {
        if (!window.confirm('Are you sure you want to approve this organization?')) return;
        setSubmitting(true);
        try {
            await approveOrganization(orgId);
            setSuccess('Organization approved successfully');
            fetchOrganization(orgId);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to approve organization');
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!rejectionReason.trim()) {
            setLocalError('Please provide a reason for rejection');
            return;
        }
        setSubmitting(true);
        try {
            await rejectOrganization(orgId, rejectionReason);
            setSuccess('Organization rejected');
            setShowRejectModal(false);
            setRejectionReason('');
            fetchOrganization(orgId);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to reject organization');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSuspend = async () => {
        if (!window.confirm('Are you sure you want to suspend this organization?')) return;
        setSubmitting(true);
        try {
            await suspendOrganization(orgId);
            setSuccess('Organization suspended');
            fetchOrganization(orgId);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to suspend organization');
        } finally {
            setSubmitting(false);
        }
    };

    const handleActivate = async () => {
        if (!window.confirm('Are you sure you want to activate this organization?')) return;
        setSubmitting(true);
        try {
            await activateOrganization(orgId);
            setSuccess('Organization activated');
            fetchOrganization(orgId);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to activate organization');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="super-admin-container">
            <header className="admin-header">
                <div className="header-content">
                    <div className="logo-section">
                        <h1>Zylo Admin</h1>
                        <span className="user-type">Super Administrator</span>
                    </div>
                    <div className="header-actions">
                        <span className="user-info">{user?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <main className="admin-main">
                <aside className="admin-sidebar">
                    <nav className="sidebar-nav">
                        <Link to="/admin" className="nav-link">
                            Dashboard
                        </Link>
                        <Link to="/admin/facilitators" className="nav-link">
                            Facilitators
                        </Link>
                        <Link to="/admin/organizations" className="nav-link active">
                            Organizations
                        </Link>
                        <Link to="/admin/notifications" className="nav-link">
                            Notifications
                        </Link>
                        <Link to="/admin/settings" className="nav-link">
                            Settings
                        </Link>
                    </nav>
                </aside>

                <section className="admin-content">
                    <div className="page-header">
                        <h2>Organization Details</h2>
                        <Link to="/admin/organizations" className="btn-secondary">
                            ← Back to List
                        </Link>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={() => useAdminStore.getState().clearError()} className="btn-close">×</button>
                        </div>
                    )}
                    {localError && (
                        <div className="error-message">
                            {localError}
                            <button onClick={() => setLocalError('')} className="btn-close">×</button>
                        </div>
                    )}
                    {success && (
                        <div className="success-message">
                            {success}
                            <button onClick={() => setSuccess('')} className="btn-close">×</button>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="loading">Loading organization details...</div>
                    ) : selectedOrganization ? (
                        <>
                            {!isEditing && (
                                <div className="detail-container">
                                    <div className="status-banner" style={{ 
                                        padding: '15px', 
                                        borderRadius: '8px', 
                                        marginBottom: '20px',
                                        backgroundColor: selectedOrganization.status === 'pending' ? '#fff9db' : 
                                                       selectedOrganization.status === 'active' ? '#ebfbee' : 
                                                       selectedOrganization.status === 'rejected' ? '#fff5f5' : '#f8f9fa',
                                        border: '1px solid',
                                        borderColor: selectedOrganization.status === 'pending' ? '#f08c00' : 
                                                     selectedOrganization.status === 'active' ? '#40c057' : 
                                                     selectedOrganization.status === 'rejected' ? '#fa5252' : '#dee2e6'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <strong>Status: </strong>
                                                <span className={`status-badge status-${selectedOrganization.status}`}>
                                                    {selectedOrganization.status?.toUpperCase() || ''}
                                                </span>
                                                {selectedOrganization.status === 'rejected' && selectedOrganization.rejection_reason && (
                                                    <p style={{ marginTop: '5px', fontSize: '0.9em' }}>
                                                        <strong>Reason: </strong> {selectedOrganization.rejection_reason}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="status-actions">
                                                {selectedOrganization.status === 'pending' && (
                                                    <>
                                                        <button onClick={handleApprove} className="btn-primary" disabled={submitting} style={{ marginRight: '10px' }}>
                                                            Approve Organization
                                                        </button>
                                                        <button onClick={() => setShowRejectModal(true)} className="btn-danger" disabled={submitting}>
                                                            Reject
                                                        </button>
                                                    </>
                                                )}
                                                {selectedOrganization.status === 'active' && (
                                                    <button onClick={handleSuspend} className="btn-danger" disabled={submitting}>
                                                        Suspend Organization
                                                    </button>
                                                )}
                                                {selectedOrganization.status === 'suspended' && (
                                                    <button onClick={handleActivate} className="btn-primary" disabled={submitting}>
                                                        Activate Organization
                                                    </button>
                                                )}
                                                {selectedOrganization.status === 'rejected' && (
                                                    <button onClick={handleApprove} className="btn-primary" disabled={submitting}>
                                                        Approve Anyway
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-card">
                                        <h3>Basic Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>ID</label>
                                                <p>{selectedOrganization.id}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Name</label>
                                                <p>{selectedOrganization.name}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Slug</label>
                                                <p>{selectedOrganization.slug}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Industry</label>
                                                <p>{selectedOrganization.industry || '—'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Headcount</label>
                                                <p>{selectedOrganization.headcount || '—'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Annual Revenue</label>
                                                <p>{selectedOrganization.annual_revenue || '—'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Headquarters Location</label>
                                                <p>
                                                    {selectedOrganization.headquarters_location || '—'}
                                                </p>
                                            </div>
                                            <div className="detail-item" style={{ gridColumn: '1 / -1' }}>
                                                <label>Organization Logo</label>
                                                <div className="logo-upload-container" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '15px', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', marginTop: '10px' }}>
                                                    <div className="org-logo-preview" style={{ margin: 0 }}>
                                                        {selectedOrganization.logo_url ? (
                                                            <img src={selectedOrganization.logo_url} alt="Logo" />
                                                        ) : (
                                                            <span style={{ color: '#94a3b8', fontSize: '12px' }}>No Logo</span>
                                                        )}
                                                    </div>
                                                    <div className="logo-actions">
                                                        <label className="avatar-upload-btn">
                                                            {submitting ? 'Uploading...' : 'Update Logo'}
                                                            <input 
                                                                type="file" 
                                                                accept="image/*" 
                                                                onChange={async (e) => {
                                                                    const file = e.target.files[0];
                                                                    if (file) {
                                                                        setSubmitting(true);
                                                                        try {
                                                                            await useAdminStore.getState().updateOrgLogoBySuperAdmin(orgId, file);
                                                                            setSuccess('Logo updated successfully');
                                                                        } catch (err) {
                                                                            setLocalError('Failed to upload logo');
                                                                        } finally {
                                                                            setSubmitting(false);
                                                                        }
                                                                    }
                                                                }}
                                                                disabled={submitting}
                                                            />
                                                        </label>
                                                        <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
                                                            JPG, PNG or GIF. Max size 2MB.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-card">
                                        <h3>Contact Information</h3>
                                        <div className="detail-grid">
                                            <div className="detail-item">
                                                <label>Primary Contact Name</label>
                                                <p>{selectedOrganization.primary_contact_name || '—'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Primary Contact Email</label>
                                                <p>{selectedOrganization.primary_contact_email || '—'}</p>
                                            </div>
                                            <div className="detail-item">
                                                <label>Contact Phone</label>
                                                <p>{selectedOrganization.contact_phone || '—'}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="detail-actions">
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="btn-primary"
                                        >
                                            Edit Organization
                                        </button>
                                        <Link
                                            to={`/admin/organizations/${orgId}/members`}
                                            className="btn-secondary"
                                        >
                                            Manage Members
                                        </Link>
                                    </div>
                                </div>
                            )}

                            {isEditing && (
                                <div className="form-container" style={{ maxWidth: '800px' }}>
                                    <form onSubmit={handleSubmit} className="facilitator-form">
                                        <div className="form-section">
                                            <h3>Basic Information</h3>

                                            <div className="form-group">
                                                <label htmlFor="name">Organization Name *</label>
                                                <input
                                                    id="name"
                                                    type="text"
                                                    name="name"
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    placeholder="Organization name"
                                                    required
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="industry">Industry</label>
                                                <input
                                                    id="industry"
                                                    type="text"
                                                    name="industry"
                                                    value={formData.industry}
                                                    onChange={handleChange}
                                                    placeholder="e.g., Technology"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="headcount">Headcount</label>
                                                <input
                                                    id="headcount"
                                                    type="text"
                                                    name="headcount"
                                                    value={formData.headcount}
                                                    onChange={handleChange}
                                                    placeholder="e.g., 100-500"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="annual_revenue">Annual Revenue</label>
                                                <input
                                                    id="annual_revenue"
                                                    type="text"
                                                    name="annual_revenue"
                                                    value={formData.annual_revenue}
                                                    onChange={handleChange}
                                                    placeholder="e.g., $1M-$5M"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="headquarters_location">
                                                    Headquarters Location
                                                </label>
                                                <input
                                                    id="headquarters_location"
                                                    type="text"
                                                    name="headquarters_location"
                                                    value={formData.headquarters_location}
                                                    onChange={handleChange}
                                                    placeholder="e.g., San Francisco, CA"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-section">
                                            <h3>Contact Information</h3>

                                            <div className="form-group">
                                                <label htmlFor="primary_contact_name">
                                                    Primary Contact Name
                                                </label>
                                                <input
                                                    id="primary_contact_name"
                                                    type="text"
                                                    name="primary_contact_name"
                                                    value={formData.primary_contact_name}
                                                    onChange={handleChange}
                                                    placeholder="Full name"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="primary_contact_email">
                                                    Primary Contact Email
                                                </label>
                                                <input
                                                    id="primary_contact_email"
                                                    type="email"
                                                    name="primary_contact_email"
                                                    value={formData.primary_contact_email}
                                                    onChange={handleChange}
                                                    placeholder="email@example.com"
                                                    disabled={submitting}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label htmlFor="contact_phone">Contact Phone</label>
                                                <input
                                                    id="contact_phone"
                                                    type="tel"
                                                    name="contact_phone"
                                                    value={formData.contact_phone}
                                                    onChange={handleChange}
                                                    placeholder="+1-XXX-XXX-XXXX"
                                                    disabled={submitting}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                type="submit"
                                                className="btn-primary"
                                                disabled={submitting || isLoading}
                                            >
                                                {submitting || isLoading
                                                    ? 'Saving...'
                                                    : 'Update Organization'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsEditing(false)}
                                                className="btn-secondary"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="no-data">Organization not found</div>
                    )}
                </section>
            </main>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="modal-content" style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        width: '100%',
                        maxWidth: '500px'
                    }}>
                        <h3>Reject Organization?</h3>
                        <p>Please provide a reason for rejecting this organization. This will be shown to the user.</p>
                        <textarea
                            style={{ 
                                width: '100%', 
                                minHeight: '120px', 
                                margin: '20px 0', 
                                padding: '12px',
                                borderRadius: '4px',
                                border: '1px solid #dee2e6'
                            }}
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Type rejection reason here..."
                        />
                        <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectionReason('');
                                }}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                disabled={!rejectionReason.trim() || submitting}
                                className="btn-danger"
                            >
                                {submitting ? 'Rejecting...' : 'Confirm Rejection'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
