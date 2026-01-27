'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface Exercise {
  id: string;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string | null;
    category: string;
    difficulty: number;
    description: string | null;
    videoUrl: string | null;
  };
  sets: number;
  reps: string;
  weight: number | null;
  restSeconds: number;
  notes: string | null;
  order: number;
}

interface Routine {
  id: string;
  routine: {
    id: string;
    name: string;
    description: string | null;
    category: string;
    level: number;
    objective: string | null;
    intensity: number;
    coverImage: string | null;
  };
  exercises: Exercise[];
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

export default function ClientRoutinePage() {
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const res = await apiFetch('/client/routine/active');
        const data = await res.json();
        setActiveRoutine(data.routine);
      } catch (error) {
        console.error('Error fetching routine:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRoutine();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Cargando rutina...</div>;
  }

  if (!activeRoutine) {
    return (
      <div className={styles.container}>
        <Link href="/client" className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </Link>
        <GlassCard className={styles.empty}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <h2>Sin rutina activa</h2>
          <p>Tu entrenador aún no te ha asignado una rutina</p>
        </GlassCard>
      </div>
    );
  }

  const routine = activeRoutine.routine;
  const sortedExercises = [...activeRoutine.exercises].sort((a, b) => a.order - b.order);
  const currentExercise = sortedExercises[currentExerciseIndex];
  const totalExercises = sortedExercises.length;

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    setCurrentExerciseIndex(0);
    setCompletedExercises(new Set());
  };

  const handleCompleteExercise = () => {
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExerciseIndex);
    setCompletedExercises(newCompleted);
    
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handleFinishWorkout = () => {
    setWorkoutStarted(false);
    setCurrentExerciseIndex(0);
    setCompletedExercises(new Set());
    alert('¡Felicitaciones! Has completado tu entrenamiento 💪');
  };

  const handleExitWorkout = () => {
    if (confirm('¿Seguro que quieres salir del entrenamiento?')) {
      setWorkoutStarted(false);
      setCurrentExerciseIndex(0);
      setCompletedExercises(new Set());
    }
  };

  // Workout Mode View
  if (workoutStarted && currentExercise) {
    const isLastExercise = currentExerciseIndex === totalExercises - 1;
    const isCompleted = completedExercises.has(currentExerciseIndex);

    return (
      <div className={styles.workoutContainer}>
        <div className={styles.workoutHeader}>
          <button className={styles.exitBtn} onClick={handleExitWorkout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <div className={styles.workoutProgress}>
            <span className={styles.progressText}>
              Ejercicio {currentExerciseIndex + 1} de {totalExercises}
            </span>
            <div className={styles.progressBar}>
              <div 
                className={styles.progressFill} 
                style={{ width: `${((currentExerciseIndex + (isCompleted ? 1 : 0)) / totalExercises) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className={styles.currentExercise}>
          <div className={styles.exerciseNumberLarge}>{currentExerciseIndex + 1}</div>
          <h1 className={styles.currentExerciseName}>{currentExercise.exercise.name}</h1>
          
          {currentExercise.exercise.muscleGroup && (
            <span className={styles.muscleGroup}>{currentExercise.exercise.muscleGroup}</span>
          )}

          <div className={styles.exerciseStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{currentExercise.sets}</span>
              <span className={styles.statLabel}>Series</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>{currentExercise.reps}</span>
              <span className={styles.statLabel}>Reps</span>
            </div>
            {currentExercise.restSeconds && (
              <div className={styles.stat}>
                <span className={styles.statValue}>{currentExercise.restSeconds}s</span>
                <span className={styles.statLabel}>Descanso</span>
              </div>
            )}
          </div>

          {currentExercise.exercise.description && (
            <div className={styles.exerciseDescription}>
              <p>{currentExercise.exercise.description}</p>
            </div>
          )}

          {currentExercise.notes && (
            <div className={styles.trainerNotes}>
              <span className={styles.notesLabel}>💡 Nota del entrenador:</span>
              <p>{currentExercise.notes}</p>
            </div>
          )}

          {currentExercise.exercise.videoUrl && (
            <a 
              href={currentExercise.exercise.videoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.videoBtnLarge}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              Ver video tutorial
            </a>
          )}
        </div>

        <div className={styles.workoutActions}>
          {currentExerciseIndex > 0 && (
            <button 
              className={styles.prevBtn}
              onClick={() => setCurrentExerciseIndex(currentExerciseIndex - 1)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Anterior
            </button>
          )}
          
          {isLastExercise ? (
            <button className={styles.finishBtn} onClick={handleFinishWorkout}>
              🎉 Finalizar Entrenamiento
            </button>
          ) : (
            <button className={styles.nextBtn} onClick={handleCompleteExercise}>
              Completado - Siguiente
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
          )}
        </div>

        <div className={styles.exerciseIndicators}>
          {sortedExercises.map((_, idx) => (
            <button
              key={idx}
              className={`${styles.indicator} ${idx === currentExerciseIndex ? styles.current : ''} ${completedExercises.has(idx) ? styles.done : ''}`}
              onClick={() => setCurrentExerciseIndex(idx)}
            >
              {completedExercises.has(idx) ? '✓' : idx + 1}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Normal View (List of exercises)
  return (
    <div className={styles.container}>
      <Link href="/client" className={styles.backBtn}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Volver
      </Link>

      <div 
        className={styles.hero}
        style={{
          backgroundImage: routine.coverImage 
            ? `url(${routine.coverImage})` 
            : 'linear-gradient(135deg, var(--color-bg-2) 0%, var(--color-bg-1) 100%)'
        }}
      >
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <div className={styles.badges}>
            <span className={`${styles.badge} ${styles[routine.category.toLowerCase()]}`}>
              {categoryLabels[routine.category]}
            </span>
            <span className={styles.badge}>Nivel {routine.level}</span>
          </div>
          <h1 className={styles.routineName}>{routine.name}</h1>
          {routine.objective && (
            <p className={styles.objective}>{routine.objective}</p>
          )}
          <div className={styles.meta}>
            <span>{totalExercises} ejercicios</span>
            <span>•</span>
            <span>Intensidad {routine.intensity}/5</span>
          </div>
        </div>
      </div>

      <div className={styles.exercisesList}>
        <h2 className={styles.sectionTitle}>Ejercicios</h2>
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
                <h3 className={styles.exerciseName}>{item.exercise.name}</h3>
                <p className={styles.exerciseMeta}>
                  {item.sets} series × {item.reps} reps
                  {item.weight && ` • ${item.weight}kg`}
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
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Grupo muscular</span>
                    <span className={styles.detailValue}>{item.exercise.muscleGroup}</span>
                  </div>
                )}
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Descanso</span>
                  <span className={styles.detailValue}>{item.restSeconds}s entre series</span>
                </div>
                <div className={styles.detailItem}>
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
                  <div className={styles.description}>
                    <span className={styles.detailLabel}>Descripción</span>
                    <p>{item.exercise.description}</p>
                  </div>
                )}
                {item.notes && (
                  <div className={styles.notes}>
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

      <button className={styles.startBtn} onClick={handleStartWorkout}>
        🏋️ Comenzar Entrenamiento
      </button>
    </div>
  );
}
