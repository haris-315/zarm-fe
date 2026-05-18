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
import styles from './OrganizationsList.module.css';

export const OrganizationsList = () => {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const {
        organizations,
        totalOrganizations,
        orgCurrentPage,
        orgPageSize,
        isLoading,
        error,
        fetchOrganizations,
        setOrgPage,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [actionConfirm, setActionConfirm] = useState(null);
    const [rejectConfirm, setRejectConfirm] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    useEffect(() => {
        fetchOrganizations(orgCurrentPage, orgPageSize);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orgCurrentPage]);

    const handleToggleStatus = async (orgId, currentStatus) => {
        try {
            const { activateOrganization, suspendOrganization, approveOrganization } = useAdminStore.getState();
            if (currentStatus === 'active') {
                await suspendOrganization(orgId);
            } else if (currentStatus === 'pending' || currentStatus === 'rejected') {
                await approveOrganization(orgId);
            } else {
                await activateOrganization(orgId);
            }
            setActionConfirm(null);
        } catch (err) {
            console.error('Failed to change organization status:', err);
        }
    };

    const handleReject = async () => {
        if (!rejectConfirm) return;
        try {
            const { rejectOrganization } = useAdminStore.getState();
            await rejectOrganization(rejectConfirm, rejectReason);
            setRejectConfirm(null);
            setRejectReason('');
        } catch (err) {
            console.error('Failed to reject organization:', err);
        }
    };

    const filteredOrganizations = organizations.filter(
        (org) =>
            org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            org.industry?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'name', 
            label: 'Organization',
            render: (val, row) => (
                <div className={styles.orgCell}>
                    <div className={styles.logo}>
                        {row.logo_url ? <img src={row.logo_url} alt="" /> : val.charAt(0)}
                    </div>
                    <strong>{val}</strong>
                </div>
            )
        },
        { key: 'industry', label: 'Industry', render: (val) => val || '—' },
        { key: 'primary_contact_name', label: 'Contact', render: (val) => val || '—' },
        { 
            key: 'status', 
            label: 'Status', 
            render: (val) => <Badge status={val}>{val}</Badge> 
        },
        { 
            key: 'actions', 
            label: 'Actions',
            width: '200px',
            render: (_, row) => (
                <div className={styles.actions}>
                    <Link to={`/admin/organizations/${row.id}`}>
                        <Button variant="ghost" size="sm" title="View Detail">View</Button>
                    </Link>
                    <Link to={`/admin/organizations/${row.id}/sprints`}>
                        <Button variant="ghost" size="sm" title="Sprints">Sprints</Button>
                    </Link>
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setActionConfirm({ orgId: row.id, currentStatus: row.status })}
                    >
                        {row.status === 'active' ? 'Suspend' : 'Approve'}
                    </Button>
                </div>
            )
        }
    ];

    const totalPages = Math.ceil(totalOrganizations / orgPageSize);

    return (
        <AppShell 
            title="Organizations"
            actions={
                <div className={styles.topActions}>
                    <Input 
                        placeholder="Search organizations..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                </div>
            }
        >
            {error && <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>}

            <div className={styles.tableCard}>
                <DataTable 
                    columns={columns} 
                    data={filteredOrganizations} 
                    loading={isLoading}
                    onRowClick={(row) => navigate(`/admin/organizations/${row.id}`)}
                />
            </div>

            <div className={styles.pagination}>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={orgCurrentPage === 1}
                    onClick={() => setOrgPage(orgCurrentPage - 1)}
                >
                    Previous
                </Button>
                <div className={styles.pageInfo}>
                    Page {orgCurrentPage} of {totalPages}
                </div>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={orgCurrentPage === totalPages}
                    onClick={() => setOrgPage(orgCurrentPage + 1)}
                >
                    Next
                </Button>
            </div>

            <Modal
                isOpen={!!actionConfirm}
                onClose={() => setActionConfirm(null)}
                title={actionConfirm?.currentStatus === 'active' ? 'Suspend Organization?' : 'Approve Organization?'}
            >
                <p>Are you sure you want to {actionConfirm?.currentStatus === 'active' ? 'suspend' : 'approve'} this organization?</p>
                <div className={styles.modalFooter}>
                    <Button variant="secondary" onClick={() => setActionConfirm(null)}>Cancel</Button>
                    <Button 
                        variant={actionConfirm?.currentStatus === 'active' ? 'danger' : 'primary'}
                        onClick={() => handleToggleStatus(actionConfirm.orgId, actionConfirm.currentStatus)}
                    >
                        {actionConfirm?.currentStatus === 'active' ? 'Suspend' : 'Approve'}
                    </Button>
                </div>
            </Modal>
        </AppShell>
    );
};
