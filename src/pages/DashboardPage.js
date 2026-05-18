import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sprintAPI } from '../api/sprints';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { Skeleton } from '../components/Skeleton';
import styles from './DashboardPage.module.css';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, roles, organization, updateAvatar } = useAuthStore();
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (roles.includes('super_admin') || user?.user_type === 'super_admin') {
            navigate('/admin', { replace: true });
            return;
        }

        if (user?.user_type === 'facilitator' || roles.includes('facilitator')) {
            navigate('/facilitator/organizations', { replace: true });
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                if (organization?.id) {
                    const sprintsData = await sprintAPI.listSprints(organization.id);
                    setSprints(sprintsData.items || []);
                }
            } catch (err) {
                setError('Failed to load sprints');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [roles, navigate, user?.user_type, organization?.id]);

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                await updateAvatar(file);
            } catch (err) {
                console.error('Failed to upload avatar:', err);
            }
        }
    };

    const handleOrgLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            try {
                const { useAdminStore } = await import('../context/adminStore');
                await useAdminStore.getState().updateOrgLogo(file);
            } catch (err) {
                console.error('Failed to upload logo:', err);
            }
        }
    };

    return (
        <AppShell title="Dashboard">
            {organization?.status === 'suspended' && (
                <div className={`${styles.banner} ${styles.dangerBanner}`}>
                    <div className={styles.bannerContent}>
                        <span className={styles.dot} />
                        <strong>Account Suspended:</strong> Your organization account is currently suspended. Please contact support.
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = 'mailto:support@zylo.ai'}>Contact Support</Button>
                </div>
            )}

            <div className={styles.welcomeStrip}>
                <div className={styles.welcomeLeft}>
                    <div className={styles.avatarLarge}>
                        {user?.avatar_url ? (
                            <img src={user.avatar_url} alt="Profile" />
                        ) : (
                            user?.full_name?.charAt(0) || user?.email?.charAt(0)
                        )}
                    </div>
                    <div className={styles.welcomeText}>
                        <h2 className={styles.userName}>Welcome, {user?.full_name || user?.email}</h2>
                        <div className={styles.userOrg}>{organization?.name}</div>
                    </div>
                </div>
                <div className={styles.welcomeRight}>
                    <label className={styles.uploadBtn}>
                        <Button variant="ghost" size="sm" as="span">Upload Photo</Button>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                    </label>
                    <Badge status={organization?.status}>{organization?.status}</Badge>
                </div>
            </div>

            {organization && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Your Organization</h3>
                        {(user?.user_type === 'organization' || roles.includes('org_admin')) && (
                            <label className={styles.uploadBtn}>
                                <Button variant="ghost" size="sm" as="span">Upload Logo</Button>
                                <input type="file" accept="image/*" onChange={handleOrgLogoUpload} hidden />
                            </label>
                        )}
                    </div>
                    <div className={styles.orgCard}>
                        <div className={styles.orgInfoGrid}>
                            <div className={styles.infoField}>
                                <div className={styles.infoLabel}>Status</div>
                                <div className={styles.infoValue}>
                                    <Badge status={organization.status}>{organization.status}</Badge>
                                </div>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.infoField}>
                                <div className={styles.infoLabel}>Industry</div>
                                <div className={styles.infoValue}>{organization.industry || 'N/A'}</div>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.infoField}>
                                <div className={styles.infoLabel}>Headcount</div>
                                <div className={styles.infoValue}>{organization.headcount || 'N/A'}</div>
                            </div>
                            <div className={styles.divider} />
                            <div className={styles.infoField}>
                                <div className={styles.infoLabel}>Location</div>
                                <div className={styles.infoValue}>{organization.headquarters_location || 'N/A'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className={styles.statsRow}>
                <StatCard label="Active Sprints" value={sprints.filter(s => s.status === 'in_progress').length} />
                <StatCard label="Total Findings" value="124" trend="up" trendValue="+12%" />
                <StatCard label="Completed Days" value="18" />
                <StatCard label="AI Readiness Score" value="78" />
            </div>

            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        Sprints <span className={styles.countBadge}>{sprints.length}</span>
                    </h3>
                </div>
                
                {loading ? (
                    <div className={styles.sprintList}>
                        <Skeleton height="80px" />
                        <Skeleton height="80px" />
                    </div>
                ) : sprints.length > 0 ? (
                    <div className={styles.sprintList}>
                        {sprints.map((sprint) => (
                            <div key={sprint.id} className={styles.sprintCard} onClick={() => navigate(`/sprints/${sprint.id}`)}>
                                <div className={styles.sprintMain}>
                                    <h4 className={styles.sprintTitle}>{sprint.name || 'Untitled Sprint'}</h4>
                                    <p className={styles.sprintSubtitle}>{sprint.engagement_name || 'Strategic Assessment'}</p>
                                </div>
                                <div className={styles.sprintMeta}>
                                    <Badge status={sprint.status}>{sprint.status}</Badge>
                                    <div className={styles.sprintDates}>
                                        {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'} → 
                                        {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className={styles.sprintChevron}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" strokeDasharray="4 4"></circle><path d="M12 8v8"></path><path d="M8 12h8"></path></svg>
                        </div>
                        <h4 className={styles.emptyTitle}>No sprints assigned yet</h4>
                        <p className={styles.emptyText}>When you are added to a sprint, it will appear here.</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
};
