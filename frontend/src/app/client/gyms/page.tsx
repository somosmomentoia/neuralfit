'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Branch {
  id: string;
  name: string;
  address: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  durationDays: number;
}

interface Gym {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  branches: Branch[];
  plans: Plan[];
  _count: { subscriptions: number };
}

export default function GymsPage() {
  const router = useRouter();
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const res = await apiFetch('/client/gyms/available');
        const data = await res.json();
        setGyms(data.gyms || []);
      } catch (error) {
        console.error('Error fetching gyms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGyms();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const handleSubscribe = (gymId: string) => {
    router.push(`/client/plan?gym=${gymId}`);
  };

  if (loading) {
    return <div className={styles.loading}>Cargando gimnasios...</div>;
  }

  return (
    <div className={styles.container}>
      <p className={styles.subtitle}>
        Explora los gimnasios disponibles y sus planes
      </p>

      {/* Lista de gimnasios */}
      <div className={styles.gymsList}>
        {gyms.length === 0 ? (
          <div className={styles.emptyState}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>No hay gimnasios disponibles en este momento</p>
          </div>
        ) : (
          gyms.map((gym) => (
            <div 
              key={gym.id} 
              className={`${styles.gymCard} ${selectedGym?.id === gym.id ? styles.gymCardExpanded : ''}`}
              onClick={() => setSelectedGym(selectedGym?.id === gym.id ? null : gym)}
            >
              <div className={styles.gymHeader}>
                <div className={styles.gymLogo}>
                  {gym.logo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={gym.logo} alt={gym.name} />
                  ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M6.5 6.5h11v11h-11z" />
                      <path d="M6.5 6.5L12 2l5.5 4.5" />
                      <path d="M9 17.5v-5h6v5" />
                    </svg>
                  )}
                </div>
                <div className={styles.gymInfo}>
                  <h3 className={styles.gymName}>{gym.name}</h3>
                  <div className={styles.gymMeta}>
                    <span className={styles.gymBranches}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {gym.branches.length} {gym.branches.length === 1 ? 'sucursal' : 'sucursales'}
                    </span>
                    <span className={styles.gymMembers}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      {gym._count.subscriptions} miembros
                    </span>
                  </div>
                </div>
                <div className={styles.gymArrow}>
                  <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ transform: selectedGym?.id === gym.id ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  >
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>

              {/* Contenido expandido */}
              {selectedGym?.id === gym.id && (
                <div className={styles.gymDetails}>
                  {gym.description && (
                    <p className={styles.gymDescription}>{gym.description}</p>
                  )}

                  {/* Sucursales */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Sucursales</h4>
                    <div className={styles.branchesList}>
                      {gym.branches.map((branch) => (
                        <div key={branch.id} className={styles.branchItem}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          <div>
                            <span className={styles.branchName}>{branch.name}</span>
                            <span className={styles.branchAddress}>{branch.address}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Planes */}
                  <div className={styles.section}>
                    <h4 className={styles.sectionTitle}>Planes disponibles</h4>
                    <div className={styles.plansList}>
                      {gym.plans.map((plan) => (
                        <div key={plan.id} className={styles.planItem}>
                          <div className={styles.planInfo}>
                            <span className={styles.planName}>{plan.name}</span>
                            <span className={styles.planPrice}>{formatPrice(plan.price)}/mes</span>
                          </div>
                          {plan.description && (
                            <p className={styles.planDescription}>{plan.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Botón de suscripción */}
                  <button 
                    className={styles.subscribeBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(gym.id);
                    }}
                  >
                    VER MEMBRESÍAS
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
