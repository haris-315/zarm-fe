import { create } from 'zustand';
import { authAPI, userAPI } from '../api';

/**
 * Normalize any /me (or login) response into the three fields the store tracks.
 *
 * Backend shapes we handle:
 *   role:       { id, name, description, is_system }  ← new single-object shape
 *   roles:      ['super_admin']                        ← legacy string array
 *   roles:      [{ name: 'super_admin' }]              ← array-of-objects variant
 *
 *   all_permissions: [{ code, description }]           ← new merged list
 *   permissions:     ['sprint.read']                   ← legacy string array
 *   extra_permissions: ['sprint.delete']               ← extra codes on top of role
 */
const normalizeUserData = (userData) => {
    // ── roles ──────────────────────────────────────────────────────────
    let roles = [];
    if (Array.isArray(userData.roles)) {
        roles = userData.roles.map((r) => (typeof r === 'string' ? r : r?.name)).filter(Boolean);
    } else if (userData.role?.name) {
        roles = [userData.role.name];
    }

    // ── permissions (flat code strings) ────────────────────────────────
    let permissions = [];
    if (Array.isArray(userData.all_permissions)) {
        permissions = userData.all_permissions
            .map((p) => (typeof p === 'string' ? p : p?.code))
            .filter(Boolean);
    } else if (Array.isArray(userData.permissions)) {
        permissions = userData.permissions.map((p) => (typeof p === 'string' ? p : p?.code)).filter(Boolean);
    }

    // ── organization ───────────────────────────────────────────────────
    const organization = userData.organization || null;

    return { roles, permissions, organization };
};

const extractApiError = (error) => {
    const detail = error.response?.data?.detail;
    if (Array.isArray(detail)) return detail.map((e) => e.msg || JSON.stringify(e)).join(', ');
    if (typeof detail === 'string') return detail;
    return error.message || 'An unexpected error occurred';
};

export const useAuthStore = create((set, get) => ({
    // State
    user: null,
    roles: [],
    permissions: [],
    organization: null,
    accessToken: localStorage.getItem('access_token') || null,
    refreshToken: localStorage.getItem('refresh_token') || null,
    isLoading: false,
    isInitialized: false,
    error: null,
    isAuthenticated: !!localStorage.getItem('access_token'),

    // Initialize auth on app load / hard refresh
    initializeAuth: async () => {
        set({ isLoading: true });
        const token = localStorage.getItem('access_token');

        if (!token) {
            set({ isLoading: false, isInitialized: true });
            return;
        }

        try {
            const userData = await userAPI.getMe();
            const { roles, permissions, organization } = normalizeUserData(userData);

            set({
                user: userData,
                roles,
                permissions,
                organization,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
            });
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
                user: null,
                roles: [],
                permissions: [],
                organization: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                isInitialized: true,
                error: 'Session expired. Please login again.',
            });
        }
    },

    signup: async (signupData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.signup(signupData);
            const { access_token, refresh_token } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const userData = await userAPI.getMe();
            const { roles, permissions, organization } = normalizeUserData(userData);

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles,
                permissions,
                organization,
                isAuthenticated: true,
                isLoading: false,
            });

            return { ...response, user: userData };
        } catch (error) {
            set({ error: extractApiError(error), isLoading: false });
            throw error;
        }
    },

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.login(email, password);
            const { access_token, refresh_token } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const userData = await userAPI.getMe();
            const { roles, permissions, organization } = normalizeUserData(userData);

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles,
                permissions,
                organization,
                isAuthenticated: true,
                isLoading: false,
            });

            return response;
        } catch (error) {
            set({ error: extractApiError(error), isLoading: false });
            throw error;
        }
    },

    acceptInvite: async (inviteData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.acceptInvite(inviteData);
            const { access_token, refresh_token } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            const userData = await userAPI.getMe();
            const { roles, permissions, organization } = normalizeUserData(userData);

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles,
                permissions,
                organization,
                isAuthenticated: true,
                isLoading: false,
            });

            return response;
        } catch (error) {
            set({ error: extractApiError(error), isLoading: false });
            throw error;
        }
    },

    refreshAuthTokens: async () => {
        const { refreshToken } = get();
        const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token');

        if (!currentRefreshToken) throw new Error('No refresh token available');

        try {
            const response = await authAPI.refresh(currentRefreshToken);
            const { access_token, refresh_token: newRefreshToken } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);

            set({ accessToken: access_token, refreshToken: newRefreshToken, isAuthenticated: true });
            return access_token;
        } catch (error) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
                user: null, roles: [], permissions: [], organization: null,
                accessToken: null, refreshToken: null,
                isAuthenticated: false,
                error: 'Session expired. Please login again.',
            });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            await authAPI.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({
                user: null, roles: [], permissions: [], organization: null,
                accessToken: null, refreshToken: null,
                isAuthenticated: false, isLoading: false, error: null,
            });
        }
    },

    getMe: async () => {
        try {
            const userData = await userAPI.getMe();
            const { roles, permissions, organization } = normalizeUserData(userData);
            set({ user: userData, roles, permissions, organization });
            return userData;
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    },

    hasRole: (role) => Array.isArray(get().roles) && get().roles.includes(role),
    hasPermission: (perm) => Array.isArray(get().permissions) && get().permissions.includes(perm),
    hasAnyRole: (list) => Array.isArray(get().roles) && list.some((r) => get().roles.includes(r)),

    setUser: (user) => set({ user }),
    setOrganization: (organization) => set({ organization }),

    updateAvatar: async (file) => {
        set({ isLoading: true, error: null });
        try {
            const updatedUser = await userAPI.updateAvatar(file);
            set({ user: updatedUser, isLoading: false });
            return updatedUser;
        } catch (error) {
            set({ error: extractApiError(error), isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
