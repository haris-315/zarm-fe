import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import '../styles/Auth.css';

export const SignupPage = () => {
    const navigate = useNavigate();
    const { signup, isLoading, error } = useAuthStore();
    const [formData, setFormData] = useState({
        organization_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        company_industry: '',
        company_headcount: '',
        estimated_annual_revenue: '',
        headquarters_location: '',
        primary_contact_name: '',
        primary_contact_email: '',
        contact_phone: '',
        full_name: '',
    });
    const [localError, setLocalError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLocalError('');

        // Validation
        if (!formData.organization_name || !formData.email || !formData.password) {
            setLocalError('Organization name, email, and password are required');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        try {
            // Remove confirmPassword before sending
            const { confirmPassword, ...signupPayload } = formData;

            // Remove empty optional fields
            Object.keys(signupPayload).forEach(key => {
                if (!signupPayload[key]) {
                    delete signupPayload[key];
                }
            });

            await signup(signupPayload);
            const state = useAuthStore.getState();
            
            if (state.roles.includes('super_admin') || state.user?.user_type === 'super_admin') {
                navigate('/admin');
            } else {
                // For regular users, the organization is likely pending
                setSuccessMessage('Registration successful! Your organization account is now pending approval. You will be able to log in once it has been approved.');
                // Clear form
                setFormData({
                    organization_name: '',
                    email: '',
                    password: '',
                    confirmPassword: '',
                    company_industry: '',
                    company_headcount: '',
                    estimated_annual_revenue: '',
                    headquarters_location: '',
                    primary_contact_name: '',
                    primary_contact_email: '',
                    contact_phone: '',
                    full_name: '',
                });
                // Logout to clear tokens since they can't use them yet
                const { logout } = useAuthStore.getState();
                await logout();
            }
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Signup failed. Please try again.');
        }
    };

    const [successMessage, setSuccessMessage] = useState('');

    if (successMessage) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <h1>Zylo AI Platform</h1>
                    <div className="success-message" style={{ margin: '20px 0', padding: '15px' }}>
                        {successMessage}
                    </div>
                    <button onClick={() => navigate('/login')} className="btn-primary">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card signup-card">
                <h1>Zylo AI Platform</h1>
                <h2>Create Organization Account</h2>

                {error && <div className="error-message">{error}</div>}
                {localError && <div className="error-message">{localError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="organization_name">Organization Name *</label>
                            <input
                                id="organization_name"
                                type="text"
                                name="organization_name"
                                value={formData.organization_name}
                                onChange={handleChange}
                                placeholder="Enter organization name"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address *</label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="password">Password *</label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="Min 8 characters"
                                required
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password *</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="company_industry">Industry</label>
                            <input
                                id="company_industry"
                                type="text"
                                name="company_industry"
                                value={formData.company_industry}
                                onChange={handleChange}
                                placeholder="e.g., Technology, Finance"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="company_headcount">Headcount</label>
                            <input
                                id="company_headcount"
                                type="text"
                                name="company_headcount"
                                value={formData.company_headcount}
                                onChange={handleChange}
                                placeholder="e.g., 50-100"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="estimated_annual_revenue">Annual Revenue</label>
                            <input
                                id="estimated_annual_revenue"
                                type="text"
                                name="estimated_annual_revenue"
                                value={formData.estimated_annual_revenue}
                                onChange={handleChange}
                                placeholder="e.g., $1M - $5M"
                                disabled={isLoading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="headquarters_location">Headquarters Location</label>
                            <input
                                id="headquarters_location"
                                type="text"
                                name="headquarters_location"
                                value={formData.headquarters_location}
                                onChange={handleChange}
                                placeholder="City, Country"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="primary_contact_name">Contact Name</label>
                            <input
                                id="primary_contact_name"
                                type="text"
                                name="primary_contact_name"
                                value={formData.primary_contact_name}
                                onChange={handleChange}
                                placeholder="Primary contact name"
                                disabled={isLoading}
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
                                placeholder="Phone number"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in here</Link>
                </p>
            </div>
        </div>
    );
};
