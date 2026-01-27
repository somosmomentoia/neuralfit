'use client';

import { GlassCard } from '@/components/ui';
import styles from './LeadCard.module.css';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  source: string | null;
  notes: string | null;
  createdAt: string;
}

interface LeadCardProps {
  lead: Lead;
  statusLabels: Record<string, string>;
  statusColors: Record<string, string>;
  onEdit: () => void;
  onDelete: () => void;
  onConvert: () => void;
}

export function LeadCard({ lead, statusLabels, statusColors, onEdit, onDelete, onConvert }: LeadCardProps) {
  const canConvert = lead.status !== 'CONVERTED' && lead.status !== 'LOST';

  return (
    <GlassCard padding="md" className={styles.card}>
      <div className={styles.main}>
        <div className={styles.avatar}>
          {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
        </div>
        <div className={styles.info}>
          <h3 className={styles.name}>{lead.firstName} {lead.lastName}</h3>
          <p className={styles.email}>{lead.email}</p>
          {lead.phone && <p className={styles.phone}>{lead.phone}</p>}
        </div>
        <div 
          className={styles.status}
          style={{ backgroundColor: `${statusColors[lead.status]}20`, color: statusColors[lead.status] }}
        >
          {statusLabels[lead.status]}
        </div>
      </div>

      {lead.source && (
        <div className={styles.meta}>
          <span className={styles.source}>Fuente: {lead.source}</span>
        </div>
      )}

      <div className={styles.actions}>
        <button className={styles.actionBtn} onClick={onEdit}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Editar
        </button>
        {canConvert && (
          <button className={`${styles.actionBtn} ${styles.convert}`} onClick={onConvert}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <polyline points="16 11 18 13 22 9"/>
            </svg>
            Convertir
          </button>
        )}
        <button className={`${styles.actionBtn} ${styles.delete}`} onClick={onDelete}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          Eliminar
        </button>
      </div>
    </GlassCard>
  );
}
