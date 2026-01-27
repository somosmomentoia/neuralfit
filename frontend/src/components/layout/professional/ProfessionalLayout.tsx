'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ProfessionalHeader from './ProfessionalHeader';
import ProfessionalSidebar from './ProfessionalSidebar';
import styles from './ProfessionalLayout.module.css';

interface User {
  firstName: string;
  lastName: string;
  role: string;
}

interface ProfessionalLayoutProps {
  children: React.ReactNode;
}

export default function ProfessionalLayout({ children }: ProfessionalLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const res = await fetch(`${API_URL}/auth/me`, { credentials: 'include', headers });
        if (!res.ok) {
          router.push('/login');
          return;
        }

        const data = await res.json();
        if (data.user.role !== 'PROFESSIONAL') {
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
  }, [router]);

  const handleLogout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
      localStorage.removeItem('token');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPageTitle = () => {
    const titles: Record<string, string> = {
      '/professional': 'Dashboard',
      '/professional/clients': 'Mis Clientes',
      '/professional/exercises': 'Ejercicios',
      '/professional/routines': 'Entrenamientos',
    };
    
    for (const [path, title] of Object.entries(titles)) {
      if (pathname === path || pathname.startsWith(`${path}/`)) {
        return title;
      }
    }
    return 'Profesional';
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
      <ProfessionalHeader 
        title={getPageTitle()}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <ProfessionalSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={user ? `${user.firstName} ${user.lastName}` : 'Profesional'}
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
