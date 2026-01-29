'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import AdminHeader from './AdminHeader';
import AdminSidebar from './AdminSidebar';
import styles from './AdminLayout.module.css';
import { useUser } from '@/contexts/UserContext';
import { getToken } from '@/lib/api';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
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
        if (data.user.role !== 'ADMIN') {
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
    const titles: Record<string, string> = {
      '/admin': 'Dashboard',
      '/admin/leads': 'Leads',
      '/admin/clients': 'Clientes',
      '/admin/subscriptions': 'Suscripciones',
      '/admin/professionals': 'Profesionales',
      '/admin/exercises': 'Ejercicios',
      '/admin/routines': 'Entrenamientos',
    };
    
    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return title;
      }
    }
    return 'Admin';
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
      <AdminHeader 
        title={getPageTitle()}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user ? `${user.firstName} ${user.lastName}` : 'Admin'}
        currentPath={pathname}
        onLogout={handleLogout}
      />

      <main className={`${styles.main} ${sidebarOpen ? styles.shifted : ''}`}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
