import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../context/authStore';
import styles from './AppShell.module.css';

export const AppShell = ({ children, title, actions }) => {
  const { user, roles, permissions, logout } = useAuthStore();
  const navigate = useNavigate();

  const isAdmin =
    roles.includes('super_admin') ||
    user?.user_type === 'super_admin' ||
    user?.role?.name === 'super_admin';

  // An org user is anyone with an org-scoped role, regardless of extra permissions.
  const isOrgUser =
    !isAdmin &&
    (user?.user_type === 'organization' ||
      roles.includes('org_admin') ||
      roles.includes('manager') ||
      roles.includes('member'));

  // A facilitator is a platform-staff user who is NOT also an org user.
  const isFacilitator = !isAdmin && !isOrgUser;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups = isAdmin
    ? [
        {
          label: 'Admin',
          links: [
            { to: '/admin', label: 'Dashboard', icon: DashboardIcon, end: true },
            { to: '/admin/facilitators', label: 'Facilitators', icon: UsersIcon },
            { to: '/admin/organizations', label: 'Organizations', icon: OrgIcon },
            { to: '/admin/roles', label: 'Roles', icon: ShieldIcon },
            { to: '/admin/notifications', label: 'Notifications', icon: BellIcon },
          ],
        },
      ]
    : isFacilitator
    ? [
        {
          label: 'Facilitator',
          links: [
            { to: '/facilitator/organizations', label: 'My Organizations', icon: OrgIcon },
          ],
        },
      ]
    : [
        {
          label: 'Organization',
          links: [
            { to: '/dashboard', label: 'Overview', icon: DashboardIcon },
            { to: '/org/members', label: 'Team Members', icon: UsersIcon },
          ],
        },
      ];

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <div className={styles.brand}>Zylo</div>
          <div className={styles.user}>
            <div className={styles.avatar}>
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="" className={styles.avatarImg} />
              ) : (
                user?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'
              )}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user?.full_name || 'User'}</div>
              <div className={styles.userEmail}>{user?.email}</div>
            </div>
          </div>
        </div>

        <nav className={styles.nav}>
          {navGroups.map((group) => (
            <div key={group.label} className={styles.navGroup}>
              <div className={styles.navGroupLabel}>{group.label}</div>
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                >
                  <link.icon className={styles.navIcon} />
                  {link.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <button className={styles.navLink} onClick={handleLogout}>
            <LogoutIcon className={styles.navIcon} />
            Logout
          </button>
          <div className={styles.version}>v1.0.5</div>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topBar}>
          <div className={styles.pageTitle}>{title}</div>
          <div className={styles.topBarActions}>{actions}</div>
        </header>
        <div className={styles.content}>
          <div className={styles.contentInner}>{children}</div>
        </div>
      </main>
    </div>
  );
};

// ─── Icons ──────────────────────────────────────────────────────────────────

const DashboardIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);

const UsersIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const OrgIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21h18" /><path d="M9 8h1" /><path d="M9 12h1" /><path d="M9 16h1" />
    <path d="M14 8h1" /><path d="M14 12h1" /><path d="M14 16h1" />
    <rect x="2" y="3" width="20" height="18" rx="2" ry="2" />
  </svg>
);

const ShieldIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const BellIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const LogoutIcon = ({ className }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
