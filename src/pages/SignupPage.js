import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import styles from './LoginPage.module.css'; // Reusing base container/card styles
import signupStyles from './SignupPage.module.css';

export const SignupPage = () => {
    const navigate = useNavigate();
    const { signup, isLoading } = useAuthStore();
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
    const [successMessage, setSuccessMessage] = useState('');

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

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            const { confirmPassword, ...signupPayload } = formData;
            Object.keys(signupPayload).forEach(key => {
                if (!signupPayload[key]) delete signupPayload[key];
            });

            await signup(signupPayload);
            const state = useAuthStore.getState();
            
            if (state.roles.includes('super_admin') || state.user?.user_type === 'super_admin') {
                navigate('/admin');
            } else {
                setSuccessMessage('Registration successful! Your organization account is now pending approval.');
                const { logout } = useAuthStore.getState();
                await logout();
            }
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Signup failed. Please try again.');
        }
    };

    if (successMessage) {
        return (
            <div className={styles.container}>
                <div className={styles.gridBackground} />
                <div className={styles.card}>
                    <div className={styles.header}>
                        <div className={styles.brand}>Zylo</div>
                        <div className={styles.separator} />
                        <h1 className={styles.title}>Success</h1>
                    </div>
                    <div className={signupStyles.successBox}>
                        <Badge status="complete">Success</Badge>
                        <p className={signupStyles.successText}>{successMessage}</p>
                    </div>
                    <Button className={styles.submitButton} onClick={() => navigate('/login')}>
                        Go to Login
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.gridBackground} />
            <div className={`${styles.card} ${signupStyles.signupCard}`}>
                <div className={styles.header}>
                    <div className={styles.brand}>Zylo</div>
                    <div className={styles.separator} />
                    <h1 className={styles.title}>Create Account</h1>
                </div>

                {localError && (
                    <div className={styles.errorWrapper}>
                        <Badge status="suspended">{localError}</Badge>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={signupStyles.formSection}>
                        <label className={signupStyles.sectionLabel}>Organization Details</label>
                        <div className={signupStyles.grid}>
                            <Input
                                label="Organization Name *"
                                name="organization_name"
                                value={formData.organization_name}
                                onChange={handleChange}
                                placeholder="Acme Corp"
                                required
                                disabled={isLoading}
                            />
                            <Input
                                label="Email Address *"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="admin@acme.com"
                                required
                                disabled={isLoading}
                            />
                        </div>
                        <div className={signupStyles.grid}>
                            <Input
                                label="Industry"
                                name="company_industry"
                                value={formData.company_industry}
                                onChange={handleChange}
                                placeholder="e.g. Technology"
                                disabled={isLoading}
                            />
                            <Input
                                label="Headcount"
                                name="company_headcount"
                                value={formData.company_headcount}
                                onChange={handleChange}
                                placeholder="e.g. 50-100"
                                disabled={isLoading}
                            />
                        </div>
                        <div className={signupStyles.grid}>
                            <Input
                                label="Location"
                                name="headquarters_location"
                                value={formData.headquarters_location}
                                onChange={handleChange}
                                placeholder="City, Country"
                                disabled={isLoading}
                            />
                            <Input
                                label="Full Name"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                placeholder="John Doe"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className={signupStyles.formSection}>
                        <label className={signupStyles.sectionLabel}>Security</label>
                        <div className={signupStyles.grid}>
                            <Input
                                label="Password *"
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                            <Input
                                label="Confirm Password *"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <Button 
                        type="submit" 
                        loading={isLoading}
                        className={styles.submitButton}
                    >
                        Create Organization Account
                    </Button>
                </form>

                <p className={styles.footer}>
                    Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};
