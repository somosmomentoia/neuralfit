'use client';

import Link from 'next/link';
import styles from './ClientSidebar.module.css';

interface ClientSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: { firstName: string; lastName: string } | null;
  avatarUrl: string | null;
  planName: string | null;
  isActive: boolean;
  currentPath: string;
  onLogout: () => void;
}

const menuItems = [
  { href: '/client', icon: 'home', label: 'Inicio' },
  { href: '/client/plan', icon: 'plan', label: 'Membresías' },
  { href: '/client/routines', icon: 'training', label: 'Entrenamientos' },
  { href: '/client/exercises', icon: 'exercises', label: 'Ejercicios' },
  { href: '/client/about', icon: 'about', label: 'Sobre NeuralFit' },
];

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  plan: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  ),
  medical: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  routines: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  training: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  exercises: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6.5 6.5L17.5 17.5M6.5 17.5L17.5 6.5" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  ),
  about: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  branches: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  legal: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
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

export default function ClientSidebar({
  isOpen,
  onClose,
  user,
  avatarUrl,
  planName,
  isActive,
  currentPath,
  onLogout,
}: ClientSidebarProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const baseUrl = API_URL.replace('/api', '');
  return (
    <>
      {/* Overlay */}
      <div 
        className={`${styles.overlay} ${isOpen ? styles.visible : ''}`}
        onClick={onClose}
      />

      {/* Sidebar */}
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
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
        </div>

        {/* User Profile */}
        <Link href="/client/profile" className={styles.userProfile} onClick={onClose}>
          <div className={styles.avatar}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={`${baseUrl}${avatarUrl}`} 
                alt="Avatar" 
                className={styles.avatarImage}
              />
            ) : (
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            )}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>
              {user ? `${user.firstName} ${user.lastName}` : 'Usuario'}
            </span>
            <span className={styles.userPlan}>
              {planName ? `PLAN ${planName.toUpperCase()}` : 'SIN PLAN'}
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${currentPath === item.href ? styles.active : ''}`}
              onClick={onClose}
            >
              <span className={styles.navIcon}>{icons[item.icon]}</span>
              <span className={styles.navLabel}>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className={styles.footer}>
          <Link href="/client/legal" className={styles.footerItem} onClick={onClose}>
            <span className={styles.navIcon}>{icons.legal}</span>
            <span className={styles.navLabel}>Legales</span>
          </Link>
          <button className={styles.footerItem} onClick={onLogout}>
            <span className={styles.navIcon}>{icons.logout}</span>
            <span className={styles.navLabel}>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
