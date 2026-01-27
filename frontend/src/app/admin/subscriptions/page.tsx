'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { SubscriptionList, Subscription } from '@/components/subscriptions';

interface Stats {
  total: number;
  active: number;
  pending: number;
  expired: number;
  cancelled: number;
}

interface Professional {
  id: string;
  user: { firstName: string; lastName: string };
  specialty: string | null;
}

type FilterType = 'all' | 'ACTIVE' | 'PENDING' | 'EXPIRED' | 'CANCELLED';

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, expired: 0, cancelled: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [activateModal, setActivateModal] = useState<Subscription | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    try {
      const [subsRes, statsRes, prosRes] = await Promise.all([
        apiFetch(`/admin/subscriptions?status=${filter}&search=${search}`),
        apiFetch('/admin/subscriptions/stats'),
        apiFetch('/admin/professionals'),
      ]);

      const subsData = await subsRes.json();
      const statsData = await statsRes.json();
      const prosData = await prosRes.json();

      setSubscriptions(subsData.subscriptions || []);
      setStats(statsData.stats || { total: 0, active: 0, pending: 0, expired: 0, cancelled: 0 });
      setProfessionals(prosData.professionals || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchData();
  };

  const openActivateModal = (sub: Subscription) => {
    setActivateModal(sub);
    setSelectedProfessional('');
  };

  const handleActivate = async () => {
    if (!activateModal) return;
    
    setActivatingId(activateModal.id);
    try {
      const res = await apiFetch(`/admin/subscriptions/${activateModal.id}/activate`, {
        method: 'PUT',
        body: JSON.stringify({ 
          assignedProfessionalId: selectedProfessional || null 
        }),
      });
      if (res.ok) {
        setActivateModal(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error activating subscription:', error);
    } finally {
      setActivatingId(null);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Suscripciones</h1>
          <p className={styles.subtitle}>Gestiona las membresías de tu gimnasio</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsCard}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.active}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>activas</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.pending}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.pending}</span>
            <span className={styles.statLabel}>pendientes</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.toolbar}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className={styles.searchInput}
          />
          <button onClick={handleSearch} className={styles.searchBtn}>
            Buscar
          </button>
        </div>

        <div className={styles.filters}>
          <button 
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            Todas ({stats.total})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'ACTIVE' ? styles.active : ''}`}
            onClick={() => setFilter('ACTIVE')}
          >
            Activas ({stats.active})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'PENDING' ? styles.active : ''}`}
            onClick={() => setFilter('PENDING')}
          >
            Pendientes ({stats.pending})
          </button>
          <button 
            className={`${styles.filterBtn} ${filter === 'EXPIRED' ? styles.active : ''}`}
            onClick={() => setFilter('EXPIRED')}
          >
            Vencidas ({stats.expired})
          </button>
        </div>

        <div className={styles.resultsCount}>
          {subscriptions.length} suscripci{subscriptions.length !== 1 ? 'ones' : 'ón'}
        </div>

        {/* Subscriptions List */}
        <SubscriptionList
          subscriptions={subscriptions}
          onActivate={openActivateModal}
          clientDetailPath="/admin/clients"
        />
      </div>

      {/* Modal de Activación */}
      {activateModal && (
        <div className={styles.overlay} onClick={() => setActivateModal(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Activar Suscripción</h2>
              <button className={styles.closeBtn} onClick={() => setActivateModal(null)}>×</button>
            </div>

            <div className={styles.modalClient}>
              <span>Cliente: </span>
              <strong>{activateModal.user.firstName} {activateModal.user.lastName}</strong>
            </div>

            <div className={styles.modalPlan}>
              <span>Plan: </span>
              <strong>{activateModal.plan?.name || 'Sin plan'}</strong>
              {activateModal.plan && <span> - ${activateModal.plan.price.toLocaleString()}</span>}
            </div>

            <div className={styles.formField}>
              <label className={styles.label}>Asignar Entrenador (opcional)</label>
              <select
                className={styles.input}
                value={selectedProfessional}
                onChange={(e) => setSelectedProfessional(e.target.value)}
              >
                <option value="">Sin entrenador asignado</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.id}>
                    {pro.user.firstName} {pro.user.lastName}
                    {pro.specialty && ` - ${pro.specialty}`}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelBtn} 
                onClick={() => setActivateModal(null)}
              >
                Cancelar
              </button>
              <button 
                className={styles.submitBtn} 
                onClick={handleActivate}
                disabled={activatingId === activateModal.id}
              >
                {activatingId === activateModal.id ? 'Activando...' : 'Confirmar Activación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
