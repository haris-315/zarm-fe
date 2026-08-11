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
    const { personalSignup, submitOrganizationInfo, login, logout, isLoading } = useAuthStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        linkedin_url: '',
        password: '',
        confirmPassword: '',
        organization_name: '',
        company_website: '',
        company_industry: '',
        company_headcount: '',
        estimated_annual_revenue: '',
        headquarters_location: '',
        primary_contact_name: '',
        primary_contact_email: '',
        contact_phone: '',
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

    const handleStep1Submit = async (e) => {
        e.preventDefault();
        setLocalError('');

        if (formData.password !== formData.confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        try {
            const signupPayload = {
                full_name: formData.full_name,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number || undefined,
                linkedin_url: formData.linkedin_url || undefined,
            };

            await personalSignup(signupPayload);
            
            // Programmatically login to obtain access token for step 2
            await login(formData.email, formData.password);
            
            // Proceed to Step 2
            setStep(2);
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Personal signup failed. Please try again.');
        }
    };

    const handleStep2Submit = async (e) => {
        e.preventDefault();
        setLocalError('');

        try {
            const orgPayload = {
                company_name: formData.organization_name,
                company_website: formData.company_website,
                phone_number: formData.contact_phone || formData.phone_number || 'N/A',
                company_industry: formData.company_industry || undefined,
                company_size: formData.company_headcount || undefined,
                yearly_revenue: formData.estimated_annual_revenue || undefined,
                contact_email: formData.primary_contact_email || formData.email || undefined,
                company_headcount: formData.company_headcount || undefined,
                estimated_annual_revenue: formData.estimated_annual_revenue || undefined,
                headquarters_location: formData.headquarters_location || undefined,
                primary_contact_name: formData.primary_contact_name || formData.full_name || undefined,
                primary_contact_email: formData.primary_contact_email || formData.email || undefined,
                contact_phone: formData.contact_phone || formData.phone_number || undefined,
            };

            await submitOrganizationInfo(orgPayload);
            
            setSuccessMessage('Registration successful! Your application has been submitted for cohort approval.');
            await logout();
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Organization submission failed. Please try again.');
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

                <div className={signupStyles.stepIndicator}>
                    <span className={step === 1 ? signupStyles.activeStep : signupStyles.inactiveStep}>
                        Step 1: Personal Details
                    </span>
                    <span className={signupStyles.stepSeparator}>&rarr;</span>
                    <span className={step === 2 ? signupStyles.activeStep : signupStyles.inactiveStep}>
                        Step 2: Organization details
                    </span>
                </div>

                {localError && (
                    <div className={styles.errorWrapper}>
                        <Badge status="suspended">{localError}</Badge>
                    </div>
                )}

                {step === 1 ? (
                    <form onSubmit={handleStep1Submit} className={styles.form}>
                        <div className={signupStyles.formSection}>
                            <label className={signupStyles.sectionLabel}>Personal Information</label>
                            <div className={signupStyles.grid}>
                                <Input
                                    label="Full Name *"
                                    name="full_name"
                                    value={formData.full_name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    required
                                    disabled={isLoading}
                                />
                                <Input
                                    label="Email Address *"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="john.doe@company.com"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                            <div className={signupStyles.grid}>
                                <Input
                                    label="Phone Number"
                                    name="phone_number"
                                    value={formData.phone_number}
                                    onChange={handleChange}
                                    placeholder="+1 555-0199"
                                    disabled={isLoading}
                                />
                                <Input
                                    label="LinkedIn Profile URL"
                                    name="linkedin_url"
                                    value={formData.linkedin_url}
                                    onChange={handleChange}
                                    placeholder="https://linkedin.com/in/username"
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
                            Next: Organization details
                        </Button>
                    </form>
                ) : (
                    <form onSubmit={handleStep2Submit} className={styles.form}>
                        <div className={signupStyles.formSection}>
                            <label className={signupStyles.sectionLabel}>Organization Information</label>
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
                                    label="Organization Website *"
                                    name="company_website"
                                    value={formData.company_website}
                                    onChange={handleChange}
                                    placeholder="https://acme.com"
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
                                    label="Headquarters Location"
                                    name="headquarters_location"
                                    value={formData.headquarters_location}
                                    onChange={handleChange}
                                    placeholder="City, Country"
                                    disabled={isLoading}
                                />
                                <Input
                                    label="Estimated Annual Revenue"
                                    name="estimated_annual_revenue"
                                    value={formData.estimated_annual_revenue}
                                    onChange={handleChange}
                                    placeholder="e.g. $1M - $5M"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className={signupStyles.formSection}>
                            <label className={signupStyles.sectionLabel}>Primary Contact Information</label>
                            <div className={signupStyles.grid}>
                                <Input
                                    label="Primary Contact Name"
                                    name="primary_contact_name"
                                    value={formData.primary_contact_name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    disabled={isLoading}
                                />
                                <Input
                                    label="Primary Contact Email"
                                    name="primary_contact_email"
                                    type="email"
                                    value={formData.primary_contact_email}
                                    onChange={handleChange}
                                    placeholder="john.doe@company.com"
                                    disabled={isLoading}
                                />
                            </div>
                            <div className={signupStyles.grid}>
                                <Input
                                    label="Contact Phone"
                                    name="contact_phone"
                                    value={formData.contact_phone}
                                    onChange={handleChange}
                                    placeholder="+1 555-0199"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            loading={isLoading}
                            className={styles.submitButton}
                        >
                            Complete Registration
                        </Button>
                    </form>
                )}

                <p className={styles.footer}>
                    Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
                </p>
            </div>
        </div>
    );
};
