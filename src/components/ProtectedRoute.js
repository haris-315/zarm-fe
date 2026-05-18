import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';

export const ProtectedRoute = ({ children, requiredRoles, requiredPermissions }) => {
    const { isAuthenticated, isLoading, isInitialized, roles, permissions, user } = useAuthStore();

    if (!isInitialized || isLoading) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Check required roles
    if (requiredRoles && requiredRoles.length > 0) {
        const hasRequiredRole = requiredRoles.some(role => {
            if (role === 'super_admin') {
                return roles?.includes('super_admin') || user?.user_type === 'super_admin' || user?.role?.name === 'super_admin';
            }
            return roles?.includes(role);
        });
        
        if (!hasRequiredRole) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    // Check required permissions
    if (requiredPermissions && requiredPermissions.length > 0) {
        const hasRequiredPermission = requiredPermissions.some(perm => permissions?.includes(perm));
        if (!hasRequiredPermission) {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};
