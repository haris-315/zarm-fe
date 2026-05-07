// Configuration file for environment variables
export const config = {
    // API Configuration
    API_BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    API_VERSION: 'v1',

    // Feature Flags
    ENABLE_DEBUG: process.env.REACT_APP_DEBUG === 'true',

    // User Types
    USER_TYPES: {
        SUPER_ADMIN: 'super_admin',
        FACILITATOR: 'facilitator',
        ORGANIZATION: 'organization',
    },

    // API Endpoints
    ENDPOINTS: {
        AUTH: {
            SIGNUP: '/auth/signup',
            LOGIN: '/auth/login',
            REFRESH: '/auth/refresh',
            LOGOUT: '/auth/logout',
        },
        USER: {
            ME: '/auth/me',
            PROFILE: '/profile',
            UPDATE_PROFILE: '/profile/update',
        },
        SPRINTS: {
            LIST: '/sprints',
            GET: '/sprints/:id',
            CREATE: '/sprints',
            UPDATE: '/sprints/:id',
            DELETE: '/sprints/:id',
        },
        HEALTH: {
            CHECK: '/health',
        },
    },

    // Storage Keys
    STORAGE_KEYS: {
        ACCESS_TOKEN: 'access_token',
        REFRESH_TOKEN: 'refresh_token',
        USER_DATA: 'user_data',
        ORGANIZATION_DATA: 'organization_data',
    },

    // Timeouts
    API_TIMEOUT: 30000, // 30 seconds
    REFRESH_TIMEOUT: 5000, // 5 seconds
};

export default config;
