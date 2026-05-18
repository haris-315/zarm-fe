import { useEffect } from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuthStore } from './context/authStore';
import { FacilitatorDetail } from './pages/FacilitatorDetail';
import { FacilitatorForm } from './pages/FacilitatorForm';
import { FacilitatorsList } from './pages/FacilitatorsList';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { OrganizationDetail } from './pages/OrganizationDetail';
import { OrganizationMembers } from './pages/OrganizationMembers';
import { OrganizationsList } from './pages/OrganizationsList';
import { OrgMembersPage } from './pages/OrgMembersPage';
import { RolesPage } from './pages/RolesPage';
import { SignupPage } from './pages/SignupPage';
import { SuperAdminDashboard } from './pages/SuperAdminDashboard';
import { AcceptInvitePage } from './pages/AcceptInvitePage';
import { FacilitatorOrgsPage } from './pages/FacilitatorOrgsPage';
import { OrgSprintsPage } from './pages/OrgSprintsPage';
import { SprintCanvasPage } from './pages/SprintCanvasPage';
import { AdminOrgSprintsPage } from './pages/AdminOrgSprintsPage';

// App initializer component
function AppInitializer({ children }) {
  const { initializeAuth, isInitialized } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  if (!isInitialized) {
    return <div className="loading-screen">Loading...</div>;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      {/* Super Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <SuperAdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/roles"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <RolesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/facilitators"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <FacilitatorsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/facilitators/new"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <FacilitatorForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/facilitators/:facilitatorId"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <FacilitatorDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/facilitators/:facilitatorId/edit"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <FacilitatorForm />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />

      {/* Organization Routes (Super Admin view) */}
      <Route
        path="/admin/organizations"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <OrganizationsList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizations/:orgId"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <OrganizationDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizations/:orgId/members"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <OrganizationMembers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/organizations/:orgId/sprints"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <AdminOrgSprintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sprints/:sprintId"
        element={
          <ProtectedRoute requiredRoles={['super_admin']}>
            <SprintCanvasPage />
          </ProtectedRoute>
        }
      />

      {/* Organization Admin / Member Routes */}
      <Route
        path="/org/members"
        element={
          <ProtectedRoute requiredRoles={['org_admin', 'manager']}>
            <OrgMembersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/org/sprints/:sprintId"
        element={
          <ProtectedRoute requiredRoles={['org_admin', 'manager', 'member']}>
            <SprintCanvasPage />
          </ProtectedRoute>
        }
      />

      {/* Facilitator Sprint Routes */}
      <Route
        path="/facilitator/organizations"
        element={
          <ProtectedRoute requiredPermissions={['sprint.read']}>
            <FacilitatorOrgsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilitator/organizations/:orgId/sprints"
        element={
          <ProtectedRoute requiredPermissions={['sprint.read']}>
            <OrgSprintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilitator/sprints/:sprintId"
        element={
          <ProtectedRoute requiredPermissions={['sprint.read']}>
            <SprintCanvasPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AppInitializer>
        <AppRoutes />
      </AppInitializer>
    </Router>
  );
}

export default App;
