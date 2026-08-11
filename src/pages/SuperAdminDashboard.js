import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { StatCard } from '../components/StatCard';
import { DataTable } from '../components/DataTable';
import { Input } from '../components/Input';
import { cohortAPI } from '../api';
import styles from './SuperAdminDashboard.module.css';

export const SuperAdminDashboard = () => {
    const navigate = useNavigate();
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

    const [cohortMembers, setCohortMembers] = useState([]);
    const [activeCohort, setActiveCohort] = useState(null);
    const [newCohortName, setNewCohortName] = useState('');
    const [newCohortStartTime, setNewCohortStartTime] = useState('');
    const [newCohortBotInstructions, setNewCohortBotInstructions] = useState('');
    const [selectedConsultants, setSelectedConsultants] = useState([]);
    const [isEditingConsultants, setIsEditingConsultants] = useState(false);
    const [updatingConsultants, setUpdatingConsultants] = useState(false);
    const [submittingCohort, setSubmittingCohort] = useState(false);
    const [localError, setLocalError] = useState('');

    const loadCohorts = async () => {
        try {
            setLocalError('');
            const list = await cohortAPI.listCohorts();
            
            // Find scheduled or active cohort
            const activeOrScheduled = list.find(c => c.status === 'SCHEDULED' || c.status === 'ACTIVE');
            if (activeOrScheduled) {
                const detail = await cohortAPI.getCohortDetail(activeOrScheduled.id);
                setActiveCohort(detail);
                const members = await cohortAPI.listCohortMembers(activeOrScheduled.id);
                setCohortMembers(members);
            } else {
                setActiveCohort(null);
                setCohortMembers([]);
            }
        } catch (err) {
            console.error('Failed to load cohorts:', err);
            setLocalError('Failed to load cohorts info.');
        }
    };

    useEffect(() => {
        fetchFacilitators();
        fetchOrganizations(1, 100);
        loadCohorts();
        // ProtectedRoute already guards this route — no auth check needed here.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleCreateCohort = async (e) => {
        e.preventDefault();
        if (!newCohortName || !newCohortStartTime) return;
        setSubmittingCohort(true);
        setLocalError('');
        try {
            const cohort = await cohortAPI.createCohort({
                name: newCohortName,
                start_time: new Date(newCohortStartTime).toISOString(),
                bot_instructions: newCohortBotInstructions || null,
            });
            if (selectedConsultants.length > 0) {
                await cohortAPI.assignConsultants(cohort.id, { user_ids: selectedConsultants });
            }
            setNewCohortName('');
            setNewCohortStartTime('');
            setNewCohortBotInstructions('');
            setSelectedConsultants([]);
            await loadCohorts();
        } catch (err) {
            setLocalError(err.response?.data?.detail || 'Failed to schedule cohort. Ensure no other cohort is currently scheduled or active.');
        } finally {
            setSubmittingCohort(false);
        }
    };

    const handleApproveMember = async (memberId) => {
        if (!activeCohort) return;
        try {
            await cohortAPI.approveMember(activeCohort.id, memberId);
            await loadCohorts();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to approve member.');
        }
    };

    const handleRejectMember = async (memberId) => {
        if (!activeCohort) return;
        const reason = prompt('Please enter a rejection reason (optional):');
        if (reason === null) return; // Cancelled
        try {
            await cohortAPI.rejectMember(activeCohort.id, memberId, reason || undefined);
            await loadCohorts();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to reject member.');
        }
    };

    const handleToggleConsultant = (id) => {
        setSelectedConsultants(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleEditConsultantsToggle = () => {
        if (isEditingConsultants) {
            setIsEditingConsultants(false);
        } else {
            const currentIds = activeCohort.consultants?.map(c => c.user_id) || [];
            setSelectedConsultants(currentIds);
            setIsEditingConsultants(true);
        }
    };

    const handleUpdateConsultants = async () => {
        if (!activeCohort) return;
        setUpdatingConsultants(true);
        try {
            await cohortAPI.assignConsultants(activeCohort.id, { user_ids: selectedConsultants });
            setIsEditingConsultants(false);
            await loadCohorts();
        } catch (err) {
            alert(err.response?.data?.detail || 'Failed to update assigned consultants.');
        } finally {
            setUpdatingConsultants(false);
        }
    };

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

            {localError && <div className={styles.error}>{localError}</div>}

            {/* Cohort Management Section */}
            <div className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>Cohort Assessment Management</h3>
                </div>

                {activeCohort ? (
                    <div className={styles.cohortCard}>
                        <div className={styles.cohortHeader}>
                            <div>
                                <h4 className={styles.cohortName}>{activeCohort.name}</h4>
                                <div className={styles.cohortMeta}>
                                    Scheduled Start: <strong>{new Date(activeCohort.start_time).toLocaleString()}</strong>
                                </div>
                            </div>
                            <Badge status={activeCohort.status === 'ACTIVE' ? 'complete' : 'planning'}>
                                {activeCohort.status}
                            </Badge>
                        </div>

                        {/* Details Grid: Bot Instructions & Assigned Consultants */}
                        <div className={styles.detailsSection}>
                            <div className={styles.instructionsBlock}>
                                <h5 className={styles.blockTitle}>Bot Instructions / Description</h5>
                                {activeCohort.bot_instructions ? (
                                    <p className={styles.instructionsText}>{activeCohort.bot_instructions}</p>
                                ) : (
                                    <p className={styles.emptyText}>No instructions configured for this cohort.</p>
                                )}
                            </div>

                            <div className={styles.consultantsBlock}>
                                <h5 className={styles.blockTitle}>
                                    Assigned Consultants
                                    <button 
                                        onClick={handleEditConsultantsToggle} 
                                        className={styles.editConsultantsBtn}
                                    >
                                        {isEditingConsultants ? 'Cancel' : 'Manage'}
                                    </button>
                                </h5>

                                {isEditingConsultants ? (
                                    <div className={styles.consultantsChecklistContainer}>
                                        <div className={styles.consultantsGrid}>
                                            {facilitators.map(f => (
                                                <label key={f.id} className={styles.checkboxItem}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedConsultants.includes(f.id)}
                                                        onChange={() => handleToggleConsultant(f.id)}
                                                    />
                                                    <span className={styles.checkboxText}>
                                                        <strong>{f.full_name || 'N/A'}</strong>
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                        <div className={styles.inlineEditActions}>
                                            <Button 
                                                size="sm" 
                                                onClick={handleUpdateConsultants} 
                                                loading={updatingConsultants}
                                            >
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.consultantList}>
                                        {activeCohort.consultants?.length === 0 ? (
                                            <p className={styles.emptyText}>No consultants assigned yet.</p>
                                        ) : (
                                            activeCohort.consultants?.map(c => {
                                                const profile = facilitators.find(f => f.id === c.user_id);
                                                return (
                                                    <div key={c.user_id} className={styles.consultantItem}>
                                                        <span className={styles.consultantDot} />
                                                        <span>{profile?.full_name || 'Assigned User'} ({profile?.email || c.user_id})</span>
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className={styles.memberSection}>
                            <h5 className={styles.subTitle}>Registered Members Queue</h5>
                            {cohortMembers.length === 0 ? (
                                <p className={styles.emptyMembers}>No signups registered for this cohort yet.</p>
                            ) : (
                                <div className={styles.membersTableWrapper}>
                                    <table className={styles.membersTable}>
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cohortMembers.map((m) => (
                                                <tr key={m.id}>
                                                    <td>{m.user?.full_name || '—'}</td>
                                                    <td>{m.user?.email || '—'}</td>
                                                    <td>{m.user?.phone_number || '—'}</td>
                                                    <td>
                                                        <Badge status={
                                                            m.status?.toLowerCase() === 'approved' ? 'complete' :
                                                            m.status?.toLowerCase() === 'rejected' ? 'suspended' : 'planning'
                                                        }>
                                                            {m.status?.toUpperCase()}
                                                        </Badge>
                                                    </td>
                                                    <td>
                                                        {m.status?.toLowerCase() === 'pending' && (
                                                            <div className={styles.actionButtons}>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="secondary"
                                                                    style={{ background: 'var(--success-subtle)', color: 'var(--success)', border: 'none' }}
                                                                    onClick={() => handleApproveMember(m.id)}
                                                                >
                                                                    Approve
                                                                </Button>
                                                                <Button 
                                                                    size="sm" 
                                                                    variant="ghost"
                                                                    style={{ color: 'var(--danger)' }}
                                                                    onClick={() => handleRejectMember(m.id)}
                                                                >
                                                                    Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                        {m.status?.toLowerCase() === 'approved' && (
                                                            <span className={styles.accessCodeLabel}>
                                                                Code: <code>{m.access_code}</code>
                                                            </span>
                                                        )}
                                                        {m.status?.toLowerCase() === 'rejected' && (
                                                            <span className={styles.rejectedLabel}>Rejected</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.noCohortCard}>
                        <div className={styles.noCohortInfo}>
                            <p>There is currently no scheduled or active cohort assessment.</p>
                            <p className={styles.mutedText}>Create a new cohort below. Note that only one cohort can be scheduled or active at a time.</p>
                        </div>
                        <form onSubmit={handleCreateCohort} className={styles.createCohortForm}>
                            <div className={styles.formGrid}>
                                <Input
                                    label="Cohort Name"
                                    placeholder="e.g. Autumn 2026 Batch"
                                    value={newCohortName}
                                    onChange={(e) => setNewCohortName(e.target.value)}
                                    required
                                    disabled={submittingCohort}
                                />
                                <Input
                                    label="Start Date and Time"
                                    type="datetime-local"
                                    value={newCohortStartTime}
                                    onChange={(e) => setNewCohortStartTime(e.target.value)}
                                    required
                                    disabled={submittingCohort}
                                />
                            </div>
                            <Input
                                label="Bot Instructions / Description"
                                type="textarea"
                                placeholder="Enter instructions or description for the AI facilitator agent..."
                                value={newCohortBotInstructions}
                                onChange={(e) => setNewCohortBotInstructions(e.target.value)}
                                disabled={submittingCohort}
                                rows={3}
                            />
                            
                            <div className={styles.consultantsChecklistContainer}>
                                <label className={styles.checkboxLabel}>Assign Facilitators / Consultants</label>
                                <div className={styles.consultantsGrid}>
                                    {facilitators.map(f => (
                                        <label key={f.id} className={styles.checkboxItem}>
                                            <input
                                                type="checkbox"
                                                checked={selectedConsultants.includes(f.id)}
                                                onChange={() => handleToggleConsultant(f.id)}
                                            />
                                            <span className={styles.checkboxText}>
                                                <strong>{f.full_name || 'N/A'}</strong> ({f.email})
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" loading={submittingCohort} className={styles.submitBtn}>
                                Schedule Cohort
                            </Button>
                        </form>
                    </div>
                )}
            </div>

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
