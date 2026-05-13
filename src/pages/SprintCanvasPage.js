import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mammoth from 'mammoth/mammoth.browser';
import * as XLSX from 'xlsx';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import { sprintAPI } from '../api/sprints';
import '../styles/Sprint.css';

const TABS = ['Overview', 'Findings', 'Decision Cards', 'Reports'];
const DAY_LABELS = ['Day 1: Discovery', 'Day 2: Analysis', 'Day 3: Scoring', 'Day 4: Strategy', 'Day 5: Delivery'];
const FINDING_TYPES = ['Problem', 'Opportunity', 'Observation'];
const PRIORITY_TIERS = ['Quick Win', 'Strategic', 'Technical Debt', 'Backlog'];

// ── Document Viewer ───────────────────────────────────────────────

const DocumentViewer = ({ report, sprintId, onClose }) => {
    const [signedUrl, setSignedUrl] = useState(null);
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

    const mimeType = report.file_type || '';
    const isPdf = mimeType.includes('pdf');
    const isDocx = mimeType.includes('wordprocessingml') || mimeType.includes('msword') || mimeType.includes('docx') || mimeType.includes('doc');
    const isXlsx = mimeType.includes('spreadsheetml') || mimeType.includes('ms-excel') || mimeType.includes('xlsx') || mimeType.includes('xls');

    useEffect(() => {
        const load = async () => {
            try {
                // Always fetch a fresh signed URL for PDF iframe and download link
                const { url } = await sprintAPI.getReportUrl(sprintId, report.id);
                setSignedUrl(url);

                if (isPdf) { setLoading(false); return; }

                // Use the backend proxy for DOCX/XLSX to avoid CORS on GCS signed URLs
                const token = localStorage.getItem('access_token');
                const proxyUrl = sprintAPI.getReportDownloadUrl(sprintId, report.id);
                const res = await fetch(proxyUrl, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                if (!res.ok) throw new Error(`Download failed: ${res.status}`);
                const arrayBuffer = await res.arrayBuffer();

                if (isDocx) {
                    const result = await mammoth.convertToHtml({ arrayBuffer });
                    setContent(result.value);
                } else if (isXlsx) {
                    const wb = XLSX.read(arrayBuffer, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    setContent(XLSX.utils.sheet_to_html(ws));
                } else {
                    setError('Unsupported file type — please use the download button.');
                }
            } catch (e) {
                setError('Failed to load document.');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [report.id, sprintId, isPdf, isDocx, isXlsx]);

    return (
        <div className="doc-viewer-overlay" onClick={onClose}>
            <div className="doc-viewer-modal" onClick={(e) => e.stopPropagation()}>
                <div className="doc-viewer-header">
                    <h3>{report.title}</h3>
                    <div className="doc-viewer-actions">
                        {signedUrl && (
                            <a href={signedUrl} download={report.title} className="btn-secondary" style={{ marginRight: 8 }}>
                                Download
                            </a>
                        )}
                        <button onClick={onClose} className="btn-close-lg">✕</button>
                    </div>
                </div>
                <div className="doc-viewer-body" ref={containerRef}>
                    {loading && <div className="doc-loading">Loading document…</div>}
                    {error && <div className="doc-error">{error}</div>}
                    {!loading && !error && isPdf && signedUrl && (
                        <iframe
                            src={signedUrl}
                            title={report.title}
                            className="doc-iframe"
                        />
                    )}
                    {!loading && !error && (isDocx || isXlsx) && content && (
                        <div
                            className="doc-html-content"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

// ── Sub-components ────────────────────────────────────────────────

const MetricsBar = ({ sprint, metrics }) => (
    <div className="metrics-bar">
        <div className="metric-card">
            <span className="metric-value">{metrics?.total_findings ?? 0}</span>
            <span className="metric-label">Total Findings</span>
        </div>
        <div className="metric-card">
            <span className="metric-value">{metrics?.total_decision_cards ?? 0}</span>
            <span className="metric-label">Decision Cards</span>
        </div>
        <div className="metric-card accent">
            <span className="metric-value">{metrics?.ai_readiness_score ?? 0}</span>
            <span className="metric-label">AI Readiness Score</span>
        </div>
    </div>
);

const DayProgress = ({ sprint }) => (
    <div className="day-progress-row">
        {DAY_LABELS.map((label, i) => {
            const day = i + 1;
            const isDone = day < sprint.current_day;
            const isCurrent = day === sprint.current_day;
            return (
                <div key={i} className={`day-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                    <div className="day-step-circle">{isDone ? '✓' : day}</div>
                    <span className="day-step-label">{label}</span>
                </div>
            );
        })}
    </div>
);

const FindingCard = ({ finding, sprintId, onComment }) => {
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState('');
    const [isInternal, setIsInternal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { addFindingComment } = useSprintStore();
    const typeColors = { Problem: '#dc2626', Opportunity: '#16a34a', Observation: '#2563eb' };

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await addFindingComment(sprintId, finding.id, comment, isInternal);
            setComment('');
            onComment && onComment();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="finding-card">
            <div className="finding-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="finding-meta">
                    <span
                        className="finding-type-badge"
                        style={{ background: typeColors[finding.type] || '#64748b' }}
                    >
                        {finding.type}
                    </span>
                    {finding.department && (
                        <span className="finding-dept">{finding.department}</span>
                    )}
                    <span className="finding-day">Day {finding.day}</span>
                </div>
                <h4>{finding.title}</h4>
                <p className="finding-summary">{finding.brief_summary}</p>
                <button className="expand-btn">{expanded ? '▲ Less' : '▼ More'}</button>
            </div>

            {expanded && (
                <div className="finding-expanded">
                    <div className="finding-section">
                        <strong>Description</strong>
                        <p>{finding.description}</p>
                    </div>
                    {finding.data_source && (
                        <div className="finding-section">
                            <strong>Data Source</strong>
                            <p>{finding.data_source}</p>
                        </div>
                    )}
                    {finding.internal_notes && (
                        <div className="finding-section internal">
                            <strong>🔒 Internal Notes</strong>
                            <p>{finding.internal_notes}</p>
                        </div>
                    )}

                    <div className="comment-section">
                        <strong>Discussion</strong>
                        {finding.comments?.map((c) => (
                            <div key={c.id} className={`comment ${c.is_internal ? 'internal' : ''}`}>
                                <span className="comment-badge">{c.is_internal ? '🔒 Internal' : '💬'}</span>
                                <p>{c.content}</p>
                                <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                        ))}
                        <form onSubmit={handleComment} className="comment-form">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={2}
                            />
                            <div className="comment-form-footer">
                                <label className="internal-toggle">
                                    <input
                                        type="checkbox"
                                        checked={isInternal}
                                        onChange={(e) => setIsInternal(e.target.checked)}
                                    />
                                    Internal only
                                </label>
                                <button type="submit" disabled={submitting} className="btn-small">
                                    {submitting ? '...' : 'Comment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const DecisionCardView = ({ card, sprintId, onPublish }) => {
    const [expanded, setExpanded] = useState(false);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const { addDecisionComment, publishDecisionCard } = useSprintStore();

    const handleComment = async (e) => {
        e.preventDefault();
        if (!comment.trim()) return;
        setSubmitting(true);
        try {
            await addDecisionComment(sprintId, card.id, comment);
            setComment('');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePublish = async () => {
        await publishDecisionCard(sprintId, card.id);
        onPublish && onPublish();
    };

    const effortLabel = (n) => (n <= 2 ? 'Low' : n === 3 ? 'Medium' : 'High');
    const impactColor = (n) => (n >= 4 ? '#16a34a' : n >= 3 ? '#d97706' : '#dc2626');

    return (
        <div className={`decision-card ${card.published_to_client ? 'published' : ''}`}>
            <div className="decision-card-header" onClick={() => setExpanded(!expanded)}>
                <div className="decision-meta">
                    <span className="priority-badge">{card.priority_tier}</span>
                    {card.published_to_client && <span className="published-badge">✓ Published</span>}
                </div>
                <h4>{card.title}</h4>
                <div className="impact-effort-row">
                    <span style={{ color: impactColor(card.impact) }}>
                        Impact: {card.impact}/5
                    </span>
                    <span>Effort: {effortLabel(card.effort)}</span>
                </div>
                <button className="expand-btn">{expanded ? '▲ Less' : '▼ Details'}</button>
            </div>

            {expanded && (
                <div className="decision-expanded">
                    <div className="decision-sections">
                        <div className="decision-section">
                            <strong>Problem</strong>
                            <p>{card.problem}</p>
                        </div>
                        <div className="decision-section">
                            <strong>Solution</strong>
                            <p>{card.solution}</p>
                        </div>
                        <div className="decision-section">
                            <strong>Expected Outcome</strong>
                            <p>{card.expected_outcome}</p>
                        </div>
                    </div>

                    {!card.published_to_client && (
                        <button onClick={handlePublish} className="btn-publish">
                            Publish to Client
                        </button>
                    )}

                    <div className="comment-section">
                        <strong>Discussion</strong>
                        {card.comments?.map((c) => (
                            <div key={c.id} className="comment">
                                <p>{c.content}</p>
                                <span className="comment-time">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                        ))}
                        <form onSubmit={handleComment} className="comment-form">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Add a comment..."
                                rows={2}
                            />
                            <div className="comment-form-footer">
                                <button type="submit" disabled={submitting} className="btn-small">
                                    {submitting ? '...' : 'Comment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────

export const SprintCanvasPage = () => {
    const { sprintId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuthStore();
    const {
        currentSprint, sprintMetrics,
        findings, totalFindings,
        decisionCards, totalDecisionCards,
        reports,
        isLoading, error,
        fetchSprint, fetchFindings, fetchDecisionCards, fetchReports,
        createFinding, createDecisionCard, createReport,
        clearError,
    } = useSprintStore();

    const [activeTab, setActiveTab] = useState('Overview');
    const [dayFilter, setDayFilter] = useState(null);

    // Finding modal
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [findingForm, setFindingForm] = useState({
        day: 1, type: 'Problem', title: '', brief_summary: '',
        description: '', department: '', data_source: '', internal_notes: '',
    });

    // Decision card modal
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [decisionForm, setDecisionForm] = useState({
        title: '', problem: '', solution: '', expected_outcome: '',
        impact: 3, effort: 3, priority_tier: 'Quick Win', finding_id: '',
    });

    // Report modal
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ title: '', file: null });
    const [uploadProgress, setUploadProgress] = useState({ jobId: null, progress: 0, status: null });
    const [viewingReport, setViewingReport] = useState(null);

    useEffect(() => {
        fetchSprint(sprintId);
    }, [sprintId]);

    useEffect(() => {
        if (activeTab === 'Findings') fetchFindings(sprintId, dayFilter, 1);
        if (activeTab === 'Decision Cards') fetchDecisionCards(sprintId, 1);
        if (activeTab === 'Reports') fetchReports(sprintId, 1);
    }, [activeTab, dayFilter]);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleCreateFinding = async (e) => {
        e.preventDefault();
        try {
            await createFinding(sprintId, findingForm);
            setShowFindingModal(false);
            setFindingForm({ day: 1, type: 'Problem', title: '', brief_summary: '', description: '', department: '', data_source: '', internal_notes: '' });
            fetchFindings(sprintId, dayFilter, 1);
        } catch (_) {}
    };

    const handleCreateDecision = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...decisionForm, impact: parseInt(decisionForm.impact), effort: parseInt(decisionForm.effort) };
            if (!payload.finding_id) delete payload.finding_id;
            await createDecisionCard(sprintId, payload);
            setShowDecisionModal(false);
            setDecisionForm({ title: '', problem: '', solution: '', expected_outcome: '', impact: 3, effort: 3, priority_tier: 'Quick Win', finding_id: '' });
            fetchDecisionCards(sprintId, 1);
        } catch (_) {}
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        try {
            if (!reportForm.file) {
                alert('Please select a file');
                return;
            }
            const response = await createReport(sprintId, reportForm.title, reportForm.file);
            const { job_id } = response;

            setUploadProgress({ jobId: job_id, progress: 0, status: 'uploading' });

            // Track progress using SSE
            const eventSource = new EventSource(`/api/v1/uploads/${job_id}/progress`);

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setUploadProgress({
                        jobId: job_id,
                        progress: data.progress || 0,
                        status: data.status,
                    });

                    if (data.status === 'complete' || data.status === 'error') {
                        eventSource.close();
                        if (data.status === 'complete') {
                            // Refresh reports list
                            fetchReports(sprintId, 1);
                            setShowReportModal(false);
                            setReportForm({ title: '', file: null });
                            setUploadProgress({ jobId: null, progress: 0, status: null });
                        }
                    }
                } catch (e) {
                    console.error('Error parsing progress:', e);
                }
            };

            eventSource.onerror = () => {
                eventSource.close();
                setUploadProgress({ jobId: null, progress: 0, status: 'error' });
            };
        } catch (_) {}
    };

    if (!currentSprint && isLoading) {
        return <div className="loading-screen">Loading sprint...</div>;
    }

    return (
        <div className="sprint-container">
            <header className="sprint-header">
                <div className="header-content">
                    <div className="logo-section">
                        <button onClick={() => navigate(-1)} className="back-link">← Back</button>
                        <div>
                            <h1>{currentSprint?.title || 'Sprint'}</h1>
                            <span className="sprint-header-meta">
                                {currentSprint && (
                                    <>
                                        Started {new Date(currentSprint.scheduled_start).toLocaleDateString()} •{' '}
                                        Day {currentSprint.current_day} of 5
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                    <div className="header-actions">
                        <span className="user-info">{user?.email}</span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </div>
                </div>

                {currentSprint && <DayProgress sprint={currentSprint} />}

                <div className="tab-nav">
                    {TABS.map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <main className="canvas-main">
                {error && (
                    <div className="alert alert-error">
                        {error}
                        <button onClick={clearError} className="btn-close">×</button>
                    </div>
                )}

                {/* ── Overview Tab ─────────────────────────────── */}
                {activeTab === 'Overview' && currentSprint && (
                    <div className="overview-grid">
                        <div className="overview-left">
                            <MetricsBar sprint={currentSprint} metrics={sprintMetrics} />

                            <div className="canvas-card">
                                <h3>Today's Focus: Day {currentSprint.current_day} — {DAY_LABELS[currentSprint.current_day - 1] || 'Planning'}</h3>
                                <p>{currentSprint.notes || 'No notes for this sprint.'}</p>
                                <div className="focus-actions">
                                    <button onClick={() => setActiveTab('Findings')} className="btn-secondary">
                                        View All Findings
                                    </button>
                                    <button onClick={() => { setActiveTab('Findings'); setShowFindingModal(true); }} className="btn-primary">
                                        + Log Finding
                                    </button>
                                </div>
                            </div>

                            <div className="canvas-card">
                                <h3>Pre-Sprint Checklist</h3>
                                <ul className="checklist">
                                    <li className="check-done">✓ Client profile configured</li>
                                    <li className={currentSprint.participants?.length > 0 ? 'check-done' : ''}>
                                        {currentSprint.participants?.length > 0 ? '✓' : '○'} Team members assigned
                                    </li>
                                    <li className="check-done">✓ 5-day schedule confirmed</li>
                                    <li className="">○ Final report template selected</li>
                                </ul>
                            </div>
                        </div>

                        <div className="overview-right">
                            <div className="canvas-card">
                                <h3>Sprint Details</h3>
                                <div className="detail-row">
                                    <span>Status</span>
                                    <span className="detail-value">{currentSprint.status}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Engagement</span>
                                    <span className="detail-value">{currentSprint.engagement_name || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Start</span>
                                    <span className="detail-value">{new Date(currentSprint.scheduled_start).toLocaleDateString()}</span>
                                </div>
                                <div className="detail-row">
                                    <span>End</span>
                                    <span className="detail-value">{new Date(currentSprint.scheduled_end).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {sprintMetrics?.findings_by_type && Object.keys(sprintMetrics.findings_by_type).length > 0 && (
                                <div className="canvas-card">
                                    <h3>Findings by Type</h3>
                                    {Object.entries(sprintMetrics.findings_by_type).map(([type, count]) => (
                                        <div key={type} className="type-row">
                                            <span>{type}</span>
                                            <span className="type-count">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ── Findings Tab ─────────────────────────────── */}
                {activeTab === 'Findings' && (
                    <div className="tab-content">
                        <div className="tab-toolbar">
                            <div className="day-filters">
                                <button
                                    onClick={() => setDayFilter(null)}
                                    className={`day-filter-btn ${dayFilter === null ? 'active' : ''}`}
                                >
                                    All Days
                                </button>
                                {[1, 2, 3, 4, 5].map((d) => (
                                    <button
                                        key={d}
                                        onClick={() => setDayFilter(d)}
                                        className={`day-filter-btn ${dayFilter === d ? 'active' : ''}`}
                                    >
                                        Day {d}
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => setShowFindingModal(true)} className="btn-primary">
                                + Log Finding
                            </button>
                        </div>

                        <p className="results-count">{totalFindings} finding{totalFindings !== 1 ? 's' : ''}</p>

                        {isLoading ? (
                            <div className="loading-state">Loading findings...</div>
                        ) : findings.length > 0 ? (
                            <div className="findings-list">
                                {findings.map((f) => (
                                    <FindingCard key={f.id} finding={f} sprintId={sprintId} onComment={() => fetchFindings(sprintId, dayFilter, 1)} />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No findings yet</p>
                                <button onClick={() => setShowFindingModal(true)} className="btn-primary">Log First Finding</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Decision Cards Tab ───────────────────────── */}
                {activeTab === 'Decision Cards' && (
                    <div className="tab-content">
                        <div className="tab-toolbar">
                            <p className="results-count">{totalDecisionCards} decision card{totalDecisionCards !== 1 ? 's' : ''}</p>
                            <button onClick={() => setShowDecisionModal(true)} className="btn-primary">
                                + Create Decision Card
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">Loading decision cards...</div>
                        ) : decisionCards.length > 0 ? (
                            <div className="decisions-list">
                                {decisionCards.map((card) => (
                                    <DecisionCardView
                                        key={card.id}
                                        card={card}
                                        sprintId={sprintId}
                                        onPublish={() => fetchDecisionCards(sprintId, 1)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No decision cards yet</p>
                                <button onClick={() => setShowDecisionModal(true)} className="btn-primary">Create First Decision Card</button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Reports Tab ──────────────────────────────── */}
                {activeTab === 'Reports' && (
                    <div className="tab-content">
                        <div className="tab-toolbar">
                            <p className="results-count">{reports.length} report{reports.length !== 1 ? 's' : ''}</p>
                            <button onClick={() => setShowReportModal(true)} className="btn-primary">
                                + Add Report
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="loading-state">Loading reports...</div>
                        ) : reports.length > 0 ? (
                            <div className="reports-list">
                                {reports.map((r) => (
                                    <div
                                        key={r.id}
                                        className="report-item"
                                        onClick={() => setViewingReport(r)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <div className="report-icon">
                                            {r.file_type?.includes('pdf') ? '📄' : r.file_type?.includes('sheet') || r.file_type?.includes('excel') ? '📊' : '📝'}
                                        </div>
                                        <div className="report-info">
                                            <h4>{r.title}</h4>
                                            <span className="report-type">{r.file_type}</span>
                                            <span className="report-date">
                                                {new Date(r.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <span className="btn-secondary" style={{ pointerEvents: 'none' }}>
                                            View
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="empty-state">
                                <p>No reports yet</p>
                                <button onClick={() => setShowReportModal(true)} className="btn-primary">Add Report</button>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* ── Log Finding Modal ─────────────────────────── */}
            {showFindingModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-wide">
                        <h3>Log New Finding</h3>
                        <form onSubmit={handleCreateFinding} className="sprint-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Day *</label>
                                    <select
                                        value={findingForm.day}
                                        onChange={(e) => setFindingForm({ ...findingForm, day: parseInt(e.target.value) })}
                                    >
                                        {DAY_LABELS.map((l, i) => (
                                            <option key={i} value={i + 1}>{l}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        value={findingForm.type}
                                        onChange={(e) => setFindingForm({ ...findingForm, type: e.target.value })}
                                    >
                                        {FINDING_TYPES.map((t) => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Department</label>
                                <input
                                    value={findingForm.department}
                                    onChange={(e) => setFindingForm({ ...findingForm, department: e.target.value })}
                                    placeholder="e.g. Customer Service"
                                />
                            </div>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    required
                                    value={findingForm.title}
                                    onChange={(e) => setFindingForm({ ...findingForm, title: e.target.value })}
                                    placeholder="Brief title of the finding"
                                />
                            </div>
                            <div className="form-group">
                                <label>Brief Summary *</label>
                                <input
                                    required
                                    value={findingForm.brief_summary}
                                    onChange={(e) => setFindingForm({ ...findingForm, brief_summary: e.target.value })}
                                    placeholder="One-line summary"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description *</label>
                                <textarea
                                    required
                                    value={findingForm.description}
                                    onChange={(e) => setFindingForm({ ...findingForm, description: e.target.value })}
                                    placeholder="Detailed description of the finding"
                                    rows={4}
                                />
                            </div>
                            <div className="form-group">
                                <label>Data Source</label>
                                <input
                                    value={findingForm.data_source}
                                    onChange={(e) => setFindingForm({ ...findingForm, data_source: e.target.value })}
                                    placeholder="e.g. Day 1 workshop, Interview with John"
                                />
                            </div>
                            <div className="form-group">
                                <label>Internal Notes <span className="internal-label">🔒 Internal Only</span></label>
                                <textarea
                                    value={findingForm.internal_notes}
                                    onChange={(e) => setFindingForm({ ...findingForm, internal_notes: e.target.value })}
                                    placeholder="Private notes (not visible to client)"
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowFindingModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Log Finding'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Create Decision Card Modal ─────────────────── */}
            {showDecisionModal && (
                <div className="modal-overlay">
                    <div className="modal-content modal-wide">
                        <h3>Create Decision Card</h3>
                        <form onSubmit={handleCreateDecision} className="sprint-form">
                            <div className="form-group">
                                <label>Link to Finding (optional)</label>
                                <select
                                    value={decisionForm.finding_id}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, finding_id: e.target.value })}
                                >
                                    <option value="">— None —</option>
                                    {findings.map((f) => (
                                        <option key={f.id} value={f.id}>{f.title}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    required
                                    value={decisionForm.title}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, title: e.target.value })}
                                    placeholder="Clear, actionable decision (max 120 chars)"
                                    maxLength={120}
                                />
                            </div>
                            <div className="form-group">
                                <label>Problem *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={decisionForm.problem}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, problem: e.target.value })}
                                    placeholder="What business problem does this address?"
                                />
                            </div>
                            <div className="form-group">
                                <label>Solution *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={decisionForm.solution}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, solution: e.target.value })}
                                    placeholder="What is the proposed AI solution?"
                                />
                            </div>
                            <div className="form-group">
                                <label>Expected Outcome *</label>
                                <textarea
                                    required
                                    rows={2}
                                    value={decisionForm.expected_outcome}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, expected_outcome: e.target.value })}
                                    placeholder="What results do we expect?"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Impact (1–5): {decisionForm.impact}</label>
                                    <input
                                        type="range" min={1} max={5}
                                        value={decisionForm.impact}
                                        onChange={(e) => setDecisionForm({ ...decisionForm, impact: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Effort (1–5): {decisionForm.effort}</label>
                                    <input
                                        type="range" min={1} max={5}
                                        value={decisionForm.effort}
                                        onChange={(e) => setDecisionForm({ ...decisionForm, effort: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Priority Tier *</label>
                                <select
                                    value={decisionForm.priority_tier}
                                    onChange={(e) => setDecisionForm({ ...decisionForm, priority_tier: e.target.value })}
                                >
                                    {PRIORITY_TIERS.map((t) => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowDecisionModal(false)} className="btn-secondary">Cancel</button>
                                <button type="submit" className="btn-primary" disabled={isLoading}>
                                    {isLoading ? 'Saving...' : 'Create Card'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Document Viewer ──────────────────────────── */}
            {viewingReport && (
                <DocumentViewer report={viewingReport} sprintId={sprintId} onClose={() => setViewingReport(null)} />
            )}

            {/* ── Add Report Modal ──────────────────────────── */}
            {showReportModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add Report</h3>
                        <form onSubmit={handleCreateReport} className="sprint-form">
                            <div className="form-group">
                                <label>Title *</label>
                                <input
                                    required
                                    value={reportForm.title}
                                    onChange={(e) => setReportForm({ ...reportForm, title: e.target.value })}
                                    placeholder="e.g. Final AI Readiness Report"
                                />
                            </div>
                            <div className="form-group">
                                <label>File *</label>
                                <input
                                    required
                                    type="file"
                                    onChange={(e) => setReportForm({ ...reportForm, file: e.target.files?.[0] || null })}
                                    accept=".pdf,.docx,.xlsx,.doc,.xls"
                                    disabled={uploadProgress.jobId !== null}
                                />
                            </div>
                            {uploadProgress.jobId && (
                                <div className="form-group">
                                    <label>Upload Progress</label>
                                    <div className="progress-bar-container">
                                        <div className="progress-bar" style={{ width: `${uploadProgress.progress}%` }}></div>
                                    </div>
                                    <p className="progress-text">{uploadProgress.progress}% - {uploadProgress.status}</p>
                                </div>
                            )}
                            <div className="modal-actions">
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="btn-secondary"
                                    disabled={uploadProgress.jobId !== null}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isLoading || uploadProgress.jobId !== null}
                                >
                                    {isLoading || uploadProgress.jobId ? 'Uploading...' : 'Add Report'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
