import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore } from '../context/authStore';
import '../styles/Auth.css';

export const AcceptInvitePage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { acceptInvite, isAuthenticated, logout, error, clearError } = useAuthStore();
    const [loading, setLoading] = useState(false);

    const token = searchParams.get('token');

    const [inviteInfo, setInviteInfo] = useState(null);
    const [fetchingInfo, setFetchingInfo] = useState(true);

    const [formData, setFormData] = useState({
        full_name: '',
        password: '',
        title: ''
    });

    useEffect(() => {
        if (isAuthenticated) {
            logout();
        }

        if (!token) {
            navigate('/login', { replace: true });
            return;
        }

        const fetchInfo = async () => {
            try {
                setFetchingInfo(true);
                const info = await authAPI.getInviteInfo(token);
                setInviteInfo(info);
                setFormData(prev => ({
                    ...prev,
                    full_name: info.full_name || '',
                    title: info.title || ''
                }));
            } catch (err) {
                console.error('Failed to fetch invite info:', err);
            } finally {
                setFetchingInfo(false);
            }
        };

        fetchInfo();
    }, [isAuthenticated, token, navigate, logout]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) clearError();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await acceptInvite({
                token,
                password: formData.password,
                full_name: formData.full_name,
                title: formData.title || null
            });
            navigate('/dashboard');
        } catch (err) {
            console.error('Failed to accept invite:', err);
        } finally {
            setLoading(false);
        }
    };

    const getUserTypeDisplay = (userType) => {
        const labels = {
            facilitator: 'facilitator',
            super_admin: 'super admin',
            organization: 'organization admin',
            member: 'team member'
        };
        return labels[userType] || userType;
    };

    if (!token) return null;

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h2>Complete Your Profile</h2>
                    {fetchingInfo ? (
                        <p>Loading invitation details...</p>
                    ) : inviteInfo ? (
                        <div className="invitee-welcome">
                            {inviteInfo.avatar_url && (
                                <div className="invitee-avatar">
                                    <img src={inviteInfo.avatar_url} alt="Profile" />
                                </div>
                            )}
                            <p>
                                Hi <strong>{inviteInfo.email}</strong>, join <strong>{inviteInfo.organization_name || 'Zylo Platform'}</strong> as a <strong>{getUserTypeDisplay(inviteInfo.user_type)}</strong>!
                            </p>
                        </div>
                    ) : (
                        <p>Welcome! Please complete your profile to access your workspace.</p>
                    )}
                </div>

                {error && <div className="error-message">{error}</div>}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="full_name">Full Name *</label>
                        <input
                            type="text"
                            id="full_name"
                            name="full_name"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password *</label>
                        <input
                            type="password"
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            placeholder="Min 8 characters"
                            minLength={8}
                        />
                    </div>

                    {(!inviteInfo || inviteInfo.title === null) && (
                        <div className="form-group">
                            <label htmlFor="title">Job Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                placeholder="Manager, Developer, etc."
                                disabled={loading}
                            />
                        </div>
                    )}

                    {inviteInfo && inviteInfo.title !== null && (
                        <div className="form-group">
                            <label htmlFor="title">Job Title</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={inviteInfo.title}
                                readOnly
                                className="readonly-input"
                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                            />
                            <small>Your title has been set by your administrator.</small>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="btn-primary auth-submit"
                        disabled={loading}
                    >
                        {loading ? 'Completing Setup...' : 'Complete Setup'}
                    </button>
                </form>
            </div>
        </div>
    );
};
