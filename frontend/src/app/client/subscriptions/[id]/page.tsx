'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import Link from 'next/link';

interface Subscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  type: string;
  startDate: string | null;
  endDate: string | null;
  autoRenew: boolean;
  cancelledAt: string | null;
  gym: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    description: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    description: string | null;
  } | null;
}

export default function SubscriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const res = await apiFetch(`/client/subscriptions/${params.id}`);
        const data = await res.json();
        setSubscription(data.subscription);
      } catch (error) {
        console.error('Error fetching subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchSubscription();
    }
  }, [params.id]);

  const handleCancel = async () => {
    if (!subscription) return;
    
    setCancelling(true);
    try {
      const res = await apiFetch(`/client/subscriptions/${subscription.id}/cancel`, {
        method: 'PUT',
      });
      
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
        setShowCancelModal(false);
      } else {
        const error = await res.json();
        alert(error.error || 'Error al cancelar la suscripción');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Error al cancelar la suscripción');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ACTIVE': return { label: 'Activa', class: styles.statusActive };
      case 'PENDING': return { label: 'Pendiente', class: styles.statusPending };
      case 'EXPIRED': return { label: 'Vencida', class: styles.statusExpired };
      case 'CANCELLED': return { label: 'Cancelada', class: styles.statusCancelled };
      case 'SUSPENDED': return { label: 'Suspendida', class: styles.statusSuspended };
      default: return { label: status, class: '' };
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>Suscripción no encontrada</h2>
          <Link href="/client/plan" className={styles.backLink}>
            Volver a mis planes
          </Link>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo(subscription.status);
  const daysRemaining = getDaysRemaining(subscription.endDate);
  const isCancelled = subscription.cancelledAt !== null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className={styles.title}>Detalle de Suscripción</h1>
      </div>

      {/* Gym Card */}
      <div className={styles.gymCard}>
        <div className={styles.gymHeader}>
          {subscription.gym.logo ? (
            <img src={subscription.gym.logo} alt={subscription.gym.name} className={styles.gymLogo} />
          ) : (
            <div className={styles.gymLogoPlaceholder}>
              {subscription.gym.name.charAt(0)}
            </div>
          )}
          <div className={styles.gymInfo}>
            <h2 className={styles.gymName}>{subscription.gym.name}</h2>
            <span className={`${styles.status} ${statusInfo.class}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>
        {subscription.gym.description && (
          <p className={styles.gymDescription}>{subscription.gym.description}</p>
        )}
      </div>

      {/* Plan Details */}
      <div className={styles.detailsCard}>
        <h3 className={styles.sectionTitle}>Plan Actual</h3>
        <div className={styles.planInfo}>
          <div className={styles.planName}>{subscription.plan?.name || 'Sin plan'}</div>
          {subscription.plan?.description && (
            <p className={styles.planDescription}>{subscription.plan.description}</p>
          )}
          <div className={styles.planPrice}>
            ${subscription.plan?.price?.toLocaleString('es-AR') || 0}
            <span>/mes</span>
          </div>
        </div>
      </div>

      {/* Subscription Info */}
      <div className={styles.detailsCard}>
        <h3 className={styles.sectionTitle}>Información de la Suscripción</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Fecha de inicio</span>
            <span className={styles.infoValue}>{formatDate(subscription.startDate)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Fecha de vencimiento</span>
            <span className={styles.infoValue}>{formatDate(subscription.endDate)}</span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Días restantes</span>
            <span className={styles.infoValue}>
              {daysRemaining !== null ? (
                <span className={daysRemaining <= 5 ? styles.daysWarning : ''}>
                  {daysRemaining} días
                </span>
              ) : '-'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Renovación automática</span>
            <span className={styles.infoValue}>
              {subscription.autoRenew ? (
                <span className={styles.autoRenewOn}>Activada</span>
              ) : (
                <span className={styles.autoRenewOff}>Desactivada</span>
              )}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Método de pago</span>
            <span className={styles.infoValue}>💳 MercadoPago</span>
          </div>
          {isCancelled && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Cancelada el</span>
              <span className={styles.infoValue}>{formatDate(subscription.cancelledAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation Notice */}
      {isCancelled && subscription.status === 'ACTIVE' && (
        <div className={styles.cancelNotice}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>Suscripción cancelada</strong>
            <p>Tu acceso continúa activo hasta el {formatDate(subscription.endDate)}. Después de esa fecha, no se renovará automáticamente.</p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <Link href="/client/branches" className={styles.secondaryBtn}>
          Ver sucursales
        </Link>
        
        {subscription.status === 'ACTIVE' && !isCancelled && (
          <button 
            className={styles.cancelBtn}
            onClick={() => setShowCancelModal(true)}
          >
            Cancelar suscripción
          </button>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCancelModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h3 className={styles.modalTitle}>¿Cancelar suscripción?</h3>
            <p className={styles.modalText}>
              Tu acceso a <strong>{subscription.gym.name}</strong> continuará activo hasta el <strong>{formatDate(subscription.endDate)}</strong>.
              <br /><br />
              Después de esa fecha, no se renovará automáticamente y perderás acceso al gimnasio.
            </p>
            <div className={styles.modalActions}>
              <button 
                className={styles.modalCancelBtn}
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Mantener suscripción
              </button>
              <button 
                className={styles.modalConfirmBtn}
                onClick={handleCancel}
                disabled={cancelling}
              >
                {cancelling ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
