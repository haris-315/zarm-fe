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

    const isOrgAdmin = roles.includes('org_admin') || roles.includes('manager');

    useEffect(() => {
        // super_admin → admin panel
        if (roles.includes('super_admin') || user?.user_type === 'super_admin' || user?.role?.name === 'super_admin') {
            navigate('/admin', { replace: true });
            return;
        }

        // pure facilitators (no org role) → facilitator panel
        const isFacilitator =
            (user?.user_type === 'facilitator' || roles.includes('facilitator')) &&
            !roles.includes('org_admin') &&
            !roles.includes('manager') &&
            !roles.includes('member');

        if (isFacilitator) {
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

    const handleSprintClick = (sprint) => {
        // Route org users through the org sprint path
        navigate(`/org/sprints/${sprint.id}`);
    };

    const activeSprints = sprints.filter((s) => s.status === 'in_progress');
    const completedSprints = sprints.filter((s) => s.status === 'complete' || s.status === 'completed');

    return (
        <AppShell title="Dashboard">
            {organization?.status === 'suspended' && (
                <div className={`${styles.banner} ${styles.dangerBanner}`}>
                    <div className={styles.bannerContent}>
                        <span className={styles.dot} />
                        <strong>Account Suspended:</strong> Your organization account is currently suspended. Please contact support.
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => window.location.href = 'mailto:support@zylo.ai'}>
                        Contact Support
                    </Button>
                </div>
            )}

            {/* Welcome strip */}
            <div className={styles.welcomeStrip}>
                <div className={styles.welcomeLeft}>
                    <label className={styles.avatarWrapper} title="Click to update photo">
                        <div className={styles.avatarLarge}>
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" />
                            ) : (
                                user?.full_name?.charAt(0) || user?.email?.charAt(0)
                            )}
                        </div>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
                        <div className={styles.avatarOverlay}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                        </div>
                    </label>
                    <div className={styles.welcomeText}>
                        <h2 className={styles.userName}>
                            Welcome back, {user?.full_name || user?.email}
                        </h2>
                        <div className={styles.userMeta}>
                            {organization?.name && (
                                <span className={styles.orgChip}>{organization.name}</span>
                            )}
                            {roles.length > 0 && (
                                <span className={styles.roleChip}>{roles[0]?.replace('_', ' ')}</span>
                            )}
                        </div>
                    </div>
                </div>
                <div className={styles.welcomeRight}>
                    {isOrgAdmin && (
                        <Button variant="secondary" size="sm" onClick={() => navigate('/org/members')}>
                            Manage Team
                        </Button>
                    )}
                    <Badge status={organization?.status}>{organization?.status || 'active'}</Badge>
                </div>
            </div>

            {/* Organization info card */}
            {organization && (
                <div className={styles.section}>
                    <div className={styles.sectionHeader}>
                        <h3 className={styles.sectionTitle}>Your Organization</h3>
                        {isOrgAdmin && (
                            <label className={styles.uploadBtn}>
                                <Button variant="ghost" size="sm" as="span">Upload Logo</Button>
                                <input type="file" accept="image/*" onChange={handleOrgLogoUpload} hidden />
                            </label>
                        )}
                    </div>
                    <div className={styles.orgCard}>
                        <div className={styles.orgCardTop}>
                            <div className={styles.orgLogo}>
                                {organization.logo_url ? (
                                    <img src={organization.logo_url} alt={organization.name} />
                                ) : (
                                    <span>{organization.name?.charAt(0)}</span>
                                )}
                            </div>
                            <div className={styles.orgInfo}>
                                <div className={styles.orgName}>{organization.name}</div>
                                {organization.description && (
                                    <div className={styles.orgDescription}>{organization.description}</div>
                                )}
                            </div>
                            <Badge status={organization.status}>{organization.status}</Badge>
                        </div>
                        <div className={styles.orgInfoGrid}>
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
                            <div className={styles.divider} />
                            <div className={styles.infoField}>
                                <div className={styles.infoLabel}>Your Role</div>
                                <div className={styles.infoValue} style={{ textTransform: 'capitalize' }}>
                                    {user?.org_role || roles.find((r) => ['org_admin', 'manager', 'member'].includes(r))?.replace('_', ' ') || 'Member'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Personal Info */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Your Profile</h3>
                </div>
                <div className={styles.profileCard}>
                    <div className={styles.profileField}>
                        <span className={styles.infoLabel}>Full Name</span>
                        <span className={styles.infoValue}>{user?.full_name || '—'}</span>
                    </div>
                    <div className={styles.divider} style={{ width: '100%', height: '1px' }} />
                    <div className={styles.profileField}>
                        <span className={styles.infoLabel}>Email</span>
                        <span className={styles.infoValue}>{user?.email || '—'}</span>
                    </div>
                    <div className={styles.divider} style={{ width: '100%', height: '1px' }} />
                    <div className={styles.profileField}>
                        <span className={styles.infoLabel}>Roles</span>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {roles.length > 0
                                ? roles.map((r) => (
                                    <Badge key={r} status="planning" style={{ textTransform: 'capitalize' }}>
                                        {r.replace('_', ' ')}
                                    </Badge>
                                ))
                                : <span className={styles.infoValue}>—</span>
                            }
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.statsRow}>
                <StatCard label="Active Sprints" value={activeSprints.length} />
                <StatCard label="Completed Sprints" value={completedSprints.length} />
                <StatCard label="Total Sprints" value={sprints.length} />
                <StatCard label="AI Readiness Score" value="—" />
            </div>

            {/* Sprints */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                        Sprints{' '}
                        <span className={styles.countBadge}>{sprints.length}</span>
                    </h3>
                </div>

                {error && (
                    <div className={styles.inlineError}>{error}</div>
                )}

                {loading ? (
                    <div className={styles.sprintList}>
                        <Skeleton height="80px" />
                        <Skeleton height="80px" />
                    </div>
                ) : sprints.length > 0 ? (
                    <div className={styles.sprintList}>
                        {sprints.map((sprint) => (
                            <div
                                key={sprint.id}
                                className={styles.sprintCard}
                                onClick={() => handleSprintClick(sprint)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => e.key === 'Enter' && handleSprintClick(sprint)}
                            >
                                <div className={styles.sprintMain}>
                                    <h4 className={styles.sprintTitle}>{sprint.title || 'Untitled Sprint'}</h4>
                                    <p className={styles.sprintSubtitle}>{sprint.description || 'Strategic Assessment'}</p>
                                </div>
                                <div className={styles.sprintMeta}>
                                    <Badge status={sprint.status}>{sprint.status}</Badge>
                                    <div className={styles.sprintDates}>
                                        {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'N/A'}
                                        {' → '}
                                        {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'N/A'}
                                    </div>
                                </div>
                                <div className={styles.sprintChevron}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" strokeDasharray="4 4" />
                                <path d="M12 8v8" /><path d="M8 12h8" />
                            </svg>
                        </div>
                        <h4 className={styles.emptyTitle}>No sprints assigned yet</h4>
                        <p className={styles.emptyText}>When you are added to a sprint, it will appear here.</p>
                    </div>
                )}
            </div>
        </AppShell>
    );
};
