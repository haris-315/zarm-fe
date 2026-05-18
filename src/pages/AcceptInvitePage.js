import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../api';
import { useAuthStore } from '../context/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import styles from './LoginPage.module.css'; // Reusing base container/card styles
import inviteStyles from './AcceptInvitePage.module.css';

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
        if (isAuthenticated) logout();
        if (!token) { navigate('/login', { replace: true }); return; }

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
    }, [token, isAuthenticated, logout, navigate]);

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
        <div className={styles.container}>
            <div className={styles.gridBackground} />
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.brand}>Zylo</div>
                    <div className={styles.separator} />
                    <h1 className={styles.title}>Join Workspace</h1>
                </div>

                {fetchingInfo ? (
                    <div className={inviteStyles.loading}>Loading invitation details...</div>
                ) : inviteInfo ? (
                    <div className={inviteStyles.inviteBox}>
                        <div className={inviteStyles.inviteAvatar}>
                            {inviteInfo.avatar_url ? <img src={inviteInfo.avatar_url} alt="" /> : inviteInfo.email.charAt(0).toUpperCase()}
                        </div>
                        <p className={inviteStyles.welcomeText}>
                            Hi <strong>{inviteInfo.email}</strong>, join <strong>{inviteInfo.organization_name || 'Zylo'}</strong> as a <strong>{getUserTypeDisplay(inviteInfo.user_type)}</strong>.
                        </p>
                    </div>
                ) : (
                    <p className={inviteStyles.fallbackText}>Please complete your profile to access your workspace.</p>
                )}

                {error && (
                    <div className={styles.errorWrapper}>
                        <Badge status="suspended">{error}</Badge>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Full Name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        placeholder="John Doe"
                    />
                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        placeholder="••••••••"
                        minLength={8}
                    />
                    <Input
                        label="Job Title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g. Senior Manager"
                        disabled={inviteInfo?.title !== null && inviteInfo?.title !== undefined}
                    />
                    {inviteInfo?.title !== null && inviteInfo?.title !== undefined && (
                        <p className={inviteStyles.hint}>Your title has been set by your administrator.</p>
                    )}

                    <Button type="submit" loading={loading} className={styles.submitButton}>
                        Complete Setup
                    </Button>
                </form>
            </div>
        </div>
    );
};
