import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Modal } from '../components/Modal';
import styles from './OrgSprintsPage.module.css';
import adminStyles from './AdminOrgSprintsPage.module.css';


const DAY_LABELS = ['Discovery', 'Analysis', 'Scoring', 'Strategy', 'Delivery'];

export const AdminOrgSprintsPage = () => {
    const { orgId } = useParams();
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const {
        sprints, totalSprints, sprintsPage, sprintsPageSize,
        isLoading, error,
        fetchSprints, createSprint, clearError,
    } = useSprintStore();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [form, setForm] = useState({
        title: '',
        engagement_name: '',
        scheduled_start: '',
        scheduled_end: '',
        notes: '',
    });

    useEffect(() => {
        fetchSprints(orgId, 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgId]);

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createSprint(orgId, form);
            setShowCreateModal(false);
            setForm({ title: '', engagement_name: '', scheduled_start: '', scheduled_end: '', notes: '' });
        } catch (_) {}
    };

    const totalPages = Math.ceil(totalSprints / sprintsPageSize);

    const breadcrumbs = (
        <div className={styles.breadcrumbs}>
            <Link to="/admin/organizations">Organizations</Link>
            <span>/</span>
            <Link to={`/admin/organizations/${orgId}`}>Detail</Link>
            <span>/</span>
            <span>Sprints</span>
        </div>
    );

    return (
        <AppShell
            title={breadcrumbs}
            actions={<Button onClick={() => setShowCreateModal(true)}>+ New Sprint</Button>}
        >
            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>×</button>
                </div>
            )}

            {isLoading ? (
                <div className={styles.loading}>Loading sprints...</div>
            ) : sprints.length > 0 ? (
                <>
                    <div className={styles.grid}>
                        {sprints.map((sprint) => (
                            <div
                                key={sprint.id}
                                className={styles.card}
                                onClick={() => navigate(`/admin/sprints/${sprint.id}`)}
                            >
                                <div className={styles.cardTop}>
                                    <h3 className={styles.cardTitle}>{sprint.title}</h3>
                                    <Badge status={sprint.status}>{sprint.status}</Badge>
                                </div>
                                {sprint.description && (
                                    <p className={styles.engagement}>{sprint.description}</p>
                                )}
                                <div className={styles.dayPips}>
                                    {DAY_LABELS.map((label, i) => {
                                        const day = i + 1;
                                        const isDone = day < sprint.current_day_number;
                                        const isCurrent = day === sprint.current_day_number;
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
                                    <span>Day {sprint.current_day_number} of 5</span>
                                    <span>
                                        {sprint.start_date ? new Date(sprint.start_date).toLocaleDateString() : 'TBD'} →{' '}
                                        {sprint.end_date ? new Date(sprint.end_date).toLocaleDateString() : 'TBD'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <Button variant="secondary" size="sm" disabled={sprintsPage === 1} onClick={() => fetchSprints(orgId, sprintsPage - 1)}>
                                Previous
                            </Button>
                            <span className={styles.pageInfo}>Page {sprintsPage} of {totalPages}</span>
                            <Button variant="secondary" size="sm" disabled={sprintsPage === totalPages} onClick={() => fetchSprints(orgId, sprintsPage + 1)}>
                                Next
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <div className={styles.empty}>
                    <p>No sprints yet for this organization.</p>
                    <Button onClick={() => setShowCreateModal(true)} style={{ marginTop: '16px' }}>Create First Sprint</Button>
                </div>
            )}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Create New Sprint"
                size="lg"
            >
                <form onSubmit={handleCreate} className={adminStyles.form}>
                    <Input label="Sprint Title *" required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. TechCorp AI Readiness Sprint" />
                    <Input label="Engagement Name" value={form.engagement_name} onChange={e => setForm({...form, engagement_name: e.target.value})} placeholder="e.g. Q2 AI Strategy" />
                    <div className={adminStyles.dateRow}>
                        <Input label="Start Date *" type="date" required value={form.scheduled_start} onChange={e => setForm({...form, scheduled_start: e.target.value})} />
                        <Input label="End Date *" type="date" required value={form.scheduled_end} onChange={e => setForm({...form, scheduled_end: e.target.value})} />
                    </div>
                    <Input label="Notes" type="textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} placeholder="Internal notes..." />
                    <div className={adminStyles.formFooter}>
                        <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>Cancel</Button>
                        <Button type="submit" loading={isLoading}>Create Sprint</Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
};
