import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingsAPI } from '../api/meetings';
import { AppShell } from '../components/AppShell';
import { Button } from '../components/Button';
import { Toast } from '../components/Toast';
import styles from './MeetingDetailsPage.module.css';

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 9h18" />
    </svg>
);

const MEETING_TYPES = {
    discovery: 'Discovery',
    operations_audit: 'Operations Audit',
    validation: 'Validation',
    roi_assumptions: 'ROI Assumptions',
    final_presentation: 'Final Presentation',
    follow_up: 'Follow Up',
};

const MEETING_STATUSES = {
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    no_show: 'No Show',
};

export const MeetingDetailsPage = () => {
    const { meetingId } = useParams();
    const navigate = useNavigate();

    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        const loadMeetingDetails = async () => {
            try {
                setLoading(true);
                const data = await meetingsAPI.getMeetingFullDetails(meetingId);
                setMeeting(data);
            } catch (err) {
                const errorMsg = err.response?.data?.detail || 'Failed to load meeting details';
                setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
                setToast({ type: 'error', message: 'Failed to load meeting' });
            } finally {
                setLoading(false);
            }
        };
        loadMeetingDetails();
    }, [meetingId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleString();
    };

    const getStatusBadgeClass = (status) => {
        return `${styles.badge} ${styles[`status-${status}`]}`;
    };

    if (loading) {
        return (
            <AppShell title="Meeting Details">
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}>Loading...</div>
                </div>
            </AppShell>
        );
    }

    if (!meeting) {
        return (
            <AppShell title="Meeting Details">
                <div className={styles.emptyContainer}>
                    <p>Meeting not found</p>
                    <Button onClick={() => navigate(-1)}>Go Back</Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell
            title={`Meeting: ${meeting.title}`}
            actions={
                <Button onClick={() => navigate(-1)} variant="secondary">
                    ← Back
                </Button>
            }
        >
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {error && <div className={styles.error}>{error} <button onClick={() => setError(null)}>×</button></div>}

            <div className={styles.container}>
                {/* Meeting Info Card */}
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <div className={styles.titleSection}>
                            <CalendarIcon />
                            <h2 className={styles.title}>{meeting.title}</h2>
                        </div>
                        <div className={styles.status}>
                            <span className={getStatusBadgeClass(meeting.status)}>
                                {MEETING_STATUSES[meeting.status] || meeting.status}
                            </span>
                        </div>
                    </div>

                    <div className={styles.gridContainer}>
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Meeting Information</h3>
                            <div className={styles.details}>
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Type:</span>
                                    <span className={styles.value}>{MEETING_TYPES[meeting.meeting_type] || meeting.meeting_type}</span>
                                </div>

                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Scheduled Start:</span>
                                    <span className={styles.value}>{formatDate(meeting.scheduled_start_at)}</span>
                                </div>

                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Scheduled End:</span>
                                    <span className={styles.value}>{formatDate(meeting.scheduled_end_at)}</span>
                                </div>

                                {meeting.actual_start_at && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Actual Start:</span>
                                        <span className={styles.value}>{formatDate(meeting.actual_start_at)}</span>
                                    </div>
                                )}

                                {meeting.actual_end_at && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Actual End:</span>
                                        <span className={styles.value}>{formatDate(meeting.actual_end_at)}</span>
                                    </div>
                                )}

                                {meeting.meeting_url && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Join Meeting:</span>
                                        <button
                                            className={styles.joinButton}
                                            disabled={meeting.status === 'completed'}
                                            onClick={() => window.open(meeting.meeting_url, '_blank')}
                                            title={meeting.status === 'completed' ? 'Meeting has ended' : 'Open meeting URL'}
                                        >
                                            Join Now
                                        </button>
                                    </div>
                                )}

                                {meeting.zoom_meeting_id && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Zoom Meeting ID:</span>
                                        <span className={styles.value}>{meeting.zoom_meeting_id}</span>
                                    </div>
                                )}

                                {meeting.fireflies_meeting_id && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Fireflies Meeting ID:</span>
                                        <span className={styles.value}>{meeting.fireflies_meeting_id}</span>
                                    </div>
                                )}

                                {meeting.participants && meeting.participants.length > 0 && (
                                    <div className={styles.detailRow}>
                                        <span className={styles.label}>Participants:</span>
                                        <div className={styles.participantsList}>
                                            {meeting.participants.map((participant, idx) => (
                                                <span key={idx} className={styles.participant}>{participant}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Transcript Section */}
                        <div className={styles.section}>
                            <h3 className={styles.sectionTitle}>Transcript & Summary</h3>
                            {meeting.transcript ? (
                                <div className={styles.transcriptContainer}>
                                    {meeting.transcript.title && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Title:</span>
                                            <span className={styles.value}>{meeting.transcript.title}</span>
                                        </div>
                                    )}

                                    {meeting.transcript.transcript_url && (
                                        <div className={styles.detailRow}>
                                            <span className={styles.label}>Transcript URL:</span>
                                            <a href={meeting.transcript.transcript_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                                                View Transcript
                                            </a>
                                        </div>
                                    )}

                                    {meeting.transcript.summary && (
                                        <div className={styles.summarySection}>
                                            <h4 className={styles.summaryTitle}>Summary</h4>
                                            <p className={styles.summaryText}>{meeting.transcript.summary}</p>
                                        </div>
                                    )}

                                    {meeting.transcript.cleaned_text && (
                                        <div className={styles.transcriptSection}>
                                            <h4 className={styles.transcriptTitle}>Cleaned Transcript</h4>
                                            <div className={styles.transcriptText}>
                                                {meeting.transcript.cleaned_text.split('\n').map((line, idx) => (
                                                    <div key={idx} className={styles.transcriptLine}>{line}</div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className={styles.noTranscript}>
                                    <p>No transcript available yet</p>
                                    <small>Transcripts become available after the meeting is completed and processed by Fireflies</small>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppShell>
    );
};
