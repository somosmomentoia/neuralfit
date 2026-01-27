'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  description: string | null;
  difficulty: number;
  videoUrl: string | null;
}

interface RoutineExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  restSeconds: number;
  notes: string | null;
  order: number;
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  category: string;
  level: number;
  objective: string | null;
  intensity: number;
  estimatedMinutes: number | null;
  exercises: RoutineExercise[];
  isOwn?: boolean;
  assignedBy?: string | null;
  assignedByGym?: string | null;
  dayAssignments?: { dayOfWeek: number }[];
}

const CATEGORY_LABELS: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Cardio',
  DEPORTISTA: 'Deportiva',
};

export default function RoutineDetailPage() {
  const params = useParams();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const res = await apiFetch(`/client/routine/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setRoutine(data.routine);
        }
      } catch (error) {
        console.error('Error fetching routine:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, [params.id]);

  if (loading) {
    return <div className={styles.loading}>Cargando rutina...</div>;
  }

  if (!routine) {
    return (
      <div className={styles.container}>
        <Link href="/client/routines" className={styles.backBtn}>
          ← Volver
        </Link>
        <div className={styles.empty}>
          <p>Rutina no encontrada</p>
        </div>
      </div>
    );
  }

  const sortedExercises = [...routine.exercises].sort((a, b) => a.order - b.order);
  
  // Obtener grupos musculares únicos
  const muscleGroups = [...new Set(
    sortedExercises
      .map(e => e.exercise.muscleGroup)
      .filter(Boolean)
  )];

  return (
    <div className={styles.container}>
      <Link href="/client/routines" className={styles.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Volver
      </Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.badges}>
          <span className={styles.badge}>{CATEGORY_LABELS[routine.category] || routine.category}</span>
          <span className={styles.badge}>Nivel {routine.level}</span>
        </div>
        <h1 className={styles.title}>{routine.name}</h1>
        {routine.objective && (
          <p className={styles.objective}>{routine.objective}</p>
        )}
        
        {/* Info del creador */}
        <div className={styles.creatorInfo}>
          {routine.isOwn ? (
            <>
              <div className={styles.creatorIcon}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </div>
              <div className={styles.creatorText}>
                <span className={styles.creatorLabel}>Creada por ti</span>
                <span className={styles.creatorSub}>Rutina personal</span>
              </div>
              <span className={styles.badgeOwn}>Propia</span>
            </>
          ) : routine.assignedBy && (
            <>
              <div className={styles.creatorIconAssigned}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <div className={styles.creatorText}>
                <span className={styles.creatorLabel}>{routine.assignedBy}</span>
                <span className={styles.creatorSub}>
                  {routine.assignedByGym ? routine.assignedByGym : 'Entrenador'}
                </span>
              </div>
              <span className={styles.badgeAssigned}>Asignada</span>
            </>
          )}
        </div>
        
        {/* Días asignados (solo para rutinas asignadas por profesional) */}
        {!routine.isOwn && routine.dayAssignments && routine.dayAssignments.length > 0 && (
          <div className={styles.assignedDays}>
            <span className={styles.assignedDaysLabel}>Días asignados:</span>
            <div className={styles.dayPills}>
              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                const isAssigned = routine.dayAssignments?.some(d => d.dayOfWeek === day);
                const dayNames: Record<number, string> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };
                return (
                  <span 
                    key={day} 
                    className={`${styles.dayPill} ${isAssigned ? styles.dayPillActive : ''}`}
                  >
                    {dayNames[day]}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.meta}>
          <span>{sortedExercises.length} ejercicios</span>
          {routine.estimatedMinutes && <span>~{routine.estimatedMinutes} min</span>}
          <span>Intensidad {routine.intensity}/5</span>
        </div>
        {routine.isOwn && (
          <Link href={`/client/routines/${routine.id}/edit`} className={styles.editDaysBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Editar días asignados
          </Link>
        )}
      </div>

      {/* Grupos musculares */}
      {muscleGroups.length > 0 && (
        <div className={styles.muscleGroups}>
          <h3 className={styles.sectionTitle}>Grupos musculares</h3>
          <div className={styles.muscleList}>
            {muscleGroups.map(group => (
              <span key={group} className={styles.muscleTag}>{group}</span>
            ))}
          </div>
        </div>
      )}

      {/* Lista de ejercicios */}
      <div className={styles.exercisesList}>
        <h3 className={styles.sectionTitle}>Ejercicios</h3>
        {sortedExercises.map((item, index) => (
          <div 
            key={item.id} 
            className={`${styles.exerciseCard} ${expandedExercise === item.id ? styles.expanded : ''}`}
          >
            <div 
              className={styles.exerciseHeader}
              onClick={() => setExpandedExercise(expandedExercise === item.id ? null : item.id)}
            >
              <div className={styles.exerciseNumber}>{index + 1}</div>
              <div className={styles.exerciseInfo}>
                <h4 className={styles.exerciseName}>{item.exercise.name}</h4>
                <p className={styles.exerciseMeta}>
                  {item.sets} series × {item.reps} reps
                  {item.restSeconds > 0 && ` • ${item.restSeconds}s descanso`}
                </p>
              </div>
              <div className={styles.expandIcon}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d={expandedExercise === item.id ? "M18 15l-6-6-6 6" : "M6 9l6 6 6-6"}/>
                </svg>
              </div>
            </div>

            {expandedExercise === item.id && (
              <div className={styles.exerciseDetails}>
                {item.exercise.muscleGroup && (
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Grupo muscular</span>
                    <span className={styles.detailValue}>{item.exercise.muscleGroup}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Dificultad</span>
                  <div className={styles.difficultyDots}>
                    {[1, 2, 3, 4, 5].map((level) => (
                      <span 
                        key={level} 
                        className={`${styles.dot} ${level <= item.exercise.difficulty ? styles.filled : ''}`}
                      />
                    ))}
                  </div>
                </div>
                {item.exercise.description && (
                  <div className={styles.detailBlock}>
                    <span className={styles.detailLabel}>Descripción</span>
                    <p>{item.exercise.description}</p>
                  </div>
                )}
                {item.notes && (
                  <div className={styles.detailBlock}>
                    <span className={styles.detailLabel}>Notas del entrenador</span>
                    <p>{item.notes}</p>
                  </div>
                )}
                {item.exercise.videoUrl && (
                  <a 
                    href={item.exercise.videoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.videoBtn}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="5 3 19 12 5 21 5 3"/>
                    </svg>
                    Ver video tutorial
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {routine.description && (
        <div className={styles.descriptionSection}>
          <h3 className={styles.sectionTitle}>Descripción</h3>
          <p>{routine.description}</p>
        </div>
      )}
    </div>
  );
}
