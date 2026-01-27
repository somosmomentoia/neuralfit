'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './SubscriptionList.module.css';

export interface Subscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  type: string;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    durationDays: number;
  } | null;
  assignedProfessional: {
    user: { firstName: string; lastName: string };
  } | null;
}

interface SubscriptionListProps {
  subscriptions: Subscription[];
  onActivate?: (sub: Subscription) => void;
  clientDetailPath?: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  PENDING: 'Pendiente',
  EXPIRED: 'Vencido',
  CANCELLED: 'Cancelado',
  SUSPENDED: 'Suspendido',
};

const statusColors: Record<string, { bg: string; color: string }> = {
  ACTIVE: { bg: 'rgba(34, 197, 94, 0.15)', color: '#22C55E' },
  PENDING: { bg: 'rgba(255, 193, 7, 0.15)', color: '#FFC107' },
  EXPIRED: { bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' },
  CANCELLED: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF' },
  SUSPENDED: { bg: 'rgba(156, 163, 175, 0.15)', color: '#9CA3AF' },
};

export function SubscriptionList({
  subscriptions,
  onActivate,
  clientDetailPath = '/admin/clients',
}: SubscriptionListProps) {
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const toggleExpand = (subId: string) => {
    setExpandedSub(expandedSub === subId ? null : subId);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  if (subscriptions.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <p>No hay suscripciones disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.subList}>
      {subscriptions.map((sub) => {
        const isExpanded = expandedSub === sub.id;
        const colors = statusColors[sub.status] || statusColors.CANCELLED;
        
        return (
          <div 
            key={sub.id} 
            className={`${styles.subCard} ${isExpanded ? styles.expanded : ''}`}
          >
            {/* Card Header - Clickable */}
            <div 
              className={styles.cardHeader}
              onClick={() => toggleExpand(sub.id)}
            >
              <div className={styles.cardHeaderLeft}>
                <div className={styles.avatar}>
                  {sub.user.firstName.charAt(0)}{sub.user.lastName.charAt(0)}
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.userName}>{sub.user.firstName} {sub.user.lastName}</h3>
                  <span className={styles.separator}>·</span>
                  <span className={styles.planName}>{sub.plan?.name || 'Sin plan'}</span>
                  <span className={styles.separator}>·</span>
                  <span className={styles.price}>${sub.plan?.price || 0}</span>
                </div>
              </div>
              
              <div className={styles.cardHeaderRight}>
                <span 
                  className={styles.statusBadge}
                  style={{ backgroundColor: colors.bg, color: colors.color }}
                >
                  {statusLabels[sub.status]}
                </span>
                <div className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className={styles.cardContent}>
                <div className={styles.detailsRow}>
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <span>{sub.user.email}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Vence: {formatDate(sub.endDate)}</span>
                  </div>
                  {sub.assignedProfessional && (
                    <div className={styles.detailItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>Entrenador: {sub.assignedProfessional.user.firstName} {sub.assignedProfessional.user.lastName}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <Link href={`${clientDetailPath}/${sub.user.id}`} className={`${styles.actionBtn} ${styles.primary}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    Ver cliente
                  </Link>

                  {sub.status === 'PENDING' && onActivate && (
                    <button 
                      className={`${styles.actionBtn} ${styles.activate}`}
                      onClick={(e) => { e.stopPropagation(); onActivate(sub); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Activar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
