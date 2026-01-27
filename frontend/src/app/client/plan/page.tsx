'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface PlanFeature {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string | null;
  durationDays: number;
  features: { feature: PlanFeature }[];
}

interface Gym {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  branches: { name: string; address: string }[];
  plans: Plan[];
  _count: { subscriptions: number };
  currentSubscription?: Subscription | null;
}

interface Subscription {
  id: string;
  status: string;
  type: string;
  source: 'ADMIN_GRANTED' | 'PLATFORM_PURCHASE' | 'LEAD_CONVERSION';
  startDate: string | null;
  endDate: string | null;
  gym: {
    id: string;
    name: string;
    logo: string | null;
  };
  plan: Plan | null;
}

export default function ClientPlanPage() {
  const searchParams = useSearchParams();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [availableGyms, setAvailableGyms] = useState<Gym[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const initialTab = searchParams.get('tab') === 'explore' ? 'explore' : 'subscriptions';
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'explore'>(initialTab);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);
  const [expandedGym, setExpandedGym] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subscriptionsRes, gymsRes] = await Promise.all([
          apiFetch('/client/subscriptions'),
          apiFetch('/client/gyms'),
        ]);

        const subscriptionsData = await subscriptionsRes.json();
        const gymsData = await gymsRes.json();

        const subs = (subscriptionsData.subscriptions || []).sort((a: Subscription, b: Subscription) => {
          // Primero por status (ACTIVE primero)
          if (a.status !== b.status) {
            return a.status === 'ACTIVE' ? -1 : 1;
          }
          // Luego por source (PLATFORM_PURCHASE primero)
          if (a.source !== b.source) {
            return a.source === 'PLATFORM_PURCHASE' ? -1 : 1;
          }
          return 0;
        });
        setSubscriptions(subs);
        
        // Mapear gyms con su suscripción actual (si existe)
        const allGyms = (gymsData.gyms || []).map((g: Gym) => {
          const currentSub = subs.find((s: Subscription) => s.gym.id === g.id);
          return { ...g, currentSubscription: currentSub || null };
        });
        setAvailableGyms(allGyms);
        
        if ((subscriptionsData.subscriptions || []).length === 0) {
          setActiveTab('explore');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const openPaymentModal = (gym: Gym, plan: Plan) => {
    setSelectedGym(gym);
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const handleSubscribe = async () => {
    if (!selectedGym || !selectedPlan) return;
    
    setSubscribing(true);
    setSubscribeError(null);
    
    try {
      const res = await apiFetch('/client/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ gymId: selectedGym.id, planId: selectedPlan.id, type: 'MONTHLY' }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setSubscribeError(data.error);
        return;
      }
      
      setSubscriptions(prev => [...prev, data.subscription]);
      setAvailableGyms(prev => prev.filter(g => g.id !== selectedGym.id));
      setSelectedGym(null);
      setSelectedPlan(null);
      setShowPaymentModal(false);
      setActiveTab('subscriptions');
    } catch (error) {
      console.error('Error subscribing:', error);
      setSubscribeError('Error al suscribirse');
    } finally {
      setSubscribing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(price);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No definido';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'PENDING': return 'Pendiente';
      case 'EXPIRED': return 'Vencido';
      case 'CANCELLED': return 'Cancelado';
      case 'SUSPENDED': return 'Suspendido';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return styles.statusActive;
      case 'PENDING': return styles.statusPending;
      case 'EXPIRED': return styles.statusExpired;
      default: return styles.statusInactive;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'subscriptions' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          Mis Membresías ({subscriptions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'explore' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('explore')}
        >
          Explorar Gyms
        </button>
      </div>

      {activeTab === 'subscriptions' ? (
        <>
          {subscriptions.length > 0 ? (
            <div className={styles.subscriptionsList}>
              {subscriptions.map(sub => {
                const isExpanded = expandedSub === sub.id;
                return (
                  <div 
                    key={sub.id} 
                    className={`${styles.subscriptionCard} ${isExpanded ? styles.expanded : ''}`}
                    onClick={() => setExpandedSub(isExpanded ? null : sub.id)}
                  >
                    <div className={styles.subHeader}>
                      <div className={styles.subGymIcon}>
                        {sub.gym.logo ? (
                          <img src={sub.gym.logo} alt={sub.gym.name} />
                        ) : (
                          <span>{sub.gym.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={styles.subInfo}>
                        <h3 className={styles.subGymName}>{sub.gym.name}</h3>
                        <span className={styles.subPlanName}>{sub.plan?.name || 'Sin plan'}</span>
                      </div>
                      {sub.source === 'ADMIN_GRANTED' || sub.source === 'LEAD_CONVERSION' ? (
                        <span className={styles.grantedBadge}>
                          Otorgada
                        </span>
                      ) : (
                        <span className={`${styles.subStatus} ${getStatusClass(sub.status)}`}>
                          {getStatusLabel(sub.status)}
                        </span>
                      )}
                    </div>
                    <div className={styles.subDetails}>
                      <div className={styles.subDetail}>
                        <span className={styles.subLabel}>Vencimiento</span>
                        <span className={styles.subValue}>{formatDate(sub.endDate)}</span>
                      </div>
                      {sub.source === 'PLATFORM_PURCHASE' ? (
                        <>
                          <div className={styles.subDetail}>
                            <span className={styles.subLabel}>Pago</span>
                            <span className={styles.subValue}>MercadoPago</span>
                          </div>
                          {sub.plan && (
                            <div className={styles.subDetail}>
                              <span className={styles.subLabel}>Precio</span>
                              <span className={styles.subValue}>{formatPrice(sub.plan.price)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={styles.subDetail}>
                          <span className={styles.subLabel}>Tipo</span>
                          <span className={styles.subValue}>Membresía del gym</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Mensaje informativo para membresías otorgadas */}
                    {(sub.source === 'ADMIN_GRANTED' || sub.source === 'LEAD_CONVERSION') && isExpanded && (
                      <div className={styles.grantedInfo}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 16v-4"/>
                          <path d="M12 8h.01"/>
                        </svg>
                        <span>Para renovar o modificar esta membresía, contacta directamente al gym</span>
                      </div>
                    )}
                    
                    {/* Botón expandible Ver detalle */}
                    <div className={`${styles.subExpandBtn} ${isExpanded ? styles.visible : ''}`}>
                      <a 
                        href={`/client/subscriptions/${sub.id}`}
                        className={styles.viewDetailBtn}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span>Ver detalle completo</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 18l6-6-6-6"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="5" width="20" height="14" rx="2"/>
                  <path d="M2 10h20"/>
                </svg>
              </div>
              <p className={styles.emptyText}>No tienes membresías activas</p>
              <button className={styles.exploreBtn} onClick={() => setActiveTab('explore')}>
                Explorar gimnasios
              </button>
            </div>
          )}

        </>
      ) : (
        <>
          {availableGyms.length > 0 ? (
            <div className={styles.gymsList}>
              {availableGyms.map(gym => {
                const hasSubscription = !!gym.currentSubscription;
                const currentPlanId = gym.currentSubscription?.plan?.id;
                const isExpanded = expandedGym === gym.id;
                const lowestPrice = gym.plans.length > 0 
                  ? Math.min(...gym.plans.map(p => p.price))
                  : null;
                
                return (
                  <div 
                    key={gym.id} 
                    className={`${styles.gymCard} ${hasSubscription ? styles.subscribedGym : ''} ${isExpanded ? styles.gymExpanded : ''}`}
                    onClick={() => setExpandedGym(isExpanded ? null : gym.id)}
                  >
                    <div className={styles.gymHeader}>
                      <div className={styles.gymLogo}>
                        {gym.logo ? (
                          <img src={gym.logo} alt={gym.name} />
                        ) : (
                          <span>{gym.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={styles.gymInfo}>
                        <h3 className={styles.gymName}>{gym.name}</h3>
                        <span className={styles.gymFromPrice}>
                          {lowestPrice ? `Desde ${formatPrice(lowestPrice)}` : 'Sin planes'}
                        </span>
                      </div>
                      {hasSubscription && (
                        <span className={styles.subscribedBadge}>Suscrito</span>
                      )}
                    </div>
                    
                    <div className={styles.gymDetails}>
                      <div className={styles.gymDetail}>
                        <span className={styles.gymLabel}>Ubicación</span>
                        <span className={styles.gymValue}>
                          {gym.branches.length > 0 ? gym.branches[0].address : 'Sin sede'}
                        </span>
                      </div>
                      <div className={styles.gymDetail}>
                        <span className={styles.gymLabel}>Miembros</span>
                        <span className={styles.gymValue}>{gym._count.subscriptions}</span>
                      </div>
                      <div className={styles.gymDetail}>
                        <span className={styles.gymLabel}>Sedes</span>
                        <span className={styles.gymValue}>{gym.branches.length}</span>
                      </div>
                    </div>
                    
                    {/* Contenido expandible */}
                    <div className={`${styles.gymExpandContent} ${isExpanded ? styles.visible : ''}`}>
                      {gym.description && (
                        <p className={styles.gymDescription}>{gym.description}</p>
                      )}
                      
                      {hasSubscription && gym.currentSubscription?.plan && (
                        <div className={styles.currentPlanInfo}>
                          <span className={styles.currentPlanLabel}>Tu plan actual:</span>
                          <span className={styles.currentPlanName}>{gym.currentSubscription.plan.name}</span>
                          <span className={styles.currentPlanExpiry}>
                            Vence: {formatDate(gym.currentSubscription.endDate)}
                          </span>
                        </div>
                      )}
                      
                      <div className={styles.gymPlans}>
                        <h4 className={styles.plansTitle}>
                          {hasSubscription ? 'Cambiar de plan' : 'Planes disponibles'}
                        </h4>
                        {gym.plans.map(plan => {
                          const isCurrentPlan = plan.id === currentPlanId;
                          return (
                            <div key={plan.id} className={`${styles.planOption} ${isCurrentPlan ? styles.currentPlan : ''}`}>
                              <div className={styles.planInfo}>
                                <span className={styles.planName}>
                                  {plan.name}
                                  {isCurrentPlan && <span className={styles.currentTag}>Actual</span>}
                                </span>
                                <span className={styles.planDuration}>{plan.durationDays} días</span>
                              </div>
                              <div className={styles.planPriceAction}>
                                <span className={styles.planPrice}>{formatPrice(plan.price)}</span>
                                {!isCurrentPlan && (
                                  <button
                                    className={styles.subscribeBtn}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openPaymentModal(gym, plan);
                                    }}
                                    disabled={subscribing}
                                  >
                                    {hasSubscription ? 'Cambiar' : 'Suscribirse'}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="M21 21l-4.35-4.35"/>
                </svg>
              </div>
              <p className={styles.emptyText}>No hay gimnasios disponibles</p>
              <p className={styles.emptySubtext}>Ya estás suscrito a todos los gimnasios disponibles</p>
            </div>
          )}
        </>
      )}

      {subscribeError && (
        <div className={styles.errorToast}>
          {subscribeError}
          <button onClick={() => setSubscribeError(null)}>×</button>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedGym && selectedPlan && (
        <div className={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Confirmar suscripción</h2>
              <button className={styles.modalClose} onClick={() => setShowPaymentModal(false)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.paymentSummary}>
                <div className={styles.summaryGym}>
                  <div className={styles.summaryGymLogo}>
                    {selectedGym.logo ? (
                      <img src={selectedGym.logo} alt={selectedGym.name} />
                    ) : (
                      <span>{selectedGym.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className={styles.summaryGymInfo}>
                    <h3>{selectedGym.name}</h3>
                    <span>{selectedPlan.name}</span>
                  </div>
                </div>
                
                <div className={styles.summaryDetails}>
                  <div className={styles.summaryRow}>
                    <span>Duración</span>
                    <span>{selectedPlan.durationDays} días</span>
                  </div>
                  <div className={styles.summaryRow}>
                    <span>Precio mensual</span>
                    <span>{formatPrice(selectedPlan.price)}</span>
                  </div>
                </div>
                
                <div className={styles.summaryTotal}>
                  <span>Total a pagar</span>
                  <span className={styles.totalPrice}>{formatPrice(selectedPlan.price)}</span>
                </div>
              </div>
              
              <div className={styles.paymentMethod}>
                <div className={styles.mpBadge}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="4" fill="#009ee3"/>
                    <path d="M6 12h12M12 6v12" stroke="white" strokeWidth="2"/>
                  </svg>
                  <span>Pago seguro con MercadoPago</span>
                </div>
                <p className={styles.mpNote}>
                  Serás redirigido a MercadoPago para completar el pago de forma segura.
                  Tu suscripción se activará automáticamente.
                </p>
              </div>
            </div>
            
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelBtn} 
                onClick={() => setShowPaymentModal(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.payBtn} 
                onClick={handleSubscribe}
                disabled={subscribing}
              >
                {subscribing ? 'Procesando...' : `Pagar ${formatPrice(selectedPlan.price)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
