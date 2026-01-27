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
  _count: { exercises: number };
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

export default function ProfessionalRoutinesPage() {
  const router = useRouter();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [templates, setTemplates] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'mine' | 'templates'>('mine');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRoutines = async () => {
    try {
      const [myRes, templatesRes] = await Promise.all([
        apiFetch('/professional/routines'),
        apiFetch('/professional/routines/templates'),
      ]);
      const myData = await myRes.json();
      const templatesData = await templatesRes.json();
      setRoutines(myData.routines || []);
      setTemplates(templatesData.routines || []);
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const displayedRoutines = tab === 'mine' ? routines : templates;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Rutinas</h1>
          <p className={styles.subtitle}>Crea y asigna rutinas a tus clientes</p>
        </div>
        <button className={styles.addButton} onClick={() => router.push('/professional/routines/create')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nueva
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${tab === 'mine' ? styles.active : ''}`}
          onClick={() => setTab('mine')}
        >
          Mis rutinas ({routines.length})
        </button>
        <button 
          className={`${styles.tab} ${tab === 'templates' ? styles.active : ''}`}
          onClick={() => setTab('templates')}
        >
          Templates ({templates.length})
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando rutinas...</div>
      ) : displayedRoutines.length === 0 ? (
        <GlassCard className={styles.empty}>
          <p>{tab === 'mine' ? 'No has creado rutinas aún' : 'No hay templates disponibles'}</p>
          {tab === 'mine' && (
            <button className={styles.addButton} onClick={() => router.push('/professional/routines/create')}>
              Crear rutina
            </button>
          )}
        </GlassCard>
      ) : (
        <div className={styles.routinesGrid}>
          {displayedRoutines.map((routine) => {
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
                      <span className={styles.metaValue}>{routine._count.exercises}</span>
                      <span className={styles.metaLabel}>ejercicios</span>
                    </div>
                  </div>

                  <div className={styles.routineActions}>
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        router.push(`/professional/routines/${routine.id}`);
                      }}
                    >
                      Ver detalle
                    </button>
                    {tab === 'templates' ? (
                      <button 
                        className={styles.actionBtn}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          router.push(`/professional/routines/${routine.id}`);
                        }}
                      >
                        Usar template
                      </button>
                    ) : (
                      <button 
                        className={styles.actionBtn}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          router.push(`/professional/routines/${routine.id}`);
                        }}
                      >
                        Asignar
                      </button>
                    )}
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
