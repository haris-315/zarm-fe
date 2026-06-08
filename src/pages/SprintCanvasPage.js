import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import { sprintAPI } from '../api/sprints';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { Modal } from '../components/Modal';
import { DataTable } from '../components/DataTable';
import { DayProgress } from '../components/sprint/DayProgress';
import { MetricsBar } from '../components/sprint/MetricsBar';
import { FindingCard } from '../components/sprint/FindingCard';
import { DecisionCard } from '../components/sprint/DecisionCard';
import { DocumentViewer } from '../components/sprint/DocumentViewer';
import styles from './SprintCanvasPage.module.css';

const TABS = ['Overview', 'Findings', 'Decision Cards', 'Reports', 'Meetings'];
const DAY_LABELS = ['Discovery', 'Analysis', 'Scoring', 'Strategy', 'Delivery'];
const FINDING_TYPES = ['Problem', 'Opportunity', 'Observation'];
const PRIORITY_TIERS = ['Quick Win', 'Strategic', 'Technical Debt', 'Backlog'];

export const SprintCanvasPage = () => {
    const { sprintId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const {
        currentSprint, sprintMetrics,
        findings, totalFindings,
        decisionCards, totalDecisionCards,
        reports,
        isLoading, error,
        fetchSprint, fetchFindings, fetchDecisionCards, fetchReports,
        createFinding, createDecisionCard, createReport,
        publishDecisionCard,
        clearError,
    } = useSprintStore();

    const [activeTab, setActiveTab] = useState('Overview');
    const [dayFilter, setDayFilter] = useState(null);
    const [tabIndicatorStyle, setTabIndicatorStyle] = useState({});
    const tabRefs = useRef({});

    // Modals
    const [showFindingModal, setShowFindingModal] = useState(false);
    const [showDecisionModal, setShowDecisionModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [viewingReport, setViewingReport] = useState(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Forms
    const [findingForm, setFindingForm] = useState({
        day: 1, type: 'Problem', title: '', brief_summary: '',
        description: '', department: '', data_source: '', internal_notes: '',
    });
    const [decisionForm, setDecisionForm] = useState({
        title: '', problem: '', solution: '', expected_outcome: '',
        impact: 3, effort: 3, priority_tier: 'Quick Win', finding_id: '',
    });
    const [reportForm, setReportForm] = useState({ title: '', file: null });
    const [reportUploading, setReportUploading] = useState(false);

    useEffect(() => {
        fetchSprint(sprintId);
    }, [sprintId, fetchSprint]);

    useEffect(() => {
        if (activeTab === 'Findings') fetchFindings(sprintId, dayFilter, 1);
        if (activeTab === 'Decision Cards') fetchDecisionCards(sprintId, 1);
        if (activeTab === 'Reports') fetchReports(sprintId, 1);
        if (activeTab === 'Meetings') {
            const basePath = user?.user_type === 'super_admin' ? '/admin' : user?.organization_id ? '/org' : '/facilitator';
            navigate(`${basePath}/sprints/${sprintId}/meetings`);
        }
        
        // Update tab indicator
        const activeTabEl = tabRefs.current[activeTab];
        if (activeTabEl) {
            setTabIndicatorStyle({
                width: activeTabEl.offsetWidth - 40,
                transform: `translateX(${activeTabEl.offsetLeft + 20}px)`
            });
        }
    }, [activeTab, dayFilter, sprintId, fetchFindings, fetchDecisionCards, fetchReports]);

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

    const handlePublish = async (cardId) => {
        await publishDecisionCard(sprintId, cardId);
        fetchDecisionCards(sprintId, 1);
    };

    const handleReportFileSelected = (file) => {
        if (!file) return;
        // Pre-fill title with filename (without extension)
        const autoTitle = file.name.replace(/\.[^/.]+$/, '');
        setReportForm({ title: autoTitle, file });
        setShowReportModal(true);
    };

    const handleDropZoneClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e) => {
        handleReportFileSelected(e.target.files?.[0]);
        // Reset input so same file can be re-selected
        e.target.value = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleReportFileSelected(e.dataTransfer.files?.[0]);
    };

    const handleCreateReport = async (e) => {
        e.preventDefault();
        if (!reportForm.file) return;
        setReportUploading(true);
        try {
            await createReport(sprintId, reportForm.title, reportForm.file);
            setShowReportModal(false);
            setReportForm({ title: '', file: null });
            fetchReports(sprintId, 1);
        } catch (_) {}
        finally { setReportUploading(false); }
    };

    const reportColumns = [
        { 
            key: 'title', 
            label: 'Filename',
            render: (val, row) => (
                <div className={styles.reportName}>
                    <span className={styles.reportIcon}>
                        {row.file_type?.includes('pdf') ? '📄' : '📝'}
                    </span>
                    {val}
                </div>
            )
        },
        { 
            key: 'file_type', 
            label: 'Type',
            render: (val) => <Badge status="planning">{val?.split('/').pop()?.toUpperCase() || 'FILE'}</Badge>
        },
        { 
            key: 'created_at', 
            label: 'Uploaded',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            key: 'actions',
            label: 'Actions',
            render: (_, row) => (
                <Button variant="ghost" size="sm" onClick={() => setViewingReport(row)}>View</Button>
            )
        }
    ];

    const topBarActions = (
        <>
            <Badge status={currentSprint?.status}>{currentSprint?.status}</Badge>
            <Button variant="ghost" size="sm" icon={() => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>}>
                Advance Status
            </Button>
        </>
    );

    const sprintTitle = (
        <div className={styles.titleWrapper}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            </button>
            <div className={styles.titleInfo}>
                <h1 className={styles.pageTitle}>{currentSprint?.title}</h1>
                <DayProgress currentDay={currentSprint?.current_day} />
            </div>
        </div>
    );

    return (
        <AppShell title={sprintTitle} actions={topBarActions}>
            <MetricsBar 
                totalFindings={sprintMetrics?.total_findings} 
                totalDecisions={sprintMetrics?.total_decision_cards} 
                aiScore={sprintMetrics?.ai_readiness_score} 
            />

            <div className={styles.tabRail}>
                {TABS.map(tab => (
                    <button
                        key={tab}
                        ref={el => tabRefs.current[tab] = el}
                        className={`${styles.tab} ${activeTab === tab ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab}
                    </button>
                ))}
                <div className={styles.tabIndicator} style={tabIndicatorStyle} />
            </div>

            <div className={styles.tabContent}>
                {activeTab === 'Overview' && currentSprint && (
                    <div className={styles.overviewGrid}>
                        <div className={styles.overviewMain}>
                            <div className={styles.sectionCard}>
                                <div className={styles.sectionHeader}>
                                    <h3 className={styles.sectionTitle}>Sprint Metadata</h3>
                                    <Button variant="ghost" size="sm">Edit Sprint</Button>
                                </div>
                                <div className={styles.infoGrid}>
                                    <div className={styles.infoItem}>
                                        <label className={styles.infoLabel}>Engagement</label>
                                        <div className={styles.infoValue}>{currentSprint.engagement_name || 'Strategic Assessment'}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <label className={styles.infoLabel}>Scheduled Start</label>
                                        <div className={styles.infoValue}>{new Date(currentSprint.scheduled_start).toLocaleDateString()}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <label className={styles.infoLabel}>Scheduled End</label>
                                        <div className={styles.infoValue}>{new Date(currentSprint.scheduled_end).toLocaleDateString()}</div>
                                    </div>
                                    <div className={styles.infoItem}>
                                        <label className={styles.infoLabel}>Status</label>
                                        <div className={styles.infoValue}><Badge status={currentSprint.status}>{currentSprint.status}</Badge></div>
                                    </div>
                                </div>
                                <div className={styles.notesSection}>
                                    <label className={styles.infoLabel}>Notes</label>
                                    <p className={styles.notesText}>{currentSprint.notes || 'No additional notes.'}</p>
                                </div>
                            </div>

                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Checklist</h3>
                                <div className={styles.checklist}>
                                    <div className={styles.checkItem}>
                                        <div className={styles.checkIcon}>✓</div>
                                        <div className={styles.checkText}>Client profile configured</div>
                                    </div>
                                    <div className={styles.checkItem}>
                                        <div className={styles.checkIcon}>✓</div>
                                        <div className={styles.checkText}>5-day schedule confirmed</div>
                                    </div>
                                    <div className={styles.checkItem}>
                                        <div className={styles.checkIconEmpty} />
                                        <div className={styles.checkText}>Final report template selected</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className={styles.overviewSidebar}>
                            <div className={styles.sectionCard}>
                                <h3 className={styles.sectionTitle}>Findings by Type</h3>
                                <div className={styles.typeStats}>
                                    {['Problem', 'Opportunity', 'Observation'].map(type => {
                                        const count = sprintMetrics?.findings_by_type?.[type] || 0;
                                        const total = sprintMetrics?.total_findings || 1;
                                        const percentage = (count / total) * 100;
                                        return (
                                            <div key={type} className={styles.typeStat}>
                                                <div className={styles.typeStatHeader}>
                                                    <span className={styles.typeLabel}>{type}</span>
                                                    <span className={styles.typeValue}>{count}</span>
                                                </div>
                                                <div className={styles.progressBar}>
                                                    <div 
                                                        className={`${styles.progressFill} ${styles[type]}`} 
                                                        style={{ width: `${percentage}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'Findings' && (
                    <div className={styles.findingsTab}>
                        <div className={styles.toolbar}>
                            <div className={styles.filters}>
                                <button 
                                    className={`${styles.filterPill} ${dayFilter === null ? styles.activeFilter : ''}`}
                                    onClick={() => setDayFilter(null)}
                                >
                                    All
                                </button>
                                {[1, 2, 3, 4, 5].map(d => (
                                    <button 
                                        key={d}
                                        className={`${styles.filterPill} ${dayFilter === d ? styles.activeFilter : ''}`}
                                        onClick={() => setDayFilter(d)}
                                    >
                                        Day {d}
                                    </button>
                                ))}
                            </div>
                            <Button onClick={() => setShowFindingModal(true)}>+ New Finding</Button>
                        </div>

                        <div className={styles.stack}>
                            {findings.map(f => (
                                <FindingCard key={f.id} finding={f} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Decision Cards' && (
                    <div className={styles.decisionsTab}>
                        <div className={styles.toolbar}>
                            <div className={styles.countText}>{totalDecisionCards} Decision Cards</div>
                            <Button onClick={() => setShowDecisionModal(true)}>+ Create Decision Card</Button>
                        </div>

                        <div className={styles.grid}>
                            {decisionCards.map(card => (
                                <DecisionCard key={card.id} card={card} onPublish={() => handlePublish(card.id)} />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'Reports' && (
                    <div className={styles.reportsTab}>
                        {/* Hidden real file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx"
                            style={{ display: 'none' }}
                            onChange={handleFileInputChange}
                        />

                        <div 
                            className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''}`}
                            onClick={handleDropZoneClick}
                            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                            onDragLeave={() => setIsDragOver(false)}
                            onDrop={handleDrop}
                        >
                            <div className={styles.dropIcon}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                            </div>
                            <div className={styles.dropText}>
                                Drag PDF, Word, or Excel here or <span className={styles.accentText}>browse</span>
                            </div>
                            <div className={styles.dropHint}>Supported: .pdf .doc .docx .xls .xlsx</div>
                        </div>

                        <div className={styles.sectionCard}>
                            <DataTable 
                                columns={reportColumns} 
                                data={reports} 
                                loading={isLoading}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            <Modal
                isOpen={showFindingModal}
                onClose={() => setShowFindingModal(false)}
                title="Log New Finding"
                size="md"
            >
                <form onSubmit={handleCreateFinding} className={styles.form}>
                    <div className={styles.formRow}>
                        <Select
                            label="Day"
                            value={findingForm.day}
                            onChange={e => setFindingForm({...findingForm, day: parseInt(e.target.value)})}
                            options={DAY_LABELS.map((l, i) => ({ label: `Day ${i+1}: ${l}`, value: i + 1 }))}
                        />
                        <Select
                            label="Type"
                            value={findingForm.type}
                            onChange={e => setFindingForm({...findingForm, type: e.target.value})}
                            options={FINDING_TYPES.map(t => ({ label: t, value: t }))}
                        />
                    </div>
                    <Input
                        label="Department"
                        value={findingForm.department}
                        onChange={e => setFindingForm({...findingForm, department: e.target.value})}
                        placeholder="e.g. Customer Service"
                    />
                    <Input
                        label="Title"
                        required
                        value={findingForm.title}
                        onChange={e => setFindingForm({...findingForm, title: e.target.value})}
                        placeholder="Brief title"
                    />
                    <Input
                        label="Brief Summary"
                        required
                        value={findingForm.brief_summary}
                        onChange={e => setFindingForm({...findingForm, brief_summary: e.target.value})}
                        placeholder="One-line summary"
                    />
                    <Input
                        label="Description"
                        type="textarea"
                        required
                        value={findingForm.description}
                        onChange={e => setFindingForm({...findingForm, description: e.target.value})}
                        placeholder="Detailed description"
                    />
                    <div className={styles.modalActions}>
                        <Button variant="secondary" onClick={() => setShowFindingModal(false)}>Cancel</Button>
                        <Button type="submit">Log Finding</Button>
                    </div>
                </form>
            </Modal>

            {/* Decision Card Modal */}
            <Modal
                isOpen={showDecisionModal}
                onClose={() => setShowDecisionModal(false)}
                title="Create Decision Card"
                size="lg"
            >
                <form onSubmit={handleCreateDecision} className={styles.form}>
                    <Input
                        label="Title *"
                        required
                        value={decisionForm.title}
                        onChange={e => setDecisionForm({...decisionForm, title: e.target.value})}
                        placeholder="Decision title"
                    />
                    <Input
                        label="Problem Statement"
                        type="textarea"
                        value={decisionForm.problem}
                        onChange={e => setDecisionForm({...decisionForm, problem: e.target.value})}
                        placeholder="What problem does this address?"
                    />
                    <Input
                        label="Proposed Solution"
                        type="textarea"
                        value={decisionForm.solution}
                        onChange={e => setDecisionForm({...decisionForm, solution: e.target.value})}
                        placeholder="Recommended action"
                    />
                    <Input
                        label="Expected Outcome"
                        type="textarea"
                        value={decisionForm.expected_outcome}
                        onChange={e => setDecisionForm({...decisionForm, expected_outcome: e.target.value})}
                        placeholder="What results are expected?"
                    />
                    <div className={styles.formRow}>
                        <Select
                            label="Priority Tier"
                            value={decisionForm.priority_tier}
                            onChange={e => setDecisionForm({...decisionForm, priority_tier: e.target.value})}
                            options={PRIORITY_TIERS.map(t => ({ label: t, value: t }))}
                        />
                        <Select
                            label="Impact (1–5)"
                            value={decisionForm.impact}
                            onChange={e => setDecisionForm({...decisionForm, impact: e.target.value})}
                            options={[1,2,3,4,5].map(n => ({ label: String(n), value: n }))}
                        />
                        <Select
                            label="Effort (1–5)"
                            value={decisionForm.effort}
                            onChange={e => setDecisionForm({...decisionForm, effort: e.target.value})}
                            options={[1,2,3,4,5].map(n => ({ label: String(n), value: n }))}
                        />
                    </div>
                    <div className={styles.modalActions}>
                        <Button variant="secondary" type="button" onClick={() => setShowDecisionModal(false)}>Cancel</Button>
                        <Button type="submit">Create Card</Button>
                    </div>
                </form>
            </Modal>

            {/* Report Upload Modal */}
            <Modal
                isOpen={showReportModal}
                onClose={() => { setShowReportModal(false); setReportForm({ title: '', file: null }); }}
                title="Upload Report"
            >
                <form onSubmit={handleCreateReport} className={styles.form}>
                    {reportForm.file && (
                        <div className={styles.selectedFile}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                            <span>{reportForm.file.name}</span>
                            <span className={styles.fileSize}>({(reportForm.file.size / 1024).toFixed(1)} KB)</span>
                        </div>
                    )}
                    <Input
                        label="Report Title *"
                        required
                        value={reportForm.title}
                        onChange={e => setReportForm({...reportForm, title: e.target.value})}
                        placeholder="e.g. AI Readiness Assessment — Q2 2025"
                    />
                    {!reportForm.file && (
                        <div className={styles.filePickerRow}>
                            <Button
                                variant="secondary"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Choose File
                            </Button>
                            <span className={styles.noFileText}>No file selected</span>
                        </div>
                    )}
                    <div className={styles.modalActions}>
                        <Button variant="secondary" type="button" onClick={() => { setShowReportModal(false); setReportForm({ title: '', file: null }); }}>Cancel</Button>
                        <Button type="submit" loading={reportUploading} disabled={!reportForm.file}>Upload Report</Button>
                    </div>
                </form>
            </Modal>

            {viewingReport && (
                <DocumentViewer 
                    report={viewingReport} 
                    sprintId={sprintId} 
                    onClose={() => setViewingReport(null)} 
                />
            )}
        </AppShell>
    );
};
