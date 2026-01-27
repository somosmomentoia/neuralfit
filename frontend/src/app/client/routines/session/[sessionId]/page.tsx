'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface SeriesData {
  setNumber: number;
  reps: number;
  weight: number;
}

interface ExerciseCompleted {
  id: string;
  exerciseId?: string;
  name: string;
  muscleGroup: string | null;
  sets: { reps: number; weight: number }[] | number;
  seriesData?: SeriesData[];
  caloriesPerRep?: number;
  reps?: string;
}

interface SessionDetail {
  id: string;
  date: string;
  completed: boolean;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  isFreeWorkout: boolean;
  sessionName?: string;
  exercisesCompleted: ExerciseCompleted[];
  routineName?: string;
}

export default function SessionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [session, setSession] = useState<SessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedExercises, setExpandedExercises] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await apiFetch(`/client/workout/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setSession(data.session);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchSession();
    }
  }, [sessionId]);

  const getSetsArray = (exercise: ExerciseCompleted): { reps: number; weight: number }[] => {
    // Primero intentar usar seriesData si existe
    if (exercise.seriesData && Array.isArray(exercise.seriesData)) {
      return exercise.seriesData.map(s => ({ reps: s.reps, weight: s.weight }));
    }
    if (!exercise.sets) return [];
    if (Array.isArray(exercise.sets)) return exercise.sets;
    // Si sets es un número, crear array con ese número de sets
    if (typeof exercise.sets === 'number') {
      const repsPerSet = parseInt(exercise.reps || '12') || 12;
      return Array.from({ length: exercise.sets }, () => ({ reps: repsPerSet, weight: 0 }));
    }
    // Si sets es un objeto, intentar convertirlo
    if (typeof exercise.sets === 'object') {
      return Object.values(exercise.sets);
    }
    return [];
  };

  const toggleExercise = (index: number) => {
    setExpandedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const calculateIntensity = (exercise: ExerciseCompleted): number => {
    const sets = getSetsArray(exercise);
    if (sets.length === 0) return 0;
    
    const totalWeight = sets.reduce((sum, s) => sum + (s.weight || 0), 0);
    const totalReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const avgWeight = totalWeight / sets.length;
    const setsCount = sets.length;
    
    const weightScore = Math.min(avgWeight / 100, 1) * 40;
    const repsScore = Math.min(totalReps / 50, 1) * 35;
    const setsScore = Math.min(setsCount / 5, 1) * 25;
    
    return Math.round(weightScore + repsScore + setsScore);
  };

  const getIntensityLabel = (intensity: number): string => {
    if (intensity >= 80) return 'Muy Alta';
    if (intensity >= 60) return 'Alta';
    if (intensity >= 40) return 'Media';
    return 'Baja';
  };

  const getIntensityColor = (intensity: number): string => {
    if (intensity >= 80) return '#ef4444';
    if (intensity >= 60) return '#f97316';
    if (intensity >= 40) return '#eab308';
    return '#22c55e';
  };

  const calculateExerciseCalories = (exercise: ExerciseCompleted): number => {
    const sets = getSetsArray(exercise);
    const totalReps = sets.reduce((sum, s) => sum + (s.reps || 0), 0);
    const caloriesPerRep = exercise.caloriesPerRep || 0.5;
    return Math.round(totalReps * caloriesPerRep);
  };

  const calculateTotalVolume = (): number => {
    if (!session?.exercisesCompleted) return 0;
    return session.exercisesCompleted.reduce((total, ex) => {
      const sets = getSetsArray(ex);
      return total + sets.reduce((sum, s) => sum + ((s.reps || 0) * (s.weight || 0)), 0);
    }, 0);
  };

  const calculateTotalReps = (): number => {
    if (!session?.exercisesCompleted) return 0;
    return session.exercisesCompleted.reduce((total, ex) => {
      const sets = getSetsArray(ex);
      return total + sets.reduce((sum, s) => sum + (s.reps || 0), 0);
    }, 0);
  };

  const calculateOverallIntensity = (): number => {
    if (!session?.exercisesCompleted || session.exercisesCompleted.length === 0) return 0;
    const intensities = session.exercisesCompleted.map(ex => calculateIntensity(ex));
    return Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner} />
        <span>Cargando sesión...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>No se encontró la sesión</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const date = new Date(session.date);
  const overallIntensity = calculateOverallIntensity();

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backButton}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <h1 className={styles.headerTitle}>
            {session.isFreeWorkout ? 'Entrenamiento Libre' : (session.sessionName || 'Entrenamiento')}
          </h1>
          <span className={styles.headerDate}>
            {date.toLocaleDateString('es-AR', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long' 
            })}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <span className={styles.statValue}>{session.durationMinutes || 0}</span>
          <span className={styles.statLabel}>Minutos</span>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 23c-3.5 0-6.4-2.9-6.4-6.4 0-2.5 2.1-5.1 4.2-7.6.6-.7 1.2-1.4 1.7-2.1.2-.2.4-.3.5-.3.1 0 .3.1.5.3.5.7 1.1 1.4 1.7 2.1 2.1 2.5 4.2 5.1 4.2 7.6 0 3.5-2.9 6.4-6.4 6.4z"/>
            </svg>
          </div>
          <span className={styles.statValue}>{session.caloriesBurned || 0}</span>
          <span className={styles.statLabel}>Calorías</span>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 20V10M12 20V4M6 20v-6"/>
            </svg>
          </div>
          <span className={styles.statValue}>{overallIntensity}%</span>
          <span className={styles.statLabel}>Intensidad</span>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <span className={styles.statValue}>{calculateTotalVolume().toLocaleString()}</span>
          <span className={styles.statLabel}>Kg volumen</span>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className={styles.secondaryStats}>
        <div className={styles.secondaryStat}>
          <div className={styles.secondaryIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12h16M4 6h16M4 18h16"/>
            </svg>
          </div>
          <span className={styles.secondaryValue}>{calculateTotalReps()}</span>
          <span className={styles.secondaryLabel}>Reps totales</span>
        </div>
        <div className={styles.secondaryStat}>
          <div className={styles.secondaryIcon}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="10" width="3" height="4" rx="0.5" />
              <rect x="19" y="10" width="3" height="4" rx="0.5" />
              <rect x="5" y="8" width="3" height="8" rx="0.5" />
              <rect x="16" y="8" width="3" height="8" rx="0.5" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <span className={styles.secondaryValue}>{session.exercisesCompleted?.length || 0}</span>
          <span className={styles.secondaryLabel}>Ejercicios</span>
        </div>
      </div>

      {/* Exercises List */}
      <div className={styles.exercisesSection}>
        <h2 className={styles.sectionTitle}>Ejercicios realizados</h2>
        
        <div className={styles.exercisesList}>
          {session.exercisesCompleted?.map((exercise, index) => {
            const intensity = calculateIntensity(exercise);
            const intensityColor = getIntensityColor(intensity);
            const exerciseCalories = calculateExerciseCalories(exercise);
            const sets = getSetsArray(exercise);
            const isExpanded = expandedExercises.has(index);
            const totalVolume = sets.reduce((sum, s) => sum + (s.reps * s.weight), 0);
            
            return (
              <div key={index} className={styles.exerciseCard}>
                <div 
                  className={styles.exerciseHeader}
                  onClick={() => toggleExercise(index)}
                >
                  <div className={styles.exerciseCheckIcon}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className={styles.exerciseInfo}>
                    <span className={styles.exerciseName}>{exercise.name}</span>
                    <span className={styles.exerciseMeta}>
                      {sets.length} series • {exerciseCalories} kcal
                      {exercise.muscleGroup && ` • ${exercise.muscleGroup}`}
                    </span>
                  </div>
                  <div className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className={styles.exerciseDetails}>
                    {/* Intensity Bar */}
                    <div className={styles.intensityContainer}>
                      <div className={styles.intensityInfo}>
                        <span className={styles.intensityTitle}>Intensidad</span>
                        <span 
                          className={styles.intensityValue}
                          style={{ color: intensityColor }}
                        >
                          {getIntensityLabel(intensity)} ({intensity}%)
                        </span>
                      </div>
                      <div className={styles.intensityBar}>
                        <div 
                          className={styles.intensityFill}
                          style={{ 
                            width: `${intensity}%`,
                            background: `linear-gradient(90deg, ${intensityColor}88, ${intensityColor})`
                          }}
                        />
                      </div>
                    </div>

                    {/* Exercise Stats */}
                    <div className={styles.exerciseStats}>
                      <div className={styles.exerciseStat}>
                        <span className={styles.exerciseStatValue}>{totalVolume.toLocaleString()}</span>
                        <span className={styles.exerciseStatLabel}>kg volumen</span>
                      </div>
                      <div className={styles.exerciseStat}>
                        <span className={styles.exerciseStatValue}>{sets.reduce((sum, s) => sum + s.reps, 0)}</span>
                        <span className={styles.exerciseStatLabel}>reps totales</span>
                      </div>
                      <div className={styles.exerciseStat}>
                        <span className={styles.exerciseStatValue}>{exerciseCalories}</span>
                        <span className={styles.exerciseStatLabel}>kcal</span>
                      </div>
                    </div>
                    
                    {/* Sets Detail */}
                    <div className={styles.setsDetail}>
                      <div className={styles.setsDetailHeader}>
                        <span>Serie</span>
                        <span>Peso</span>
                        <span>Reps</span>
                      </div>
                      {sets.map((set, setIndex) => (
                        <div key={setIndex} className={styles.setsDetailRow}>
                          <span className={styles.setNumber}>{setIndex + 1}</span>
                          <span className={styles.setWeight}>{set.weight} kg</span>
                          <span className={styles.setReps}>{set.reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
