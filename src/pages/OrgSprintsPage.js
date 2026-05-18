import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useSprintStore } from '../context/sprintStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import styles from './OrgSprintsPage.module.css';

const DAY_LABELS = ['Discovery', 'Analysis', 'Scoring', 'Strategy', 'Delivery'];

export const OrgSprintsPage = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const {
        sprints, totalSprints, sprintsPage, sprintsPageSize,
        organizations,
        isLoading, error,
        fetchSprints, clearError,
    } = useSprintStore();

    const org = organizations.find((o) => o.id === orgId);
    const orgName = org?.name || 'Organization';
    const totalPages = Math.ceil(totalSprints / sprintsPageSize);

    useEffect(() => {
        fetchSprints(orgId, 1);
    }, [orgId, fetchSprints]);

    const breadcrumbs = (
        <div className={styles.breadcrumbs}>
            <Link to="/facilitator/organizations">Organizations</Link>
            <span>/</span>
            <span>{orgName}</span>
        </div>
    );

    return (
        <AppShell title={breadcrumbs}>
            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>×</button>
                </div>
            )}

            <div className={styles.header}>
                <div>
                    <div className={styles.countText}>
                        {totalSprints} sprint{totalSprints !== 1 ? 's' : ''}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className={styles.loading}>Loading sprints...</div>
            ) : sprints.length > 0 ? (
                <>
                    <div className={styles.grid}>
                        {sprints.map((sprint) => (
                            <div
                                key={sprint.id}
                                className={styles.card}
                                onClick={() => navigate(`/facilitator/sprints/${sprint.id}`)}
                            >
                                <div className={styles.cardTop}>
                                    <h3 className={styles.cardTitle}>{sprint.title}</h3>
                                    <Badge status={sprint.status}>{sprint.status}</Badge>
                                </div>
                                {sprint.engagement_name && (
                                    <p className={styles.engagement}>{sprint.engagement_name}</p>
                                )}
                                <div className={styles.dayPips}>
                                    {DAY_LABELS.map((label, i) => {
                                        const day = i + 1;
                                        const isDone = day < sprint.current_day;
                                        const isCurrent = day === sprint.current_day;
                                        return (
                                            <div
                                                key={i}
                                                className={`${styles.pip} ${isDone ? styles.pipDone : ''} ${isCurrent ? styles.pipCurrent : ''}`}
                                                title={`Day ${day}: ${label}`}
                                            />
                                        );
                                    })}
                                </div>
                                <div className={styles.cardFooter}>
                                    <span>Day {sprint.current_day} of 5</span>
                                    <span>
                                        {new Date(sprint.scheduled_start).toLocaleDateString()} →{' '}
                                        {new Date(sprint.scheduled_end).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={sprintsPage === 1}
                                onClick={() => fetchSprints(orgId, sprintsPage - 1)}
                            >
                                Previous
                            </Button>
                            <span className={styles.pageInfo}>Page {sprintsPage} of {totalPages}</span>
                            <Button
                                variant="secondary"
                                size="sm"
                                disabled={sprintsPage === totalPages}
                                onClick={() => fetchSprints(orgId, sprintsPage + 1)}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.empty}>
                    <p>No sprints have been created for this organization yet.</p>
                </div>
            )}
        </AppShell>
    );
};
