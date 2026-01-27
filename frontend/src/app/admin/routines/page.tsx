'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface Routine {
  id: string;
  name: string;
  description: string | null;
  coverImage: string | null;
  category: 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA';
  level: number;
  objective: string | null;
  intensity: number;
  isTemplate: boolean;
  sport: { name: string } | null;
  createdBy: { firstName: string; lastName: string };
  _count: { exercises: number };
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

export default function RoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRoutines = async () => {
    try {
      const res = await apiFetch('/admin/routines');
      const data = await res.json();
      setRoutines(data.routines || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const filteredRoutines = filter === 'ALL' 
    ? routines 
    : filter === 'TEMPLATE'
      ? routines.filter(r => r.isTemplate)
      : routines.filter(r => r.category === filter);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Rutinas</h1>
          <p className={styles.subtitle}>Templates y rutinas personalizadas</p>
        </div>
        <button className={styles.addButton}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva Rutina
        </button>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{routines.length}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.templates}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{routines.filter(r => r.isTemplate).length}</span>
            <span className={styles.statLabel}>templates</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.musculacion}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.5 6.5h11"/>
            <path d="M6.5 17.5h11"/>
            <path d="M4 10v4"/>
            <path d="M20 10v4"/>
            <path d="M2 8v8"/>
            <path d="M22 8v8"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{routines.filter(r => r.category === 'MUSCULACION').length}</span>
            <span className={styles.statLabel}>musculación</span>
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        {['ALL', 'TEMPLATE', 'MUSCULACION', 'AEROBICA', 'DEPORTISTA'].map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Todas' : f === 'TEMPLATE' ? 'Templates' : categoryLabels[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando rutinas...</div>
      ) : filteredRoutines.length === 0 ? (
        <GlassCard className={styles.empty}>
          <p>No hay rutinas</p>
          <button className={styles.addButton}>
            Crear primera rutina
          </button>
        </GlassCard>
      ) : (
        <div className={styles.routinesGrid}>
          {filteredRoutines.map((routine) => {
            const isExpanded = expandedId === routine.id;
            return (
              <GlassCard 
                key={routine.id} 
                className={`${styles.routineCard} ${isExpanded ? styles.expanded : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : routine.id)}
              >
                {/* Header - siempre visible */}
                <div className={styles.routineHeader}>
                  <div className={styles.routineInfo}>
                    <h3 className={styles.routineName}>{routine.name}</h3>
                    {routine.objective && (
                      <p className={styles.routineObjective}>{routine.objective}</p>
                    )}
                  </div>
                  <div className={styles.routineHeaderRight}>
                    <span className={`${styles.badge} ${styles[routine.category.toLowerCase()]}`}>
                      {categoryLabels[routine.category]}
                    </span>
                    <svg 
                      className={`${styles.chevron} ${isExpanded ? styles.rotated : ''}`}
                      width="20" 
                      height="20" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>

                {/* Contenido expandido */}
                <div className={`${styles.routineDetails} ${isExpanded ? styles.show : ''}`}>
                  <div className={styles.routineBadges}>
                    {routine.isTemplate && (
                      <span className={styles.templateBadge}>Template</span>
                    )}
                    {routine.sport && (
                      <span className={styles.sportBadge}>{routine.sport.name}</span>
                    )}
                  </div>

                  <div className={styles.routineMeta}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Nivel</span>
                      <div className={styles.levelDots}>
                        {[1, 2, 3, 4, 5].map((l) => (
                          <span key={l} className={`${styles.levelDot} ${l <= routine.level ? styles.filled : ''}`} />
                        ))}
                      </div>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Intensidad</span>
                      <div className={styles.levelDots}>
                        {[1, 2, 3, 4, 5].map((l) => (
                          <span key={l} className={`${styles.levelDot} ${l <= routine.intensity ? styles.filled : ''}`} />
                        ))}
                      </div>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaValue}>{routine._count.exercises}</span>
                      <span className={styles.metaLabel}>ejercicios</span>
                    </div>
                  </div>

                  <div className={styles.routineActions}>
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        router.push(`/admin/routines/${routine.id}`);
                      }}
                    >
                      Ver detalle
                    </button>
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); }}
                    >
                      Editar
                    </button>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
}
