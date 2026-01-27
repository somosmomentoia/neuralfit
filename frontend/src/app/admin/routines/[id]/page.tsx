'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface RoutineExercise {
  id: string;
  order: number;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string | null;
    category: string;
    difficulty: number;
  };
}

interface ClientAssignment {
  id: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  clientProfile: {
    id: string;
    user: { firstName: string; lastName: string };
  };
}

interface Routine {
  id: string;
  name: string;
  description: string | null;
  category: 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA';
  level: number;
  objective: string | null;
  intensity: number;
  isTemplate: boolean;
  exercises: RoutineExercise[];
  clientRoutines: ClientAssignment[];
  createdBy: { firstName: string; lastName: string };
  _count: { exercises: number; clientRoutines: number };
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

export default function AdminRoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoutine = async () => {
    try {
      const res = await apiFetch(`/admin/routines/${params.id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setRoutine(data.routine);
    } catch (error) {
      console.error('Error fetching routine:', error);
      router.push('/admin/routines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutine();
  }, [params.id]);

  if (loading) {
    return <div className={styles.loading}>Cargando rutina...</div>;
  }

  if (!routine) {
    return <div className={styles.loading}>Rutina no encontrada</div>;
  }

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
        Volver
      </button>

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles[routine.category.toLowerCase()]}`}>
              {categoryLabels[routine.category]}
            </span>
            {routine.isTemplate && <span className={styles.templateBadge}>Template</span>}
          </div>
          <h1 className={styles.title}>{routine.name}</h1>
          {routine.objective && <p className={styles.objective}>{routine.objective}</p>}
          <p className={styles.createdBy}>
            Creado por {routine.createdBy.firstName} {routine.createdBy.lastName}
          </p>
        </div>
      </div>

      <GlassCard className={styles.statsCard}>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{routine._count.exercises}</span>
          <span className={styles.statLabel}>Ejercicios</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Nivel</span>
          <div className={styles.levelDots}>
            {[1, 2, 3, 4, 5].map((l) => (
              <span key={l} className={`${styles.levelDot} ${l <= routine.level ? styles.filled : ''}`} />
            ))}
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statLabel}>Intensidad</span>
          <div className={styles.levelDots}>
            {[1, 2, 3, 4, 5].map((l) => (
              <span key={l} className={`${styles.levelDot} ${l <= routine.intensity ? styles.filled : ''}`} />
            ))}
          </div>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statValue}>{routine._count.clientRoutines}</span>
          <span className={styles.statLabel}>Asignaciones</span>
        </div>
      </GlassCard>

      {routine.description && (
        <GlassCard className={styles.descriptionCard}>
          <h3 className={styles.sectionTitle}>Descripción</h3>
          <p className={styles.description}>{routine.description}</p>
        </GlassCard>
      )}

      <h2 className={styles.sectionTitle}>Ejercicios ({routine.exercises.length})</h2>
      <div className={styles.exercisesList}>
        {routine.exercises.map((re, index) => (
          <GlassCard key={re.id} className={styles.exerciseCard}>
            <div className={styles.exerciseOrder}>{index + 1}</div>
            <div className={styles.exerciseInfo}>
              <h4 className={styles.exerciseName}>{re.exercise.name}</h4>
              <p className={styles.exerciseMeta}>
                {re.exercise.muscleGroup && <span>{re.exercise.muscleGroup}</span>}
              </p>
            </div>
            <div className={styles.exerciseDetails}>
              {re.sets && <span className={styles.detail}>{re.sets} series</span>}
              {re.reps && <span className={styles.detail}>{re.reps} reps</span>}
              {re.restSeconds && <span className={styles.detail}>{re.restSeconds}s descanso</span>}
            </div>
          </GlassCard>
        ))}
      </div>

      {routine.clientRoutines.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>Clientes asignados ({routine.clientRoutines.length})</h2>
          <div className={styles.clientsList}>
            {routine.clientRoutines.map((cr) => (
              <GlassCard key={cr.id} className={styles.clientCard}>
                <div className={styles.clientInfo}>
                  <span className={styles.clientName}>
                    {cr.clientProfile.user.firstName} {cr.clientProfile.user.lastName}
                  </span>
                  <span className={styles.clientDate}>
                    Desde {new Date(cr.startDate).toLocaleDateString()}
                  </span>
                </div>
                <span className={`${styles.statusBadge} ${cr.isActive ? styles.active : ''}`}>
                  {cr.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </GlassCard>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
