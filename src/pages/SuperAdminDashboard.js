import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import styles from './SuperAdminDashboard.module.css';

export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const { 
        facilitators, 
        totalFacilitators, 
        organizations,
        totalOrganizations,
        isLoading, 
        error, 
        fetchFacilitators,
        fetchOrganizations
    } = useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchFacilitators();
        fetchOrganizations(1, 100);
    }, [roles, user?.user_type, navigate, fetchFacilitators, fetchOrganizations]);

    const pendingOrganizations = organizations.filter(org => org.status === 'pending');

    const facilitatorColumns = [
        { key: 'email', label: 'Email' },
        { key: 'full_name', label: 'Name', render: (val) => val || 'N/A' },
        { 
            key: 'status', 
            label: 'Status', 
            render: (val) => <Badge status={val}>{val}</Badge> 
        },
        { 
            key: 'actions', 
            label: 'Actions', 
            render: (_, row) => (
                <Link to={`/admin/facilitators/${row.id}`}>
                    <Button variant="ghost" size="sm">View</Button>
                </Link>
            )
        },
    ];

    return (
        <AppShell 
            title="Admin Console"
            actions={
                <Button onClick={() => navigate('/admin/facilitators/new')}>
                    + New Facilitator
                </Button>
            }
        >
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.statsRow}>
                <StatCard label="Total Facilitators" value={totalFacilitators} />
                <StatCard label="Organizations" value={totalOrganizations} />
                <StatCard 
                    label="Pending Approvals" 
                    value={pendingOrganizations.length} 
                    trend={pendingOrganizations.length > 0 ? 'up' : null}
                    trendValue={pendingOrganizations.length > 0 ? 'Requires Action' : null}
                />
                <StatCard label="Recent Signups" value={organizations.length} />
            </div>

            {pendingOrganizations.length > 0 && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>
                            Action Required <span className={styles.pulseDot} />
                        </h3>
                    </div>
                    <div className={styles.pendingList}>
                        {pendingOrganizations.map((org) => (
                            <div key={org.id} className={styles.pendingCard}>
                                <div className={styles.pendingInfo}>
                                    <div className={styles.orgName}>{org.name}</div>
                                    <div className={styles.orgMeta}>
                                        {org.industry || 'General'} • {org.primary_contact_email}
                                    </div>
                                </div>
                                <Button 
                                    size="sm" 
                                    onClick={() => navigate(`/admin/organizations/${org.id}`)}
                                >
                                    Review
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Recent Facilitators</h3>
                    <Link to="/admin/facilitators" className={styles.viewAll}>View all →</Link>
                </div>
                <div className={styles.tableCard}>
                    <DataTable 
                        columns={facilitatorColumns} 
                        data={facilitators.slice(0, 5)} 
                        loading={isLoading}
                    />
                </div>
            </div>
        </AppShell>
    );
};
