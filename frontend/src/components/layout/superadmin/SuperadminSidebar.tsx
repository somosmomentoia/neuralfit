'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import styles from '../admin/AdminSidebar.module.css';

interface SuperadminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentPath: string;
  onLogout: () => void;
}

const menuItems = [
  { href: '/superadmin', icon: 'gyms', label: 'Gyms' },
];

const icons: Record<string, ReactNode> = {
  gyms: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M10 21v-4h4v4" />
    </svg>
  ),
  logout: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
};

export default function SuperadminSidebar({
  isOpen,
  onClose,
  userName,
  currentPath,
  onLogout,
}: SuperadminSidebarProps) {
  const handleNavClick = () => {
    setTimeout(() => {
      onClose();
    }, 150);
  };

  return (
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
        onClick={onClose}
      />

      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <button className={styles.menuButton} onClick={onClose} aria-label="Menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
          <button className={styles.closeButton} onClick={onClose} aria-label="Cerrar menú">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <Link href="/superadmin" className={styles.userProfile} onClick={handleNavClick}>
          <div className={styles.avatar}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userRole}>SUPERADMIN</span>
          </div>
        </Link>

        <nav className={styles.nav}>
          {menuItems.map((item) => {
            const isActive = currentPath === item.href || (item.href !== '/superadmin' && currentPath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                onClick={handleNavClick}
              >
                <span className={styles.navIcon}>{icons[item.icon]}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.footer}>
          <button className={styles.footerItem} onClick={onLogout}>
            <span className={styles.navIcon}>{icons.logout}</span>
            <span className={styles.navLabel}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
