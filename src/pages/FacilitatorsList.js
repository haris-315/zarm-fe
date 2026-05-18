import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import styles from './OrganizationsList.module.css'; // Reusing similar styles

export const FacilitatorsList = () => {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const {
        facilitators,
        totalFacilitators,
        currentPage,
        pageSize,
        isLoading,
        error,
        fetchFacilitators,
        setPage,
        disableFacilitator,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        if (!(roles.includes('super_admin') || user?.user_type === 'super_admin')) {
            navigate('/dashboard');
            return;
        }
        fetchFacilitators(currentPage, pageSize);
    }, [currentPage, pageSize, roles, user?.user_type, navigate, fetchFacilitators]);

    const handleDisable = async (facilitatorId) => {
        try {
            await disableFacilitator(facilitatorId);
            setDeleteConfirm(null);
        } catch (err) {
            console.error('Failed to disable facilitator:', err);
        }
    };

    const filteredFacilitators = facilitators.filter(
        (c) =>
            c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'email', 
            label: 'Facilitator',
            render: (val, row) => (
                <div className={styles.orgCell}>
                    <div className={styles.logo}>
                        {row.avatar_url ? <img src={row.avatar_url} alt="" /> : val.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{row.full_name || 'No Name'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{val}</div>
                    </div>
                </div>
            )
        },
        { key: 'title', label: 'Title', render: (val) => val || '—' },
        { 
            key: 'status', 
            label: 'Status', 
            render: (val) => <Badge status={val}>{val}</Badge> 
        },
        { 
            key: 'actions', 
            label: 'Actions',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Link to={`/admin/facilitators/${row.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                    </Link>
                    <Link to={`/admin/facilitators/${row.id}/edit`}>
                        <Button variant="ghost" size="sm">Edit</Button>
                    </Link>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(row.id)}>Disable</Button>
                </div>
            )
        }
    ];

    const totalPages = Math.ceil(totalFacilitators / pageSize);

    return (
        <AppShell 
            title="Facilitators"
            actions={
                <div className={styles.topActions}>
                    <Input 
                        placeholder="Search facilitators..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <Button onClick={() => navigate('/admin/facilitators/new')}>+ New Facilitator</Button>
                </div>
            }
        >
            {error && <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>}

            <div className={styles.tableCard}>
                <DataTable 
                    columns={columns} 
                    data={filteredFacilitators} 
                    loading={isLoading}
                    onRowClick={(row) => navigate(`/admin/facilitators/${row.id}`)}
                />
            </div>

            <div className={styles.pagination}>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={currentPage === 1}
                    onClick={() => setPage(currentPage - 1)}
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
                    onClick={() => setPage(currentPage + 1)}
                >
                    Next
                </Button>
            </div>

            <Modal
                isOpen={!!deleteConfirm}
                onClose={() => setDeleteConfirm(null)}
                title="Disable Facilitator?"
            >
                <p>Are you sure you want to disable this facilitator account? They will no longer be able to log in.</p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
                    <Button variant="danger" onClick={() => handleDisable(deleteConfirm)}>Disable Account</Button>
                </div>
            </Modal>
        </AppShell>
    );
};
