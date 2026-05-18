import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { DataTable } from '../components/DataTable';
import styles from './NotificationsPage.module.css';

export const NotificationsPage = () => {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const {
        organizations,
        isLoading,
        error,
        fetchOrganizations,
        clearError,
    } = useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchOrganizations(1, 100);
    }, [roles, user?.user_type, navigate, fetchOrganizations]);

    const pendingOrganizations = organizations.filter(org => org.status === 'pending');

    const columns = [
        { 
            key: 'name', 
            label: 'Organization',
            render: (val) => <strong>{val}</strong>
        },
        { key: 'industry', label: 'Industry', render: (val) => val || '—' },
        { key: 'primary_contact_name', label: 'Contact', render: (val) => val || '—' },
        { 
            key: 'created_at', 
            label: 'Submitted', 
            render: (val) => val ? new Date(val).toLocaleDateString() : 'N/A' 
        },
        { 
            key: 'actions', 
            label: 'Action',
            render: (_, row) => (
                <Link to={`/admin/organizations/${row.id}`}>
                    <Button size="sm">Review & Approve</Button>
                </Link>
            )
        }
    ];

    return (
        <AppShell title="Notifications">
            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>×</button>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Pending Organization Approvals</h3>
                    {pendingOrganizations.length > 0 && (
                        <Badge status="pending">{pendingOrganizations.length} pending</Badge>
                    )}
                </div>

                {isLoading ? (
                    <div className={styles.loading}>Loading...</div>
                ) : pendingOrganizations.length > 0 ? (
                    <div className={styles.tableCard}>
                        <DataTable
                            columns={columns}
                            data={pendingOrganizations}
                            onRowClick={(row) => navigate(`/admin/organizations/${row.id}`)}
                        />
                    </div>
                ) : (
                    <div className={styles.empty}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                        </svg>
                        <p>No pending approvals at this time.</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
};
