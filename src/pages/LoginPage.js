import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Badge } from '../components/Badge';
import styles from './LoginPage.module.css';

export const LoginPage = () => {
    const navigate = useNavigate();
    const { login, isLoading } = useAuthStore();
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
            
            if (state.roles.includes('super_admin') || state.user?.user_type === 'super_admin') {
                navigate('/admin');
                return;
            }

            if (state.user?.organization_id) {
                const orgStatus = state.organization?.status;
                if (orgStatus === 'pending') {
                    setLocalError('Your organization registration is pending approval.');
                    return;
                } else if (orgStatus === 'rejected') {
                    setLocalError('Your organization registration was rejected.');
                    return;
                } else if (orgStatus === 'suspended') {
                    setLocalError('Your organization account has been suspended.');
                    return;
                }
            }

            navigate('/dashboard');
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Login failed. Please try again.');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.gridBackground} />
            <div className={styles.card}>
                <div className={styles.header}>
                    <div className={styles.brand}>Zylo</div>
                    <div className={styles.separator} />
                    <h1 className={styles.title}>Sign in</h1>
                </div>

                {localError && (
                    <div className={styles.errorWrapper}>
                        <Badge status="suspended">{localError}</Badge>
                    </div>
                )}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@company.com"
                        required
                        disabled={isLoading}
                    />
                    <Input
                        label="Password"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        required
                        disabled={isLoading}
                    />
                    <Button 
                        type="submit" 
                        loading={isLoading}
                        className={styles.submitButton}
                    >
                        Sign in
                    </Button>
                </form>

                <p className={styles.footer}>
                    Don't have an account? <Link to="/signup" className={styles.link}>Sign up</Link>
                </p>
            </div>
        </div>
    );
};
