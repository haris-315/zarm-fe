import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../context/adminStore';
import { useAuthStore } from '../context/authStore';
import { AppShell } from '../components/AppShell';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { Input, Select } from '../components/Input';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import styles from './OrganizationsList.module.css'; // Reusing similar styles

export const OrgMembersPage = () => {
    const navigate = useNavigate();
    const { user, roles } = useAuthStore();
    const {
        orgMembers,
        totalOrgMembers,
        orgMembersCurrentPage,
        orgMembersPageSize,
        orgMembersLoading,
        availablePermissions,
        error,
        fetchOrgMembers,
        fetchAvailablePermissions,
        updateOrgMember,
        removeOrgMember,
        inviteOrgMember,
        setOrgMembersPage,
        clearError,
    } = useAdminStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);

    const [inviteFormData, setInviteFormData] = useState({
        email: '',
        role: 'member',
        extra_permissions: [],
    });
    const [editFormData, setEditFormData] = useState({
        id: '',
        role: 'member',
        extra_permissions: [],
    });

    useEffect(() => {
        if (!(roles.includes('org_admin') || roles.includes('manager'))) {
            navigate('/dashboard');
            return;
        }
        fetchOrgMembers(orgMembersCurrentPage, orgMembersPageSize);
        fetchAvailablePermissions();
    }, [orgMembersCurrentPage, orgMembersPageSize, roles, navigate, fetchOrgMembers, fetchAvailablePermissions]);

    const handleRemoveMember = async (memberId) => {
        setSubmitting(true);
        try {
            await removeOrgMember(memberId);
            setDeleteConfirm(null);
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateMember = async (e) => {
        if (e) e.preventDefault();
        setSubmitting(true);
        try {
            await updateOrgMember(editFormData.id, {
                role: editFormData.role,
                extra_permissions: editFormData.extra_permissions,
            });
            setEditModalOpen(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleInviteMember = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await inviteOrgMember(inviteFormData);
            setInviteModalOpen(false);
            setInviteFormData({ email: '', role: 'member', extra_permissions: [] });
        } finally {
            setSubmitting(false);
        }
    };

    const filteredMembers = orgMembers.filter(
        (member) =>
            member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            member.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const columns = [
        { 
            key: 'email', 
            label: 'Member',
            render: (val, row) => (
                <div className={styles.orgCell}>
                    <div className={styles.logo}>
                        {row.avatar_url ? <img src={row.avatar_url} alt="" /> : val.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div style={{ fontWeight: 600 }}>{row.full_name || 'Pending Invite'}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{val}</div>
                    </div>
                </div>
            )
        },
        { key: 'role', label: 'Role', render: (val) => <Badge status="planning">{val}</Badge> },
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
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            setEditFormData({ id: row.id, role: row.role || 'member', extra_permissions: row.extra_permissions || [] });
                            setEditModalOpen(true);
                        }}
                    >
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(row.id)}>Remove</Button>
                </div>
            )
        }
    ];

    const totalPages = Math.ceil(totalOrgMembers / orgMembersPageSize);

    return (
        <AppShell 
            title="Team Members"
            actions={
                <div className={styles.topActions}>
                    <Input 
                        placeholder="Search team..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.search}
                    />
                    <Button onClick={() => setInviteModalOpen(true)}>+ Invite Member</Button>
                </div>
            }
        >
            {error && <div className={styles.error}>{error} <button onClick={clearError}>×</button></div>}

            <div className={styles.tableCard}>
                <DataTable 
                    columns={columns} 
                    data={filteredMembers} 
                    loading={orgMembersLoading}
                />
            </div>

            <div className={styles.pagination}>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={orgMembersCurrentPage === 1}
                    onClick={() => setOrgMembersPage(orgMembersCurrentPage - 1)}
                >
                    Previous
                </Button>
                <div className={styles.pageInfo}>
                    Page {orgMembersCurrentPage} of {totalPages}
                </div>
                <Button 
                    variant="secondary" 
                    size="sm" 
                    disabled={orgMembersCurrentPage === totalPages}
                    onClick={() => setOrgMembersPage(orgMembersCurrentPage + 1)}
                >
                    Next
                </Button>
            </div>

            <Modal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                title="Invite New Member"
            >
                <form onSubmit={handleInviteMember} className={styles.modalForm}>
                    <Input
                        label="Email Address"
                        type="email"
                        required
                        value={inviteFormData.email}
                        onChange={e => setInviteFormData({...inviteFormData, email: e.target.value})}
                        placeholder="colleague@company.com"
                    />
                    <Select
                        label="Role"
                        value={inviteFormData.role}
                        onChange={e => setInviteFormData({...inviteFormData, role: e.target.value})}
                        options={[
                            { label: 'Member', value: 'member' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Organization Admin', value: 'org_admin' }
                        ]}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="secondary" onClick={() => setInviteModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Send Invite</Button>
                    </div>
                </form>
            </Modal>

            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Edit Member"
            >
                <form onSubmit={handleUpdateMember} className={styles.modalForm}>
                    <Select
                        label="Role"
                        value={editFormData.role}
                        onChange={e => setEditFormData({...editFormData, role: e.target.value})}
                        options={[
                            { label: 'Member', value: 'member' },
                            { label: 'Manager', value: 'manager' },
                            { label: 'Organization Admin', value: 'org_admin' }
                        ]}
                    />
                    <div className={styles.modalFooter}>
                        <Button variant="secondary" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Save Changes</Button>
                    </div>
                </form>
            </Modal>
        </AppShell>
    );
};
