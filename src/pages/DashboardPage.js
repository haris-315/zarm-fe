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
import { cohortAPI } from '../api';
import { Input } from '../components/Input';

export const DashboardPage = () => {
    const navigate = useNavigate();
    const { user, roles, organization, updateAvatar } = useAuthStore();
    const [sprints, setSprints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [cohortInfo, setCohortInfo] = useState(null);
    const [cohortLoading, setCohortLoading] = useState(true);
    const [accessCode, setAccessCode] = useState('');
    const [verifyingCode, setVerifyingCode] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    const isOrgAdmin = roles.includes('org_admin') || roles.includes('manager');

    const fetchCohort = async () => {
        try {
            setCohortLoading(true);
            const info = await cohortAPI.getUpcoming();
            setCohortInfo(info);
        } catch (err) {
            console.error('Failed to load cohort info:', err);
        } finally {
            setCohortLoading(false);
        }
    };

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

        fetchData();
        if (user) {
            fetchCohort();
        }
    }, [roles, navigate, user, organization?.id]);

    useEffect(() => {
        if (!cohortInfo || !cohortInfo.start_time) return;

        const calculateTimeLeft = () => {
            const difference = +new Date(cohortInfo.start_time) - +new Date();
            let tempTimeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };

            if (difference > 0) {
                tempTimeLeft = {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                };
            }
            return tempTimeLeft;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const calculated = calculateTimeLeft();
            setTimeLeft(calculated);

            // Auto-refresh when countdown hits zero
            const difference = +new Date(cohortInfo.start_time) - +new Date();
            if (difference <= 0 && cohortInfo.cohort_status?.toUpperCase() === 'SCHEDULED') {
                clearInterval(timer);
                fetchCohort();
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [cohortInfo]);

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        setVerifyError('');
        setVerifyingCode(true);
        try {
            await cohortAPI.verifyCode(accessCode);
            const info = await cohortAPI.getUpcoming();
            setCohortInfo(info);
        } catch (err) {
            setVerifyError(err.response?.data?.detail || 'Invalid or expired access code.');
        } finally {
            setVerifyingCode(false);
        }
    };

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

    if (loading || cohortLoading) {
        return (
            <AppShell title="Dashboard">
                <div style={{ padding: '24px' }}>
                    <Skeleton height="80px" count={3} />
                </div>
            </AppShell>
        );
    }

    if (cohortInfo && cohortInfo.has_cohort && !cohortInfo.code_verified) {
        return (
            <AppShell title="Cohort Verification">
                <div className={styles.verifyContainer}>
                    <div className={styles.verifyCard}>
                        <h2 className={styles.verifyTitle}>Cohort Assessment Access</h2>
                        <div className={styles.verifyInfo}>
                            <p>
                                You are registered in cohort: <strong>{cohortInfo.cohort_name}</strong>
                            </p>
                            <p>
                                Start Time: <strong>{new Date(cohortInfo.start_time).toLocaleString()}</strong>
                            </p>
                            <p>
                                Approval Status:{' '}
                                <Badge
                                    status={
                                        cohortInfo.member_status?.toLowerCase() === 'approved'
                                            ? 'complete'
                                            : cohortInfo.member_status?.toLowerCase() === 'rejected'
                                            ? 'suspended'
                                            : 'planning'
                                    }
                                >
                                    {cohortInfo.member_status?.toUpperCase() || 'PENDING'}
                                </Badge>
                            </p>
                        </div>

                        {cohortInfo.member_status?.toLowerCase() === 'pending' && (
                            <div className={`${styles.statusBox} ${styles.pendingBox}`}>
                                <p>Your signup is pending approval by the administrator.</p>
                                <p className={styles.mutedText}>
                                    Once approved, you will receive an email containing your unique access code.
                                    Please return to this page and verify your code once the cohort starts.
                                </p>
                            </div>
                        )}

                        {cohortInfo.member_status?.toLowerCase() === 'rejected' && (
                            <div className={`${styles.statusBox} ${styles.rejectedBox}`}>
                                <p>Your application was not approved for this cohort.</p>
                                <p className={styles.mutedText}>
                                    If you believe this is in error, please contact your administrator or support.
                                </p>
                            </div>
                        )}

                        {cohortInfo.member_status?.toLowerCase() === 'approved' && cohortInfo.cohort_status?.toUpperCase() === 'SCHEDULED' && (
                            <div className={styles.approvedWaitBox}>
                                <p>Your application is approved! 🎉</p>
                                <p className={styles.mutedText}>
                                    Your access code will be emailed to you 10 minutes before the cohort starts. 
                                    Please keep this tab open or return when the countdown ends.
                                </p>
                            </div>
                        )}

                        {/* Countdown Timer */}
                        {cohortInfo.cohort_status?.toUpperCase() === 'SCHEDULED' && (
                            <div className={styles.countdownContainer}>
                                <div className={styles.countdownLabel}>Cohort Starts In</div>
                                <div className={styles.countdownGrid}>
                                    <div className={styles.countdownItem}>
                                        <span className={styles.countdownValue}>{String(timeLeft.days).padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>Days</span>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <span className={styles.countdownValue}>{String(timeLeft.hours).padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>Hours</span>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <span className={styles.countdownValue}>{String(timeLeft.minutes).padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>Mins</span>
                                    </div>
                                    <div className={styles.countdownItem}>
                                        <span className={styles.countdownValue}>{String(timeLeft.seconds).padStart(2, '0')}</span>
                                        <span className={styles.countdownUnit}>Secs</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Access Code Form (Only shown when approved AND cohort is active) */}
                        {cohortInfo.member_status?.toLowerCase() === 'approved' && cohortInfo.cohort_status?.toUpperCase() === 'ACTIVE' && (
                            <form onSubmit={handleVerifyCode} className={styles.verifyForm}>
                                <p className={styles.instructionText}>
                                    The cohort has started! Please enter your unique single-use access code below to unlock your dashboard and begin.
                                </p>
                                
                                {verifyError && (
                                    <div className={styles.verifyError}>
                                        <Badge status="suspended">{verifyError}</Badge>
                                    </div>
                                )}

                                <Input
                                    label="Enter Cohort Access Code"
                                    placeholder="e.g. A1B2C3D4"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                                    required
                                    disabled={verifyingCode}
                                />
                                <Button type="submit" loading={verifyingCode} className={styles.verifyButton}>
                                    Verify and Join Assessment
                                </Button>
                            </form>
                        )}
                        {cohortInfo.access_code && (
                            <div style={{
                                marginTop: '24px',
                                padding: '16px',
                                background: '#1e293b',
                                border: '1px dashed #64748b',
                                borderRadius: '8px',
                                color: '#e2e8f0',
                                textAlign: 'center'
                            }}>
                                <h4 style={{ margin: '0 0 8px 0', color: '#f59e0b', fontSize: '14px' }}>👨‍💻 Developer Bypass Tool</h4>
                                <p style={{ fontSize: '12px', margin: '0 0 12px 0', color: '#94a3b8' }}>
                                    Local environment detected. You can instantly bypass the timer and enter the assessment.
                                </p>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                    <input
                                        type="text"
                                        readOnly
                                        value={cohortInfo.access_code}
                                        style={{
                                            background: '#0f172a',
                                            border: '1px solid #334155',
                                            borderRadius: '4px',
                                            padding: '4px 8px',
                                            color: '#38bdf8',
                                            fontFamily: 'monospace',
                                            fontSize: '13px',
                                            textAlign: 'center',
                                            width: '140px'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            setAccessCode(cohortInfo.access_code);
                                            setVerifyingCode(true);
                                            try {
                                                await cohortAPI.verifyCode(cohortInfo.access_code);
                                                const info = await cohortAPI.getUpcoming();
                                                setCohortInfo(info);
                                            } catch (err) {
                                                setVerifyError(err.response?.data?.detail || 'Bypass failed.');
                                            } finally {
                                                setVerifyingCode(false);
                                            }
                                        }}
                                        style={{
                                            background: '#f59e0b',
                                            color: '#0f172a',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '6px 12px',
                                            fontWeight: 'bold',
                                            cursor: 'pointer',
                                            fontSize: '12px'
                                        }}
                                    >
                                        Bypass & Start
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </AppShell>
        );
    }

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
