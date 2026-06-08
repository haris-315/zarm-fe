import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { meetingsAPI } from '../api/meetings';
import { sprintAPI } from '../api/sprints';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import styles from './MeetingsPage.module.css';

const CalendarIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 9h18" />
    </svg>
);

const MEETING_TYPES = [
    { label: 'Discovery', value: 'discovery' },
    { label: 'Operations Audit', value: 'operations_audit' },
    { label: 'Validation', value: 'validation' },
    { label: 'ROI Assumptions', value: 'roi_assumptions' },
    { label: 'Final Presentation', value: 'final_presentation' },
    { label: 'Follow Up', value: 'follow_up' },
];

const MEETING_STATUSES = [
    { label: 'Scheduled', value: 'scheduled' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'No Show', value: 'no_show' },
];

export const MeetingsPage = () => {
    const { user, roles } = useAuthStore();
    const { sprintId } = useParams();

    const canCreateMeeting = roles && (roles.includes('super_admin') || roles.includes('facilitator'));

    const [meetings, setMeetings] = useState([]);
    const [sprint, setSprint] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(20);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingMeeting, setEditingMeeting] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        meeting_type: 'discovery',
        scheduled_start_at: '',
        scheduled_end_at: '',
        meeting_url: '',
    });

    const formatDatetimeLocal = (isoString) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    // Load meetings and sprint info
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);

                // Load sprint info
                const sprintData = await sprintAPI.getSprint(sprintId);
                setSprint(sprintData);

                // Load meetings
                const meetingsData = await meetingsAPI.listSprintMeetings(sprintId, currentPage, pageSize);
                setMeetings(meetingsData.items || []);
                setTotal(meetingsData.total || 0);
            } catch (err) {
                console.error('Failed to load meetings:', err);
                setError(err.response?.data?.detail || 'Failed to load meetings');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [sprintId, currentPage, pageSize]);

    const handleCreateMeeting = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {
                title: formData.title,
                meeting_type: formData.meeting_type,
                meeting_url: formData.meeting_url || null,
            };

            // Convert datetime-local to ISO format
            if (formData.scheduled_start_at) {
                const startDate = new Date(formData.scheduled_start_at);
                payload.scheduled_start_at = startDate.toISOString();
            }
            if (formData.scheduled_end_at) {
                const endDate = new Date(formData.scheduled_end_at);
                payload.scheduled_end_at = endDate.toISOString();
            }

            await meetingsAPI.createMeeting(sprintId, payload);
            setToast({ type: 'success', message: 'Meeting created successfully' });
            setCreateModalOpen(false);
            setFormData({ title: '', meeting_type: 'discovery', scheduled_start_at: '', scheduled_end_at: '', meeting_url: '' });

            // Reload meetings
            const meetingsData = await meetingsAPI.listSprintMeetings(sprintId, currentPage, pageSize);
            setMeetings(meetingsData.items || []);
            setTotal(meetingsData.total || 0);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to create meeting';
            setToast({ type: 'error', message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) });
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMeeting = async (e) => {
        e.preventDefault();
        try {
            setSubmitting(true);
            const payload = {};

            if (formData.title) payload.title = formData.title;
            if (formData.meeting_type) payload.meeting_type = formData.meeting_type;
            if (formData.meeting_url !== undefined) payload.meeting_url = formData.meeting_url || null;

            if (formData.scheduled_start_at) {
                const startDate = new Date(formData.scheduled_start_at);
                payload.scheduled_start_at = startDate.toISOString();
            }
            if (formData.scheduled_end_at) {
                const endDate = new Date(formData.scheduled_end_at);
                payload.scheduled_end_at = endDate.toISOString();
            }

            await meetingsAPI.updateMeeting(editingMeeting.id, payload);
            setToast({ type: 'success', message: 'Meeting updated successfully' });
            setEditingMeeting(null);
            setFormData({ title: '', meeting_type: 'discovery', scheduled_start_at: '', scheduled_end_at: '', meeting_url: '' });

            // Reload meetings
            const meetingsData = await meetingsAPI.listSprintMeetings(sprintId, currentPage, pageSize);
            setMeetings(meetingsData.items || []);
            setTotal(meetingsData.total || 0);
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Failed to update meeting';
            setToast({ type: 'error', message: typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg) });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteMeeting = async (meetingId) => {
        try {
            await meetingsAPI.deleteMeeting(meetingId);
            setDeleteConfirm(null);
            setToast({ type: 'success', message: 'Meeting deleted' });

            // Reload meetings
            const meetingsData = await meetingsAPI.listSprintMeetings(sprintId, currentPage, pageSize);
            setMeetings(meetingsData.items || []);
            setTotal(meetingsData.total || 0);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to delete meeting' });
        }
    };

    const handleEditClick = (meeting) => {
        setEditingMeeting(meeting);
        setFormData({
            title: meeting.title,
            meeting_type: meeting.meeting_type,
            scheduled_start_at: formatDatetimeLocal(meeting.scheduled_start_at),
            scheduled_end_at: formatDatetimeLocal(meeting.scheduled_end_at),
            meeting_url: meeting.meeting_url || '',
        });
    };

    const handleCloseModal = () => {
        setCreateModalOpen(false);
        setEditingMeeting(null);
        setFormData({ title: '', meeting_type: 'discovery', scheduled_start_at: '', scheduled_end_at: '', meeting_url: '' });
    };

    const getMeetingTypeLabel = (type) => {
        const found = MEETING_TYPES.find(t => t.value === type);
        return found ? found.label : type;
    };

    const getMeetingStatusLabel = (status) => {
        const found = MEETING_STATUSES.find(s => s.value === status);
        return found ? found.label : status;
    };

    const columns = [
        {
            key: 'title',
            label: 'Meeting',
            render: (val) => (
                <div className={styles.titleCell}>
                    <CalendarIcon />
                    {val}
                </div>
            ),
        },
        {
            key: 'meeting_type',
            label: 'Type',
            render: (val) => <span className={styles.badge}>{getMeetingTypeLabel(val)}</span>,
        },
        {
            key: 'status',
            label: 'Status',
            render: (val) => <span className={`${styles.badge} ${styles[`status-${val}`]}`}>{getMeetingStatusLabel(val)}</span>,
        },
        {
            key: 'scheduled_start_at',
            label: 'Scheduled',
            render: (val) => val ? new Date(val).toLocaleDateString() : '-',
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClick(row)}>
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(row.id)}>
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    const totalPages = Math.ceil(total / pageSize);

    return (
        <AppShell
            title={`Meetings - ${sprint?.title || 'Sprint'}`}
            actions={
                canCreateMeeting && (
                    <div className={styles.topActions}>
                        <Button onClick={() => setCreateModalOpen(true)} variant="primary">
                            + Schedule Meeting
                        </Button>
                    </div>
                )
            }
        >
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && <div className={styles.error}>{error} <button onClick={() => setError(null)}>×</button></div>}

            <div className={styles.tableCard}>
                <DataTable
                    columns={columns}
                    data={meetings}
                    loading={loading}
                />
            </div>

            {totalPages > 1 && (
                <div className={styles.pagination}>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        Previous
                    </Button>
                    <div className={styles.pageInfo}>
                        Page {currentPage} of {totalPages}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={createModalOpen || !!editingMeeting}
                onClose={handleCloseModal}
                title={editingMeeting ? 'Edit Meeting' : 'Schedule New Meeting'}
            >
                <form onSubmit={editingMeeting ? handleUpdateMeeting : handleCreateMeeting} className={styles.form}>
                    <Input
                        label="Meeting Title"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder="e.g., Client Discovery Session"
                    />

                    <Select
                        label="Meeting Type"
                        required
                        value={formData.meeting_type}
                        onChange={(e) => setFormData({ ...formData, meeting_type: e.target.value })}
                        options={MEETING_TYPES}
                    />

                    <Input
                        label="Start Date & Time"
                        type="datetime-local"
                        value={formData.scheduled_start_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_start_at: e.target.value })}
                    />

                    <Input
                        label="End Date & Time"
                        type="datetime-local"
                        value={formData.scheduled_end_at}
                        onChange={(e) => setFormData({ ...formData, scheduled_end_at: e.target.value })}
                    />

                    <Input
                        label="Meeting URL (Zoom, Teams, etc.)"
                        type="url"
                        value={formData.meeting_url}
                        onChange={(e) => setFormData({ ...formData, meeting_url: e.target.value })}
                        placeholder="https://zoom.us/j/..."
                    />

                    <div className={styles.modalFooter}>
                        <Button variant="secondary" type="button" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                        <Button type="submit" loading={submitting}>
                            {editingMeeting ? 'Update Meeting' : 'Schedule Meeting'}
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirmation */}
            <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Meeting?">
                <p className={styles.confirmText}>
                    Are you sure you want to delete this meeting? This action cannot be undone.
                </p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteMeeting(deleteConfirm)}>
                        Delete Meeting
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
};
