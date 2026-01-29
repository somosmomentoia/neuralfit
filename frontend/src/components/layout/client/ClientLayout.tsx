'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import styles from './ClientLayout.module.css';
import ClientHeader from './ClientHeader';
import ClientBottomNav from './ClientBottomNav';
import ClientSidebar from './ClientSidebar';
import { useUser } from '@/contexts/UserContext';
import { getToken } from '@/lib/api';

interface ClientData {
  subscriptionStatus: string;
  plan: { name: string } | null;
}

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useUser();
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const fetchData = async () => {
      try {
        const token = getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

        const [userRes, profileRes] = await Promise.all([
          fetch(`${API_URL}/auth/me`, { credentials: 'include', headers }),
          fetch(`${API_URL}/client/profile`, { credentials: 'include', headers }),
        ]);

        if (!userRes.ok) {
          router.push('/login');
          return;
        }

        const userData = await userRes.json();
        const profileData = await profileRes.json();

        if (userData.user.role !== 'CLIENT') {
          router.push('/login');
          return;
        }

        setUser(userData.user);
        setClientData(profileData.profile);
      } catch (error) {
        console.error('Error fetching data:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
      '/client': 'Inicio',
      '/client/plan': 'Membresías',
      '/client/gyms': 'Gimnasios',
      '/client/routines': 'Entrenamientos',
      '/client/progress': 'Mis Logros',
      '/client/checkin': 'Ingreso',
      '/client/profile': 'Perfil',
      '/client/medical': 'Apto médico',
      '/client/exercises': 'Ejercicios',
      '/client/about': 'Sobre NeuralFit',
    };
    return titles[pathname] || 'NeuralFit';
  };

  // Rutas fullscreen (sin header, nav, padding) - páginas de workout
  const isFullscreenRoute = pathname.startsWith('/client/workout/');

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.loadingSpinner} />
      </div>
    );
  }

  // Rutas fullscreen: renderizar solo children sin layout
  if (isFullscreenRoute) {
    return <>{children}</>;
  }

  return (
    <div className={styles.layout}>
      <ClientHeader 
        title={getPageTitle()}
        onMenuClick={() => setSidebarOpen(true)}
        onNotificationsClick={() => setNotificationsOpen(true)}
        onNotificationsClose={() => setNotificationsOpen(false)}
        notificationsOpen={notificationsOpen}
      />

      <ClientSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        avatarUrl={user?.avatar || null}
        planName={clientData?.plan?.name || null}
        isActive={clientData?.subscriptionStatus === 'ACTIVE'}
        currentPath={pathname}
        onLogout={handleLogout}
      />

      <main className={`${styles.main} ${sidebarOpen ? styles.shifted : ''} ${notificationsOpen ? styles.shiftedLeft : ''}`}>
        <div className={styles.content}>
          {children}
        </div>
      </main>

      <ClientBottomNav currentPath={pathname} />
    </div>
  );
}
