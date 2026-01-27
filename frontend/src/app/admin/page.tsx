'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface DashboardStats {
  clients: number;
  activeClients: number;
  inactiveClients: number;
  professionals: number;
  leads: number;
  newLeads: number;
  contactedLeads: number;
  monthlyRevenue: number;
  pendingSubscriptions: number;
}

interface RecentSubscription {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  plan: {
    name: string;
    price: number;
  } | null;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    clients: 0,
    activeClients: 0,
    inactiveClients: 0,
    professionals: 0,
    leads: 0,
    newLeads: 0,
    pendingSubscriptions: 0,
    contactedLeads: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentSubscriptions, setRecentSubscriptions] = useState<RecentSubscription[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [clientsRes, prosRes, leadsRes, recentRes] = await Promise.all([
          apiFetch('/admin/clients'),
          apiFetch('/admin/professionals'),
          apiFetch('/admin/leads'),
          apiFetch('/admin/subscriptions/recent'),
        ]);

        const [clientsData, prosData, leadsData, recentData] = await Promise.all([
          clientsRes.json(),
          prosRes.json(),
          leadsRes.json(),
          recentRes.json(),
        ]);

        const clients = clientsData.clients || [];
        const professionals = prosData.professionals || [];
        const leads = leadsData.leads || [];
        const recentSubs = recentData.subscriptions || [];
        const activeClients = clients.filter((c: { clientProfile?: { subscriptionStatus: string } }) => 
          c.clientProfile?.subscriptionStatus === 'ACTIVE'
        );

        setStats({
          clients: clients.length,
          activeClients: activeClients.length,
          inactiveClients: clients.length - activeClients.length,
          professionals: professionals.length,
          leads: leads.length,
          newLeads: leads.filter((l: { status: string }) => l.status === 'NEW').length,
          contactedLeads: leads.filter((l: { status: string }) => l.status === 'CONTACTED').length,
          monthlyRevenue: activeClients.reduce((sum: number, c: { clientProfile?: { plan?: { price: number } } }) => 
            sum + (c.clientProfile?.plan?.price || 0), 0),
          pendingSubscriptions: recentSubs.filter((s: { status: string }) => s.status === 'PENDING').length,
        });
        
        setRecentSubscriptions(recentSubs);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'PENDING': return 'Pendiente';
      case 'EXPIRED': return 'Vencida';
      case 'CANCELLED': return 'Cancelada';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#22C55E';
      case 'PENDING': return '#FFC107';
      case 'EXPIRED': return '#EF4444';
      default: return '#9CA3AF';
    }
  };

  return (
    <div className={styles.container}>
      {/* Main Stats Card */}
      <div className={styles.mainStatsCard}>
        <div className={styles.mainStatHeader}>
          <div className={styles.mainStatIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <span className={styles.mainStatLabel}>Clientes Totales</span>
        </div>
        <div className={styles.mainStatValue}>
          {loading ? '...' : stats.clients.toLocaleString()}
        </div>
        <div className={styles.mainStatMeta}>
          <span className={styles.metaActive}>
            <span className={styles.metaDot} />
            {stats.activeClients} activos
          </span>
          <span className={styles.metaInactive}>
            {stats.inactiveClients} inactivos
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <Link href="/admin/leads" className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{loading ? '...' : stats.newLeads}</span>
            <span className={styles.statLabel}>Leads nuevos</span>
          </div>
          <div className={styles.statBadge}>{stats.leads} total</div>
        </Link>

        <Link href="/admin/professionals" className={styles.statCard}>
          <div className={styles.statIconBlue}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{loading ? '...' : stats.professionals}</span>
            <span className={styles.statLabel}>Profesionales</span>
          </div>
        </Link>
      </div>

      {/* Recent Subscriptions Card */}
      {recentSubscriptions.length > 0 && (
        <div className={styles.recentCard}>
          <div className={styles.recentHeader}>
            <div className={styles.recentIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
            </div>
            <div className={styles.recentTitle}>
              <span>Suscripciones recientes</span>
            </div>
          </div>
          <div className={styles.recentList}>
            {recentSubscriptions.slice(0, 3).map((sub) => (
              <div key={sub.id} className={styles.recentItem}>
                <div className={styles.recentUser}>
                  <div className={styles.recentAvatar}>
                    {sub.user.firstName.charAt(0)}{sub.user.lastName.charAt(0)}
                  </div>
                  <div className={styles.recentInfo}>
                    <span className={styles.recentName}>{sub.user.firstName} {sub.user.lastName}</span>
                    <span className={styles.recentPlan}>
                      {sub.plan?.name || 'Sin plan'}
                      <span className={styles.statusBadge} style={{ color: getStatusColor(sub.status) }}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </span>
                  </div>
                </div>
                <div className={styles.recentActions}>
                  <Link href={`/admin/clients/${sub.user.id}`} className={styles.viewBtn}>
                    Ver
                  </Link>
                </div>
              </div>
            ))}
          </div>
          <Link href="/admin/subscriptions" className={styles.recentViewAll}>
            Ver todas las suscripciones
          </Link>
        </div>
      )}

      {/* Revenue Card */}
      <div className={styles.revenueCard}>
        <div className={styles.revenueHeader}>
          <span className={styles.revenueLabel}>Ingresos Mensuales</span>
          <span className={styles.revenueBadge}>Estimado</span>
        </div>
        <div className={styles.revenueValue}>
          {loading ? '...' : formatCurrency(stats.monthlyRevenue)}
        </div>
        <div className={styles.revenueBar}>
          <div className={styles.revenueProgress} style={{ width: '75%' }} />
        </div>
        <div className={styles.revenueMeta}>
          Basado en {stats.activeClients} suscripciones activas
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.actionsSection}>
        <h3 className={styles.sectionTitle}>Acciones rápidas</h3>
        <div className={styles.actionsGrid}>
          <Link href="/admin/leads" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Leads</span>
          </Link>

          <Link href="/admin/clients" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Clientes</span>
          </Link>

          <Link href="/admin/routines" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="9" x2="15" y2="9" />
                <line x1="9" y1="13" x2="15" y2="13" />
                <line x1="9" y1="17" x2="12" y2="17" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Rutinas</span>
          </Link>

          <Link href="/admin/settings" className={styles.actionCard}>
            <div className={styles.actionIcon}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>
            <span className={styles.actionLabel}>Config</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
