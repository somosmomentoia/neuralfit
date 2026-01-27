'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './CollapsibleSidebar.module.css';

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface CollapsibleSidebarProps {
  gymName?: string;
  userName: string;
  userRole: string;
  navItems: NavItem[];
  onLogout: () => void;
}

export default function CollapsibleSidebar({
  gymName = 'NeuralFit',
  userName,
  userRole,
  navItems,
  onLogout,
}: CollapsibleSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      <div className={styles.sidebarInner}>
        {/* Header with Logo */}
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <div className={styles.logoIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5" />
                <rect x="2" y="9" width="4" height="6" rx="1" />
                <rect x="18" y="9" width="4" height="6" rx="1" />
                <line x1="6" y1="12" x2="18" y2="12" />
              </svg>
            </div>
            {!collapsed && <span className={styles.gymName}>{gymName}</span>}
          </div>
          <button 
            className={styles.toggleBtn}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {collapsed ? (
                <path d="M9 18l6-6-6-6" />
              ) : (
                <path d="M15 18l-6-6 6-6" />
              )}
            </svg>
          </button>
        </div>

        {/* User Info */}
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {userName.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className={styles.userDetails}>
              <span className={styles.userName}>{userName}</span>
              <span className={styles.userRole}>{userRole}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/admin' && pathname.startsWith(`${item.href}`));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={collapsed ? item.label : undefined}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <button 
            className={styles.logoutBtn}
            onClick={onLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {!collapsed && <span>Cerrar sesión</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
