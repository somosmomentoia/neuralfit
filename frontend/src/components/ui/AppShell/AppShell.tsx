'use client';

import { ReactNode } from 'react';
import styles from './AppShell.module.css';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
}

export function AppShell({ 
  children, 
  header,
  className = ''
}: AppShellProps) {
  return (
    <div className={`${styles.shell} ${className}`}>
      {header && (
        <header className={styles.header}>
          {header}
        </header>
      )}
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
