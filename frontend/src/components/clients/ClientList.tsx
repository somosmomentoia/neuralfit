'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ClientList.module.css';

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  clientProfile: {
    subscriptionStatus: 'ACTIVE' | 'INACTIVE' | 'CANCELLED';
    plan: {
      id: string;
      name: string;
    } | null;
  } | null;
}

interface ClientListProps {
  clients: Client[];
  onEdit?: (client: Client) => void;
  onDelete?: (id: string) => void;
  detailBasePath?: string;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  ACTIVE: '#22C55E',
  INACTIVE: '#F59E0B',
  CANCELLED: '#EF4444',
};

export function ClientList({
  clients,
  onEdit,
  onDelete,
  detailBasePath = '/admin/clients',
}: ClientListProps) {
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  const toggleExpand = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  if (clients.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <p>No hay clientes disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.clientsList}>
      {clients.map((client) => {
        const isExpanded = expandedClient === client.id;
        const status = client.clientProfile?.subscriptionStatus || 'INACTIVE';
        
        return (
          <div 
            key={client.id} 
            className={`${styles.clientCard} ${isExpanded ? styles.expanded : ''}`}
          >
            {/* Card Header - Clickable */}
            <div 
              className={styles.cardHeader}
              onClick={() => toggleExpand(client.id)}
            >
              <div className={styles.cardHeaderLeft}>
                <div className={styles.avatar}>
                  {client.firstName.charAt(0)}{client.lastName.charAt(0)}
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.clientName}>{client.firstName} {client.lastName}</h3>
                  <span className={styles.separator}>·</span>
                  <span className={styles.email}>{client.email}</span>
                  {client.clientProfile?.plan && (
                    <>
                      <span className={styles.separator}>·</span>
                      <span className={styles.planBadge}>{client.clientProfile.plan.name}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.cardHeaderRight}>
                <span 
                  className={styles.statusBadge}
                  style={{ 
                    backgroundColor: `${statusColors[status]}20`, 
                    color: statusColors[status] 
                  }}
                >
                  {statusLabels[status]}
                </span>
                <div className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className={styles.cardContent}>
                <div className={styles.detailsRow}>
                  {client.phone && (
                    <div className={styles.detailItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                      </svg>
                      <span>{client.phone}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Desde {new Date(client.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  {detailBasePath && (
                    <Link href={`${detailBasePath}/${client.id}`} className={`${styles.actionBtn} ${styles.primary}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver ficha
                    </Link>
                  )}

                  {onEdit && (
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); onEdit(client); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Editar
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
