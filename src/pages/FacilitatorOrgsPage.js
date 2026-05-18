import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import { useSprintStore } from '../context/sprintStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Input } from '../components/Input';
import styles from './FacilitatorOrgsPage.module.css';

export const FacilitatorOrgsPage = () => {
    const navigate = useNavigate();
    const { organizations, isLoading, error, fetchOrganizations, clearError } = useSprintStore();
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchOrganizations(1);
    }, [fetchOrganizations]);

    const filtered = organizations.filter((org) =>
        org.name?.toLowerCase().includes(search.toLowerCase()) ||
        org.industry?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <AppShell
            title="Client Organizations"
            actions={
                <Input
                    placeholder="Search organizations..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className={styles.search}
                />
            }
        >
            {error && (
                <div className={styles.error}>
                    {error}
                    <button onClick={clearError}>×</button>
                </div>
            )}

            {isLoading ? (
                <div className={styles.loading}>Loading organizations...</div>
            ) : filtered.length > 0 ? (
                <div className={styles.grid}>
                    {filtered.map((org) => (
                        <div
                            key={org.id}
                            className={styles.card}
                            onClick={() => navigate(`/facilitator/organizations/${org.id}/sprints`)}
                        >
                            <div className={styles.cardLogo}>
                                {org.logo_url ? (
                                    <img src={org.logo_url} alt={org.name} />
                                ) : (
                                    <span className={styles.initials}>
                                        {org.name?.charAt(0).toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div className={styles.cardInfo}>
                                <div className={styles.cardName}>{org.name}</div>
                                <div className={styles.cardMeta}>
                                    {org.industry || 'General'}
                                    {org.headcount && <> · {org.headcount} people</>}
                                </div>
                            </div>
                            <div className={styles.cardRight}>
                                <Badge status={org.status}>{org.status}</Badge>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className={styles.empty}>
                    <p>No organizations found</p>
                </div>
            )}
        </AppShell>
    );
};
