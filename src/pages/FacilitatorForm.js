import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import '../styles/FacilitatorForm.css';

export const FacilitatorForm = () => {
    const navigate = useNavigate();
    const { facilitatorId } = useParams();
    const { user, logout, roles } = useAuthStore();
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
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }

        if (isEditMode) {
            console.log('Fetching facilitator for edit:', facilitatorId);
            fetchFacilitator(facilitatorId);
        }

        return () => {
            clearSelectedFacilitator();
        };
    }, [isEditMode, facilitatorId]);

    useEffect(() => {
        if (isEditMode && selectedFacilitator) {
            setFormData({
                email: selectedFacilitator.email,
                full_name: selectedFacilitator.full_name || '',
                title: selectedFacilitator.title || '',
                status: selectedFacilitator.status || 'active',
                password: '', // Don't pre-fill password
            });
        }
    }, [selectedFacilitator, isEditMode]);

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
            // Validation
            if (!formData.email) {
                setLocalError('Email is required');
                setSubmitting(false);
                return;
            }

            if (!isEditMode && !formData.title) {
                setLocalError('Title is required for new facilitators');
                setSubmitting(false);
                return;
            }

            if (isEditMode) {
                // For update, only send fields that are not empty
                const updatePayload = {
                    email: formData.email || undefined,
                    full_name: formData.full_name || undefined,
                    title: formData.title || undefined,
                    status: formData.status || undefined,
                };

                // Remove undefined fields
                Object.keys(updatePayload).forEach(
                    (key) => updatePayload[key] === undefined && delete updatePayload[key]
                );

                await updateFacilitator(facilitatorId, updatePayload);
                setSuccess('Facilitator updated successfully');
                setTimeout(() => navigate('/admin/facilitators'), 1500);
            } else {
                // For create, prepare payload
                const createPayload = {
                    email: formData.email,
                    title: formData.title,
                };

                if (formData.full_name) {
                    createPayload.full_name = formData.full_name;
                }

                await createFacilitator(createPayload);
                setSuccess('Invitation sent successfully');
                setTimeout(() => navigate('/admin/facilitators'), 1500);
            }
        } catch (err) {
            setLocalError(
                err.response?.data?.detail || 'Failed to save facilitator'
            );
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
                        <Link to="/admin/facilitators" className="nav-link active">
                            Facilitators
                        </Link>
                        <Link to="/admin/organizations" className="nav-link">
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
                    <div className="form-header">
                        <h2>{isEditMode ? 'Edit Facilitator' : 'Invite New Facilitator'}</h2>
                        <Link to="/admin/facilitators" className="btn-secondary">
                            ← Back to List
                        </Link>
                    </div>

                    {error && (
                        <div className="error-message">
                            {error}
                            <button onClick={clearError} className="btn-close">
                                ×
                            </button>
                        </div>
                    )}

                    {localError && (
                        <div className="error-message">
                            {localError}
                            <button
                                onClick={() => setLocalError('')}
                                className="btn-close"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {success && <div className="success-message">{success}</div>}

                    <form onSubmit={handleSubmit} className="facilitator-form">
                        <div className="form-section">
                            <h3>Facilitator Information</h3>

                            <div className="form-group">
                                <label htmlFor="email">Email Address *</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="facilitator@example.com"
                                    required
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="full_name">Full Name</label>
                                <input
                                    id="full_name"
                                    type="text"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    disabled={submitting}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="title">Title *</label>
                                <input
                                    id="title"
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    placeholder="Senior Facilitator"
                                    required={!isEditMode}
                                    disabled={submitting}
                                />
                            </div>



                            {isEditMode && (
                                <div className="form-group">
                                    <label htmlFor="status">Status</label>
                                    <select
                                        id="status"
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        disabled={submitting}
                                    >
                                        <option value="active">Active</option>
                                        <option value="disabled">Disabled</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="form-actions">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting || isLoading}
                            >
                                {submitting || isLoading
                                    ? 'Sending...'
                                    : isEditMode
                                        ? 'Update Facilitator'
                                        : 'Send Invitation'}
                            </button>
                            <Link to="/admin/facilitators" className="btn-secondary">
                                Cancel
                            </Link>
                        </div>
                    </form>
                </section>
            </main>
        </div>
    );
};
