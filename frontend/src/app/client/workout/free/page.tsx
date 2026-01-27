'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

// ==================== TYPES ====================
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  category: string;
  difficulty: number;
  description: string | null;
  videoUrl: string | null;
  caloriesPerRep: number;
}

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  completedSeries: never[];
  isCompleted: boolean;
}

// ==================== MAIN COMPONENT ====================
export default function FreeWorkoutSelectionPage() {
  const router = useRouter();
  
  // State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [workoutName, setWorkoutName] = useState('');
  const [saveAsRoutine, setSaveAsRoutine] = useState(false);

  // ==================== LOAD EXERCISES ====================
  useEffect(() => {
    const loadExercises = async () => {
      try {
        const res = await apiFetch('/client/exercises/global');
        const data = await res.json();
        setExercises(data.exercises || []);
      } catch (error) {
        console.error('Error loading exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    loadExercises();
  }, []);

  // ==================== HANDLERS ====================
  const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup).filter(Boolean))] as string[];
  
  const filteredExercises = selectedMuscle
    ? exercises.filter(e => e.muscleGroup === selectedMuscle)
    : exercises;

  const toggleExerciseSelection = (exercise: Exercise) => {
    const isSelected = selectedExercises.some(e => e.exercise.id === exercise.id);
    
    if (isSelected) {
      setSelectedExercises(prev => prev.filter(e => e.exercise.id !== exercise.id));
    } else {
      const newExercise: WorkoutExercise = {
        id: `free-${exercise.id}-${Date.now()}`,
        exercise,
        targetSets: 3,
        targetReps: 12,
        restSeconds: 60,
        completedSeries: [],
        isCompleted: false,
      };
      setSelectedExercises(prev => [...prev, newExercise]);
    }
  };

  const startWorkout = () => {
    if (selectedExercises.length === 0) return;
    
    // Store exercises in sessionStorage for the workout page
    const workoutData = {
      exercises: selectedExercises,
      workoutName: workoutName.trim() || 'Entrenamiento Libre',
      saveAsRoutine,
    };
    
    try {
      sessionStorage.setItem('freeWorkoutExercises', JSON.stringify(workoutData));
      // Navigate to the unified workout page with 'free' type parameter
      // Use window.location for more reliable navigation with sessionStorage
      window.location.href = '/client/workout/free-workout?type=free';
    } catch (error) {
      console.error('Error saving to sessionStorage:', error);
      alert('Error al iniciar el entrenamiento');
    }
  };

  // ==================== RENDER ====================
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* Selection Phase */}
      <div className={styles.selectionPhase}>
        <div className={styles.selectionHeader}>
          <h2 className={styles.selectionTitle}>Arma tu entrenamiento</h2>
          <p className={styles.selectionSubtitle}>Selecciona los ejercicios que quieras realizar</p>
        </div>

        {/* Workout name input */}
        <div className={styles.nameInputSection}>
          <input
            type="text"
            className={styles.nameInput}
            placeholder="Nombre del entrenamiento (opcional)"
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
          />
          <label className={styles.saveAsRoutineLabel}>
            <input
              type="checkbox"
              checked={saveAsRoutine}
              onChange={(e) => setSaveAsRoutine(e.target.checked)}
              className={styles.saveAsRoutineCheckbox}
            />
            <span className={styles.saveAsRoutineText}>Guardar como rutina</span>
          </label>
          
          {/* Start button - below name input */}
          {selectedExercises.length > 0 && (
            <button 
              className={styles.startWorkoutBtn}
              onClick={startWorkout}
            >
              Comenzar ({selectedExercises.length} ejercicio{selectedExercises.length !== 1 ? 's' : ''})
            </button>
          )}
        </div>

        {/* Muscle filter pills */}
        <div className={styles.muscleFilter}>
          <button
            className={`${styles.musclePill} ${!selectedMuscle ? styles.musclePillActive : ''}`}
            onClick={() => setSelectedMuscle(null)}
          >
            Todos
          </button>
          {muscleGroups.map(muscle => (
            <button
              key={muscle}
              className={`${styles.musclePill} ${selectedMuscle === muscle ? styles.musclePillActive : ''}`}
              onClick={() => setSelectedMuscle(muscle)}
            >
              {muscle}
            </button>
          ))}
        </div>

        {/* Exercise list */}
        {filteredExercises.length === 0 ? (
          <div className={styles.emptyState}>
            <svg className={styles.emptyStateIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6.5 6.5h11v11h-11z"/>
              <path d="M21 15V6a2 2 0 0 0-2-2H6"/>
              <path d="M3 9v10a2 2 0 0 0 2 2h13"/>
            </svg>
            <p className={styles.emptyStateText}>No hay ejercicios disponibles</p>
          </div>
        ) : (
          <div className={styles.exerciseList}>
            {filteredExercises.map(exercise => {
              const isSelected = selectedExercises.some(e => e.exercise.id === exercise.id);
              return (
                <div
                  key={exercise.id}
                  className={`${styles.exerciseItem} ${isSelected ? styles.exerciseItemSelected : ''}`}
                  onClick={() => toggleExerciseSelection(exercise)}
                >
                  <div className={styles.exerciseCheckbox}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div className={styles.exerciseItemInfo}>
                    <div className={styles.exerciseItemName}>{exercise.name}</div>
                    <div className={styles.exerciseItemMuscle}>{exercise.muscleGroup || 'General'}</div>
                  </div>
                  <div className={styles.exerciseItemSeries}>3 series</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
