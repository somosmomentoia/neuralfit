'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { getToken } from '@/lib/api';
import AdminHeader from '../admin/AdminHeader';
import SuperadminSidebar from './SuperadminSidebar';
import styles from './SuperadminLayout.module.css';

interface SuperadminLayoutProps {
  children: ReactNode;
}

export default function SuperadminLayout({ children }: SuperadminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchUser = async () => {
      try {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include', headers });
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data.user.role !== 'SUPERADMIN') {
          router.push('/login');
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error('Error fetching user:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, setUser]);

  const handleLogout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      localStorage.removeItem('token');
      localStorage.removeItem('rememberMe');
      sessionStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPageTitle = () => {
    if (pathname === '/superadmin') {
      return 'Gestión de Gyms';
    }

    return 'Superadmin';
  };

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <AdminHeader title={getPageTitle()} onMenuClick={() => setSidebarOpen(true)} />

      <SuperadminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user ? `${user.firstName} ${user.lastName}` : 'Superadmin'}
        currentPath={pathname}
        onLogout={handleLogout}
      />

      <main className={`${styles.main} ${sidebarOpen ? styles.shifted : ''}`}>
        <div className={styles.content}>{children}</div>
      </main>
    </div>
  );
}
