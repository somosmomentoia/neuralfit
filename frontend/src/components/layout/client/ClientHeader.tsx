'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from './ClientHeader.module.css';

interface ClientHeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function ClientHeader({ title, onMenuClick }: ClientHeaderProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await apiFetch('/notifications/unread-count');
        const data = await res.json();
        setUnreadCount(data.count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    // Refetch every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className={styles.header}>
      <button className={styles.menuButton} onClick={onMenuClick} aria-label="Abrir menú">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <h1 className={styles.title}>{title}</h1>

      <Link href="/client/notifications" className={styles.notificationButton} aria-label="Notificaciones">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className={styles.notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </Link>
    </header>
  );
}
