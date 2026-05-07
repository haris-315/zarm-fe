import { create } from 'zustand';
import { authAPI, userAPI } from '../api';

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

    // Initialize auth on app load/refresh
    initializeAuth: async () => {
        set({ isLoading: true });
        const token = localStorage.getItem('access_token');

        if (!token) {
            set({ isLoading: false, isInitialized: true });
            return;
        }

        try {
            const userData = await userAPI.getMe();
            
            // Consolidate organization info
            const organization = userData.organization || null;

            set({
                user: userData,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                organization,
                accessToken: token,
                isAuthenticated: true,
                isLoading: false,
                isInitialized: true,
            });
        } catch (error) {
            // Token invalid or expired
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

    // Actions
    signup: async (signupData) => {
        set({ isLoading: true, error: null });
        try {
            const response = await authAPI.signup(signupData);
            const { access_token, refresh_token, organization } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);

            // Fetch complete user data with roles and permissions
            const userData = await userAPI.getMe();
            
            const organizationInfo = userData.organization || null;

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                organization: organizationInfo,
                isAuthenticated: true,
                isLoading: false,
            });

            return { ...response, user: userData };
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            set({ error: errorMessage, isLoading: false });
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

            // Fetch user data with roles and permissions
            const userData = await userAPI.getMe();

            const organization = userData.organization || null;

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                organization,
                isAuthenticated: true,
                isLoading: false,
            });

            return response;
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            set({ error: errorMessage, isLoading: false });
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

            // Fetch user data with roles and permissions
            const userData = await userAPI.getMe();

            const organization = userData.organization || null;

            set({
                accessToken: access_token,
                refreshToken: refresh_token,
                user: userData,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                organization,
                isAuthenticated: true,
                isLoading: false,
            });

            return response;
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    refreshAuthTokens: async () => {
        const { refreshToken } = get();
        const currentRefreshToken = refreshToken || localStorage.getItem('refresh_token');
        
        if (!currentRefreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await authAPI.refresh(currentRefreshToken);
            const { access_token, refresh_token: newRefreshToken } = response;

            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', newRefreshToken);

            set({
                accessToken: access_token,
                refreshToken: newRefreshToken,
                isAuthenticated: true,
            });

            return access_token;
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
                user: null,
                roles: [],
                permissions: [],
                organization: null,
                accessToken: null,
                refreshToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
        }
    },

    getMe: async () => {
        try {
            const userData = await userAPI.getMe();
            set({
                user: userData,
                roles: userData.roles || [],
                permissions: userData.permissions || [],
                organization: userData.organization || null,
            });
            return userData;
        } catch (error) {
            console.error('Get user error:', error);
            throw error;
        }
    },

    // Check if user has a specific role
    hasRole: (role) => {
        const { roles } = get();
        return Array.isArray(roles) && roles.includes(role);
    },

    // Check if user has a specific permission
    hasPermission: (permission) => {
        const { permissions } = get();
        return Array.isArray(permissions) && permissions.includes(permission);
    },

    // Check if user has any of the given roles
    hasAnyRole: (roleList) => {
        const { roles } = get();
        return Array.isArray(roles) && Array.isArray(roleList) && roleList.some(role => roles.includes(role));
    },

    setUser: (user) => set({ user }),
    setOrganization: (organization) => set({ organization }),

    updateAvatar: async (file) => {
        set({ isLoading: true, error: null });
        try {
            const updatedUser = await userAPI.updateAvatar(file);
            set({ user: updatedUser, isLoading: false });
            return updatedUser;
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message;
            set({ error: errorMessage, isLoading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));
