import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import '../styles/Auth.css';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isLoading, error } = useAuthStore();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
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

        if (!formData.email || !formData.password) {
            setLocalError('Please fill in all fields');
            return;
        }

        try {
            await login(formData.email, formData.password);
            const state = useAuthStore.getState();
            
            // Super admins can always log in
            if (state.roles.includes('super_admin') || state.user?.user_type === 'super_admin') {
                navigate('/admin');
                return;
            }

            // Check organization status for other users
            // If they don't have an organization_id, they might be an independent user or super_admin (handled above)
            if (state.user?.organization_id) {
                const orgStatus = state.organization?.status;
                
                if (orgStatus === 'pending') {
                    setLocalError('Your organization registration is pending approval. Please check back later.');
                    return;
                } else if (orgStatus === 'rejected') {
                    const reason = state.organization?.rejection_reason;
                    setLocalError(`Your organization registration was rejected. ${reason ? `Reason: ${reason}` : ''}`);
                    return;
                } else if (orgStatus === 'suspended') {
                    setLocalError('Your organization account has been suspended. Please contact support.');
                    return;
                }
            }

            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Login failed. Please try again.');
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <h1>Zylo AI Platform</h1>
                <h2>Sign In</h2>

                {error && <div className="error-message">{error}</div>}
                {localError && <div className="error-message">{localError}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="Enter your email"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <p className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up here</Link>
                </p>
            </div>
        </div>
    );
};
