import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://agent.wearezylo.com';

// Create axios instance
const apiClient = axios.create({
    baseURL: `${API_BASE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
    validateStatus: (status) => {
        return (status >= 200 && status < 300) || status === 304;
    }
});

let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.forEach((cb) => cb(token));
    refreshSubscribers = [];
};

const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    if (window.location.pathname !== '/login' && window.location.pathname !== '/accept-invite') {
        window.location.href = '/login';
    }
};

const refreshTokens = async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
        handleLogout();
        return null;
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
            refresh_token: refreshToken,
        });

        const { access_token, refresh_token: newRefreshToken } = response.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', newRefreshToken);

        return access_token;
    } catch (error) {
        handleLogout();
        throw error;
    }
};

// Request interceptor for proactive refresh
apiClient.interceptors.request.use(
    async (config) => {
        const token = localStorage.getItem('access_token');

        if (token) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Date.now() / 1000;

                // If token expires in less than 30 seconds, refresh proactively
                if (decoded.exp - currentTime < 30) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        refreshTokens()
                            .then((newAccessToken) => {
                                isRefreshing = false;
                                if (newAccessToken) {
                                    onRefreshed(newAccessToken);
                                }
                            })
                            .catch(() => {
                                isRefreshing = false;
                            });
                    }

                    return new Promise((resolve) => {
                        subscribeTokenRefresh((newAccessToken) => {
                            if (newAccessToken) {
                                config.headers.Authorization = `Bearer ${newAccessToken}`;
                                resolve(config);
                            } else {
                                // If refresh failed, reject the request
                                resolve(Promise.reject(new Error('Session expired')));
                            }
                        });
                    });
                }

                config.headers.Authorization = `Bearer ${token}`;
            } catch (e) {
                // If decoding fails, just continue and let the response interceptor handle 401
                console.warn('Token decoding failed', e);
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for reactive refresh
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (!isRefreshing) {
                isRefreshing = true;
                refreshTokens()
                    .then((newAccessToken) => {
                        isRefreshing = false;
                        if (newAccessToken) {
                            onRefreshed(newAccessToken);
                        }
                    })
                    .catch((refreshError) => {
                        isRefreshing = false;
                        return Promise.reject(refreshError);
                    });
            }

            return new Promise((resolve, reject) => {
                subscribeTokenRefresh((newAccessToken) => {
                    if (newAccessToken) {
                        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                        resolve(apiClient(originalRequest));
                    } else {
                        reject(error);
                    }
                });
            });
        }

        return Promise.reject(error);
    }
);

export default apiClient;
