import { create } from 'zustand';
import { facilitatorAPI } from '../api/facilitators';
import { organizationAPI } from '../api/organizations';
import { orgMembersAPI } from '../api/orgMembers';
import { rolesAPI } from '../api/roles';
import { useAuthStore } from './authStore';

const extractError = (error) => {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) {
        return detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
    }
    if (typeof detail === 'string') return detail;
    return error.message || 'An unexpected error occurred';
};

export const useAdminStore = create((set, get) => ({
    // Facilitators state
    facilitators: [],
    selectedFacilitator: null,
    totalFacilitators: 0,
    currentPage: 1,
    pageSize: 20,
    isLoading: false,
    error: null,

    // Fetch facilitators list
    fetchFacilitators: async (page = 1, pageSize = 20) => {
        set({ isLoading: true, error: null });
        try {
            const response = await facilitatorAPI.listFacilitators(page, pageSize);
            set({
                facilitators: response.items,
                totalFacilitators: response.total,
                currentPage: response.page,
                pageSize: response.page_size,
                isLoading: false,
            });
            return response;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Fetch single facilitator
    fetchFacilitator: async (facilitatorId) => {
        set({ isLoading: true, error: null });
        try {
            const facilitator = await facilitatorAPI.getFacilitator(facilitatorId);
            set({ selectedFacilitator: facilitator, isLoading: false });
            return facilitator;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Create facilitator
    createFacilitator: async (facilitatorData) => {
        set({ isLoading: true, error: null });
        try {
            const newFacilitator = await facilitatorAPI.createFacilitator(facilitatorData);
            set((state) => ({
                facilitators: [newFacilitator, ...state.facilitators],
                totalFacilitators: state.totalFacilitators + 1,
                isLoading: false,
            }));
            return newFacilitator;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Update facilitator
    updateFacilitator: async (facilitatorId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedFacilitator = await facilitatorAPI.updateFacilitator(
                facilitatorId,
                updateData
            );
            set((state) => ({
                facilitators: state.facilitators.map((c) =>
                    c.id === facilitatorId ? updatedFacilitator : c
                ),
                selectedFacilitator:
                    state.selectedFacilitator?.id === facilitatorId
                        ? updatedFacilitator
                        : state.selectedFacilitator,
                isLoading: false,
            }));
            return updatedFacilitator;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Disable facilitator
    disableFacilitator: async (facilitatorId) => {
        set({ isLoading: true, error: null });
        try {
            const disabledFacilitator = await facilitatorAPI.disableFacilitator(facilitatorId);
            set((state) => ({
                facilitators: state.facilitators.map((c) =>
                    c.id === facilitatorId ? disabledFacilitator : c
                ),
                totalFacilitators: state.totalFacilitators - 1,
                isLoading: false,
            }));
            return disabledFacilitator;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set page
    setPage: (page) => set({ currentPage: page }),

    // Logo upload
    updateOrgLogo: async (file) => {
        set({ isLoading: true, error: null });
        try {
            const response = await organizationAPI.updateMyOrgLogo(file);
            
            // If it's a background job response, don't overwrite the state
            if (response.message && !response.id) {
                set({ isLoading: false });
                return response;
            }

            const updatedOrg = response;
            
            // Sync with auth store
            const authStore = useAuthStore.getState();
            if (authStore.organization?.id === updatedOrg.id) {
                authStore.setOrganization(updatedOrg);
            }

            set((state) => ({
                selectedOrganization: updatedOrg,
                organizations: state.organizations.map((org) =>
                    org.id === updatedOrg.id ? updatedOrg : org
                ),
                isLoading: false,
            }));
            return updatedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    updateOrgLogoBySuperAdmin: async (orgId, file) => {
        set({ isLoading: true, error: null });
        try {
            const response = await organizationAPI.updateLogo(orgId, file);

            // If it's a background job response, don't overwrite the state
            if (response.message && !response.id) {
                set({ isLoading: false });
                return response;
            }

            const updatedOrg = response;

            // Sync with auth store
            const authStore = useAuthStore.getState();
            if (authStore.organization?.id === orgId) {
                authStore.setOrganization(updatedOrg);
            }

            set((state) => ({
                selectedOrganization: updatedOrg,
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? updatedOrg : org
                ),
                isLoading: false,
            }));
            return updatedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Clear error
    clearError: () => set({ error: null }),

    // Clear selected facilitator
    clearSelectedFacilitator: () => set({ selectedFacilitator: null }),

    // Organizations state
    organizations: [],
    selectedOrganization: null,
    organizationMembers: [],
    totalOrganizations: 0,
    orgCurrentPage: 1,
    orgPageSize: 20,
    totalMembers: 0,
    membersCurrentPage: 1,
    membersPageSize: 20,
    membersLoading: false,

    // Fetch organizations list
    fetchOrganizations: async (page = 1, pageSize = 20) => {
        set({ isLoading: true, error: null });
        try {
            const response = await organizationAPI.listOrganizations(page, pageSize);
            set({
                organizations: response.items,
                totalOrganizations: response.total,
                orgCurrentPage: response.page,
                orgPageSize: response.page_size,
                isLoading: false,
            });
            return response;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Fetch single organization
    fetchOrganization: async (orgId) => {
        set({ isLoading: true, error: null });
        try {
            const organization = await organizationAPI.getOrganization(orgId);
            set({ selectedOrganization: organization, isLoading: false });
            return organization;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Update organization
    updateOrganization: async (orgId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedOrg = await organizationAPI.updateOrganization(orgId, updateData);
            set((state) => ({
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? updatedOrg : org
                ),
                selectedOrganization:
                    state.selectedOrganization?.id === orgId ? updatedOrg : state.selectedOrganization,
                isLoading: false,
            }));
            return updatedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Suspend organization
    suspendOrganization: async (orgId) => {
        set({ isLoading: true, error: null });
        try {
            const suspendedOrg = await organizationAPI.suspendOrganization(orgId);
            set((state) => ({
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? suspendedOrg : org
                ),
                selectedOrganization:
                    state.selectedOrganization?.id === orgId ? suspendedOrg : state.selectedOrganization,
                isLoading: false,
            }));
            return suspendedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Activate organization
    activateOrganization: async (orgId) => {
        set({ isLoading: true, error: null });
        try {
            const activatedOrg = await organizationAPI.activateOrganization(orgId);
            set((state) => ({
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? activatedOrg : org
                ),
                selectedOrganization:
                    state.selectedOrganization?.id === orgId ? activatedOrg : state.selectedOrganization,
                isLoading: false,
            }));
            return activatedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Approve organization
    approveOrganization: async (orgId) => {
        set({ isLoading: true, error: null });
        try {
            const approvedOrg = await organizationAPI.approveOrganization(orgId);
            set((state) => ({
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? approvedOrg : org
                ),
                selectedOrganization:
                    state.selectedOrganization?.id === orgId ? approvedOrg : state.selectedOrganization,
                isLoading: false,
            }));
            return approvedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Reject organization
    rejectOrganization: async (orgId, reason) => {
        set({ isLoading: true, error: null });
        try {
            const rejectedOrg = await organizationAPI.rejectOrganization(orgId, reason);
            set((state) => ({
                organizations: state.organizations.map((org) =>
                    org.id === orgId ? rejectedOrg : org
                ),
                selectedOrganization:
                    state.selectedOrganization?.id === orgId ? rejectedOrg : state.selectedOrganization,
                isLoading: false,
            }));
            return rejectedOrg;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Fetch organization members
    fetchOrganizationMembers: async (orgId, page = 1, pageSize = 20) => {
        set({ membersLoading: true, error: null });
        try {
            if (!orgId) {
                throw new Error('Organization ID is required');
            }
            const response = await organizationAPI.listMembers(orgId, page, pageSize);
            set({
                organizationMembers: response.items,
                totalMembers: response.total,
                membersCurrentPage: response.page,
                membersPageSize: response.page_size,
                membersLoading: false,
            });
            return response;
        } catch (error) {
            const errorMessage = extractError(error) || error.toString();
            console.error('Failed to fetch organization members:', {
                orgId,
                error: error,
                errorMessage: errorMessage,
            });
            set({ error: errorMessage, membersLoading: false });
            throw error;
        }
    },

    // Update organization member
    updateOrganizationMember: async (orgId, userId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedMember = await organizationAPI.updateMember(orgId, userId, updateData);
            set((state) => ({
                organizationMembers: state.organizationMembers.map((member) =>
                    member.id === userId ? updatedMember : member
                ),
                isLoading: false,
            }));
            return updatedMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Remove organization member
    removeOrganizationMember: async (orgId, userId) => {
        set({ isLoading: true, error: null });
        try {
            await organizationAPI.removeMember(orgId, userId);
            set((state) => ({
                organizationMembers: state.organizationMembers.filter((m) => m.id !== userId),
                totalMembers: state.totalMembers - 1,
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Invite new organization member
    inviteOrganizationMember: async (orgId, memberData) => {
        set({ isLoading: true, error: null });
        try {
            const newMember = await organizationAPI.inviteMember(orgId, memberData);
            set((state) => ({
                organizationMembers: [...state.organizationMembers, newMember],
                totalMembers: state.totalMembers + 1,
                isLoading: false,
            }));
            return newMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set organization page
    setOrgPage: (page) => set({ orgCurrentPage: page }),

    // Set members page
    setMembersPage: (page) => set({ membersCurrentPage: page }),

    // Clear selected organization
    clearSelectedOrganization: () => set({ selectedOrganization: null }),

    // Clear organization members
    clearOrganizationMembers: () => set({ organizationMembers: [] }),

    // Organization member management (for org admins)
    orgMembers: [],
    totalOrgMembers: 0,
    orgMembersCurrentPage: 1,
    orgMembersPageSize: 20,
    orgMembersLoading: false,
    availablePermissions: [],

    // Fetch available permissions
    fetchAvailablePermissions: async () => {
        try {
            const response = await orgMembersAPI.listAvailablePermissions();
            set({ availablePermissions: response });
            return response;
        } catch (error) {
            console.error('Failed to fetch available permissions:', error);
            throw error;
        }
    },

    // Fetch org members (for org admins)
    fetchOrgMembers: async (page = 1, pageSize = 20) => {
        set({ orgMembersLoading: true, error: null });
        try {
            const response = await orgMembersAPI.listMembers(page, pageSize);
            set({
                orgMembers: response.items,
                totalOrgMembers: response.total,
                orgMembersCurrentPage: response.page,
                orgMembersPageSize: response.page_size,
                orgMembersLoading: false,
            });
            return response;
        } catch (error) {
            const errorMessage = extractError(error) || error.toString();
            console.error('Failed to fetch org members:', {
                error: error,
                errorMessage: errorMessage,
            });
            set({ error: errorMessage, orgMembersLoading: false });
            throw error;
        }
    },

    // Update org member
    updateOrgMember: async (userId, updateData) => {
        set({ isLoading: true, error: null });
        try {
            const updatedMember = await orgMembersAPI.updateMember(userId, updateData);
            set((state) => ({
                orgMembers: state.orgMembers.map((member) =>
                    member.id === userId ? updatedMember : member
                ),
                isLoading: false,
            }));
            return updatedMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Remove org member
    removeOrgMember: async (userId) => {
        set({ isLoading: true, error: null });
        try {
            await orgMembersAPI.removeMember(userId);
            set((state) => ({
                orgMembers: state.orgMembers.filter((m) => m.id !== userId),
                totalOrgMembers: state.totalOrgMembers - 1,
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Invite org member
    inviteOrgMember: async (memberData) => {
        set({ isLoading: true, error: null });
        try {
            const newMember = await orgMembersAPI.inviteMember(memberData);
            set((state) => ({
                orgMembers: [...state.orgMembers, newMember],
                totalOrgMembers: state.totalOrgMembers + 1,
                isLoading: false,
            }));
            return newMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set member permissions
    setOrgMemberPermissions: async (userId, permissions) => {
        set({ isLoading: true, error: null });
        try {
            const updatedMember = await orgMembersAPI.setMemberPermissions(userId, permissions);
            set((state) => ({
                orgMembers: state.orgMembers.map((member) =>
                    member.id === userId ? updatedMember : member
                ),
                isLoading: false,
            }));
            return updatedMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set org members page
    setOrgMembersPage: (page) => set({ orgMembersCurrentPage: page }),

    // Clear org members
    clearOrgMembers: () => set({ orgMembers: [] }),

    // Assign role to org member
    assignOrgMemberRole: async (userId, roleId) => {
        set({ isLoading: true, error: null });
        try {
            const updatedMember = await orgMembersAPI.assignRole(userId, roleId);
            set((state) => ({
                orgMembers: state.orgMembers.map((m) => m.id === userId ? { ...m, ...updatedMember } : m),
                isLoading: false,
            }));
            return updatedMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set extra permissions for org member
    setOrgMemberExtraPermissions: async (userId, permissions) => {
        set({ isLoading: true, error: null });
        try {
            const updatedMember = await orgMembersAPI.setExtraPermissions(userId, permissions);
            set((state) => ({
                orgMembers: state.orgMembers.map((m) => m.id === userId ? { ...m, ...updatedMember } : m),
                isLoading: false,
            }));
            return updatedMember;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Assign role to an organization member (admin view — updates organizationMembers state)
    assignAdminOrgMemberRole: async (userId, roleId) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await orgMembersAPI.assignRole(userId, roleId);
            set((state) => ({
                organizationMembers: state.organizationMembers.map((m) => m.id === userId ? { ...m, ...updated } : m),
                isLoading: false,
            }));
            return updated;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set extra permissions for an organization member (admin view)
    setAdminOrgMemberExtraPermissions: async (userId, permissions) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await orgMembersAPI.setExtraPermissions(userId, permissions);
            set((state) => ({
                organizationMembers: state.organizationMembers.map((m) => m.id === userId ? { ...m, ...updated } : m),
                isLoading: false,
            }));
            return updated;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Assign role to facilitator
    assignFacilitatorRole: async (facilitatorId, roleId) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await facilitatorAPI.assignRole(facilitatorId, roleId);
            set((state) => ({
                facilitators: state.facilitators.map((f) => f.id === facilitatorId ? { ...f, ...updated } : f),
                isLoading: false,
            }));
            return updated;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // Set extra permissions for facilitator
    setFacilitatorExtraPermissions: async (facilitatorId, permissions) => {
        set({ isLoading: true, error: null });
        try {
            const updated = await facilitatorAPI.setExtraPermissions(facilitatorId, permissions);
            set((state) => ({
                facilitators: state.facilitators.map((f) => f.id === facilitatorId ? { ...f, ...updated } : f),
                isLoading: false,
            }));
            return updated;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    // ─── Roles management ───────────────────────────────────────────────
    roles: [],
    availableRolePermissions: [],
    rolesLoading: false,

    fetchRoles: async () => {
        set({ rolesLoading: true, error: null });
        try {
            const data = await rolesAPI.listRoles();
            // API may return a paginated envelope {items, total, ...} or a plain array
            const items = Array.isArray(data) ? data : (data.items ?? []);
            set({ roles: items, rolesLoading: false });
            return data;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, rolesLoading: false });
            throw error;
        }
    },

    fetchAvailableRolePermissions: async () => {
        try {
            const data = await rolesAPI.getAvailablePermissions();
            set({ availableRolePermissions: Array.isArray(data) ? data : data.permissions || [] });
            return data;
        } catch (error) {
            console.error('Failed to fetch available role permissions:', error);
            throw error;
        }
    },

    createRole: async (name, description, permissionCodes) => {
        set({ isLoading: true, error: null });
        try {
            const newRole = await rolesAPI.createRole({ name, description, permission_codes: permissionCodes });
            set((state) => ({ roles: [...state.roles, newRole], isLoading: false }));
            return newRole;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    updateRole: async (roleId, description, permissionCodes) => {
        set({ isLoading: true, error: null });
        try {
            const updatedRole = await rolesAPI.updateRole(roleId, { description, permission_codes: permissionCodes });
            set((state) => ({
                roles: state.roles.map((r) => r.id === roleId ? updatedRole : r),
                isLoading: false,
            }));
            return updatedRole;
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    deleteRole: async (roleId) => {
        set({ isLoading: true, error: null });
        try {
            await rolesAPI.deleteRole(roleId);
            set((state) => ({
                roles: state.roles.filter((r) => r.id !== roleId),
                isLoading: false,
            }));
        } catch (error) {
            const errorMessage = extractError(error);
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },
}));
