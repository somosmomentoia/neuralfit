'use client';

import Link from 'next/link';
import styles from './ClientBottomNav.module.css';

interface ClientBottomNavProps {
  currentPath: string;
}

const navItems = [
  { href: '/client', icon: 'home' },
  { href: '/client/routines', icon: 'routines' },
  { href: '/client/checkin', icon: 'qr', isCenter: true },
  { href: '/client/progress', icon: 'progress' },
  { href: '/client/profile', icon: 'profile' },
];

const icons: Record<string, React.ReactNode> = {
  home: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  progress: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5C7 4 7 7 7 7" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5C17 4 17 7 17 7" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  ),
  qr: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <line x1="21" y1="14" x2="21" y2="14.01" />
      <line x1="21" y1="18" x2="21" y2="21" />
      <line x1="17" y1="21" x2="21" y2="21" />
      <line x1="17" y1="17" x2="17" y2="17.01" />
    </svg>
  ),
  routines: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="10" width="3" height="4" rx="0.5" />
      <rect x="19" y="10" width="3" height="4" rx="0.5" />
      <rect x="5" y="8" width="3" height="8" rx="0.5" />
      <rect x="16" y="8" width="3" height="8" rx="0.5" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  profile: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="9" r="3" />
      <path d="M6.5 18.5c1-2.5 3-4 5.5-4s4.5 1.5 5.5 4" />
    </svg>
  ),
};

export default function ClientBottomNav({ currentPath }: ClientBottomNavProps) {
  return (
    <nav className={styles.nav}>
      {/* SVG con path que dibuja el navbar con muesca semicircular perfecta */}
      <svg className={styles.navSvg} viewBox="0 0 400 72" preserveAspectRatio="none">
        <path 
          d="M36 0 
             H160 
             A40 40 0 0 0 240 0 
             H364 
             C384 0, 400 16, 400 36 
             C400 56, 384 72, 364 72 
             H36 
             C16 72, 0 56, 0 36 
             C0 16, 16 0, 36 0 
             Z"
          fill="rgba(38, 43, 40, 0.98)"
        />
      </svg>
      
      <div className={styles.navContainer}>
        {/* Lado izquierdo */}
        <div className={styles.navSide}>
          {navItems.slice(0, 2).map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                aria-label={item.icon}
              >
                <span className={styles.iconCircle}>{icons[item.icon]}</span>
              </Link>
            );
          })}
        </div>

        {/* Botón central QR */}
        <div className={styles.centerWrapper}>
          <Link
            href="/client/checkin"
            className={styles.centerButton}
            aria-label="QR"
          >
            {icons.qr}
          </Link>
          <span className={styles.centerLabel}>QR</span>
        </div>

        {/* Lado derecho */}
        <div className={styles.navSide}>
          {navItems.slice(3).map((item) => {
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                aria-label={item.icon}
              >
                <span className={styles.iconCircle}>{icons[item.icon]}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
