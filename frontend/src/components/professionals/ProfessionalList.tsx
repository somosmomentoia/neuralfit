'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ProfessionalList.module.css';

export interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  professionalProfile: {
    specialty: string | null;
    bio: string | null;
    _count: {
      assignedClients: number;
    };
  } | null;
}

interface ProfessionalListProps {
  professionals: Professional[];
  detailBasePath?: string;
}

export function ProfessionalList({
  professionals,
  detailBasePath = '/admin/professionals',
}: ProfessionalListProps) {
  const [expandedPro, setExpandedPro] = useState<string | null>(null);

  const toggleExpand = (proId: string) => {
    setExpandedPro(expandedPro === proId ? null : proId);
  };

  if (professionals.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <p>No hay profesionales disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.proList}>
      {professionals.map((pro) => {
        const isExpanded = expandedPro === pro.id;
        const clientCount = pro.professionalProfile?._count?.assignedClients || 0;
        
        return (
          <div 
            key={pro.id} 
            className={`${styles.proCard} ${isExpanded ? styles.expanded : ''}`}
          >
            {/* Card Header - Clickable */}
            <div 
              className={styles.cardHeader}
              onClick={() => toggleExpand(pro.id)}
            >
              <div className={styles.cardHeaderLeft}>
                <div className={styles.avatar}>
                  {pro.firstName.charAt(0)}{pro.lastName.charAt(0)}
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.proName}>{pro.firstName} {pro.lastName}</h3>
                  <span className={styles.separator}>·</span>
                  <span className={styles.email}>{pro.email}</span>
                  {pro.professionalProfile?.specialty && (
                    <>
                      <span className={styles.separator}>·</span>
                      <span className={styles.specialtyBadge}>{pro.professionalProfile.specialty}</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className={styles.cardHeaderRight}>
                <span className={`${styles.statusBadge} ${pro.isActive ? styles.active : styles.inactive}`}>
                  {pro.isActive ? 'Activo' : 'Inactivo'}
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
                  {pro.phone && (
                    <div className={styles.detailItem}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                      </svg>
                      <span>{pro.phone}</span>
                    </div>
                  )}
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                    </svg>
                    <span>{clientCount} cliente{clientCount !== 1 ? 's' : ''} asignado{clientCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>Desde {new Date(pro.createdAt).toLocaleDateString('es-AR')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  {detailBasePath && (
                    <Link href={`${detailBasePath}/${pro.id}`} className={`${styles.actionBtn} ${styles.primary}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver perfil
                    </Link>
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
