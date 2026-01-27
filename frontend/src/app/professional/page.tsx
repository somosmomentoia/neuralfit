'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface User {
  firstName: string;
  lastName: string;
}

interface Client {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  subscriptionStatus: string;
}

export default function ProfessionalDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ exercises: 0, routines: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, clientsRes, exercisesRes, routinesRes] = await Promise.all([
          apiFetch('/auth/me'),
          apiFetch('/professional/clients'),
          apiFetch('/professional/exercises'),
          apiFetch('/professional/routines'),
        ]);

        const userData = await userRes.json();
        const clientsData = await clientsRes.json();
        const exercisesData = await exercisesRes.json();
        const routinesData = await routinesRes.json();

        setUser(userData.user);
        setClients(clientsData.clients || []);
        setStats({
          exercises: (exercisesData.exercises || []).length,
          routines: (routinesData.routines || []).length,
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const activeClients = clients.filter(c => c.subscriptionStatus === 'ACTIVE').length;

  return (
    <div className={styles.container}>
      {/* Welcome Card */}
      <div className={styles.welcomeCard}>
        <div className={styles.welcomeContent}>
          <span className={styles.welcomeLabel}>Bienvenido</span>
          <h1 className={styles.welcomeName}>{user?.firstName || 'Entrenador'}</h1>
        </div>
        <div className={styles.welcomeIcon}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6.5 6.5h11v11h-11z" />
            <path d="M6.5 1v5.5M17.5 1v5.5M1 6.5h5.5M17.5 6.5H23M6.5 17.5v5.5M17.5 17.5v5.5M1 17.5h5.5M17.5 17.5H23" />
          </svg>
        </div>
      </div>

      {/* Main Stats Card */}
      <div className={styles.mainStatsCard}>
        <div className={styles.mainStatHeader}>
          <div className={styles.mainStatIcon}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <span className={styles.mainStatLabel}>Mis Clientes</span>
        </div>
        <div className={styles.mainStatValue}>
          {loading ? '...' : clients.length}
        </div>
        <div className={styles.mainStatMeta}>
          <span className={styles.metaActive}>
            <span className={styles.metaDot} />
            {activeClients} activos
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Link href="/professional/routines" className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="9" x2="15" y2="9" />
              <line x1="9" y1="13" x2="15" y2="13" />
              <line x1="9" y1="17" x2="12" y2="17" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{loading ? '...' : stats.routines}</span>
            <span className={styles.statLabel}>Rutinas</span>
          </div>
        </Link>

        <Link href="/professional/exercises" className={styles.statCard}>
          <div className={styles.statIconBlue}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6.5 6.5h11v11h-11z" />
              <path d="M6.5 1v5.5M17.5 1v5.5M1 6.5h5.5M17.5 6.5H23M6.5 17.5v5.5M17.5 17.5v5.5" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{loading ? '...' : stats.exercises}</span>
            <span className={styles.statLabel}>Ejercicios</span>
          </div>
        </Link>
      </div>

      {/* Clients Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Clientes Recientes</h3>
          <Link href="/professional/clients" className={styles.viewAll}>Ver todos</Link>
        </div>
        
        <div className={styles.clientsList}>
          {loading ? (
            <p className={styles.loadingText}>Cargando...</p>
          ) : clients.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tienes clientes asignados aún</p>
            </div>
          ) : (
            clients.slice(0, 3).map((client) => (
              <Link key={client.id} href={`/professional/clients/${client.id}`} className={styles.clientCard}>
                <div className={styles.clientAvatar}>
                  {client.user.firstName.charAt(0)}
                </div>
                <div className={styles.clientInfo}>
                  <span className={styles.clientName}>
                    {client.user.firstName} {client.user.lastName}
                  </span>
                  <span className={`${styles.clientStatus} ${client.subscriptionStatus === 'ACTIVE' ? styles.active : ''}`}>
                    {client.subscriptionStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <div className={styles.clientArrow}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Acciones rápidas</h3>
        <div className={styles.actionsGrid}>
          <Link href="/professional/exercises/new" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Ejercicio</span>
          </Link>

          <Link href="/professional/routines/new" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Rutina</span>
          </Link>

          <Link href="/professional/clients" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
              </svg>
            </div>
            <span className={styles.actionLabel}>Clientes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
