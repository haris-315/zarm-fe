import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import styles from './FacilitatorDetail.module.css';

export const FacilitatorDetail = () => {
    const navigate = useNavigate();
    const { facilitatorId } = useParams();
    const { user, roles } = useAuthStore();
    const { selectedFacilitator, isLoading, error, fetchFacilitator, clearSelectedFacilitator } =
        useAdminStore();

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }

        if (facilitatorId) {
            fetchFacilitator(facilitatorId);
        }

        return () => {
            clearSelectedFacilitator();
        };
    }, [facilitatorId, roles, user?.user_type, navigate, fetchFacilitator, clearSelectedFacilitator]);

    const breadcrumbs = (
        <div className={styles.breadcrumbs}>
            <Link to="/admin/facilitators">Facilitators</Link>
            <span>/</span>
            <span>{selectedFacilitator?.full_name || selectedFacilitator?.email || 'Detail'}</span>
        </div>
    );

    return (
        <AppShell
            title={breadcrumbs}
            actions={
                selectedFacilitator && (
                    <Link to={`/admin/facilitators/${facilitatorId}/edit`}>
                        <Button>Edit Facilitator</Button>
                    </Link>
                )
            }
        >
            {error && <div className={styles.error}>{error}</div>}

            {isLoading ? (
                <div className={styles.loading}>Loading facilitator details...</div>
            ) : selectedFacilitator ? (
                <div className={styles.container}>
                    <div className={styles.headerCard}>
                        <div className={styles.avatar}>
                            {selectedFacilitator.avatar_url
                                ? <img src={selectedFacilitator.avatar_url} alt="" />
                                : (selectedFacilitator.full_name || selectedFacilitator.email || 'F').charAt(0).toUpperCase()
                            }
                        </div>
                        <div className={styles.headerInfo}>
                            <h1 className={styles.name}>{selectedFacilitator.full_name || 'Unnamed'}</h1>
                            <div className={styles.meta}>
                                <span className={styles.email}>{selectedFacilitator.email}</span>
                                <Badge status={selectedFacilitator.status}>{selectedFacilitator.status}</Badge>
                            </div>
                        </div>
                    </div>

                    <div className={styles.infoCard}>
                        <h3 className={styles.sectionTitle}>Profile</h3>
                        <div className={styles.infoGrid}>
                            <div className={styles.infoItem}>
                                <label>Title</label>
                                <div>{selectedFacilitator.title || '—'}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label>User Type</label>
                                <div>{selectedFacilitator.user_type}</div>
                            </div>
                            <div className={styles.infoItem}>
                                <label>Status</label>
                                <div><Badge status={selectedFacilitator.status}>{selectedFacilitator.status}</Badge></div>
                            </div>
                            <div className={styles.infoItem}>
                                <label>ID</label>
                                <div className={styles.mono}>{selectedFacilitator.id}</div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={styles.empty}>Facilitator not found</div>
            )}
        </AppShell>
    );
};
