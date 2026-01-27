'use client';

import { useState } from 'react';
import styles from './LeadList.module.css';

export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: 'NEW' | 'CONTACTED' | 'VISITED' | 'CONVERTED' | 'LOST';
  source: string | null;
  notes: string | null;
  createdAt: string;
}

interface LeadListProps {
  leads: Lead[];
  onEdit?: (lead: Lead) => void;
  onDelete?: (id: string) => void;
  onConvert?: (lead: Lead) => void;
}

const statusLabels: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISITED: 'Visitó',
  CONVERTED: 'Convertido',
  LOST: 'Perdido',
};

const statusColors: Record<string, string> = {
  NEW: 'var(--color-primary)',
  CONTACTED: 'var(--color-secondary)',
  VISITED: '#F59E0B',
  CONVERTED: '#22C55E',
  LOST: '#EF4444',
};

export function LeadList({
  leads,
  onEdit,
  onDelete,
  onConvert,
}: LeadListProps) {
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const toggleExpand = (leadId: string) => {
    setExpandedLead(expandedLead === leadId ? null : leadId);
  };

  if (leads.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <line x1="19" y1="8" x2="19" y2="14"/>
          <line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        <p>No hay leads disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.leadsList}>
      {leads.map((lead) => {
        const isExpanded = expandedLead === lead.id;
        const canConvert = lead.status !== 'CONVERTED' && lead.status !== 'LOST';
        
        return (
          <div 
            key={lead.id} 
            className={`${styles.leadCard} ${isExpanded ? styles.expanded : ''}`}
          >
            {/* Card Header - Clickable */}
            <div 
              className={styles.cardHeader}
              onClick={() => toggleExpand(lead.id)}
            >
              <div className={styles.cardHeaderLeft}>
                <div className={styles.avatar} data-status={lead.status.toLowerCase()}>
                  {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.leadName}>{lead.firstName} {lead.lastName}</h3>
                  <span className={styles.separator}>·</span>
                  <span className={styles.email}>{lead.email}</span>
                  {lead.source && (
                    <>
                      <span className={styles.separator}>·</span>
                      <span className={styles.sourceBadge}>{lead.source}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.cardHeaderRight}>
                <span 
                  className={styles.statusBadge}
                  style={{ 
                    backgroundColor: `color-mix(in srgb, ${statusColors[lead.status]} 20%, transparent)`, 
                    color: statusColors[lead.status] 
                  }}
                >
                  {statusLabels[lead.status]}
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
                  {lead.phone && (
                    <div className={styles.detailItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                      </svg>
                      <span>{lead.phone}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Creado {new Date(lead.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {lead.notes && (
                  <div className={styles.notes}>
                    <span className={styles.notesLabel}>Notas:</span>
                    <p>{lead.notes}</p>
                  </div>
                )}

                {/* Actions */}
                <div className={styles.cardActions}>
                  {canConvert && onConvert && (
                    <button 
                      className={`${styles.actionBtn} ${styles.convert}`}
                      onClick={(e) => { e.stopPropagation(); onConvert(lead); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <polyline points="16 11 18 13 22 9"/>
                      </svg>
                      Convertir a cliente
                    </button>
                  )}

                  {onEdit && (
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); onEdit(lead); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Editar
                    </button>
                  )}

                  {onDelete && (
                    <button 
                      className={`${styles.actionBtn} ${styles.delete}`}
                      onClick={(e) => { e.stopPropagation(); onDelete(lead.id); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6"/>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      Eliminar
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
