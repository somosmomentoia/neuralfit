'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

// ==================== TYPES ====================
interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  description: string | null;
  videoUrl: string | null;
  caloriesPerRep: number;
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

interface SeriesData {
  setNumber: number;
  reps: number;
  weight: number;
}

type ExercisePhase = 'setup' | 'active' | 'completed';

interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  targetSets: number;
  targetReps: number;
  restSeconds: number;
  completedSeries: SeriesData[];
  isCompleted: boolean;
  phase: ExercisePhase;
  currentSeriesIndex: number;
  // Timer state per exercise
  exerciseElapsedSeconds: number; // current series time
  totalExerciseTime: number; // accumulated time across all series
  exerciseStartTime: number | null; // timestamp when started
  isPaused: boolean;
  pausedTime: number; // accumulated time when paused
}

interface CompletedExerciseData {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  seriesData: SeriesData[];
  completedAt: string;
}

interface FreeWorkoutData {
  exercises: WorkoutExercise[];
  workoutName?: string;
  saveAsRoutine?: boolean;
}

type WorkoutPhase = 'exercise-start' | 'active' | 'completed';
type WorkoutType = 'routine' | 'free';

// ==================== HELPERS ====================
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function getYouTubeEmbedUrl(url: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    return `https://www.youtube.com/embed/${match[2]}`;
  }
  return null;
}

// ==================== MAIN COMPONENT ====================
export default function WorkoutSessionPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get session ID from URL - can be routine ID or session ID
  const sessionIdOrRoutineId = params.id as string;
  
  // Check if this is a free workout (exercises passed via state)
  const isFreeWorkoutParam = searchParams.get('type') === 'free';
  const workoutType: WorkoutType = isFreeWorkoutParam ? 'free' : 'routine';
  
  // Core state
  const [workoutPhase, setWorkoutPhase] = useState<'training' | 'completed'>('training');
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [routineName, setRoutineName] = useState<string>('Entrenamiento');
  
  // Exercise data
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  
  // Scroll state for carousel (using native CSS scroll-snap)
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  
  // Touch swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  
  // Current series input
  const [currentReps, setCurrentReps] = useState(12);
  const [currentWeight, setCurrentWeight] = useState(0);
  const [currentRestSeconds, setCurrentRestSeconds] = useState(60);
  
  // Timers
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [totalElapsedSeconds, setTotalElapsedSeconds] = useState(0);
  const [exerciseStartTime, setExerciseStartTime] = useState<Date | null>(null);
  const [exerciseElapsedSeconds, setExerciseElapsedSeconds] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [restTimeRemaining, setRestTimeRemaining] = useState(0);
  
  // Play/Pause state for exercise timer
  const [isExercisePaused, setIsExercisePaused] = useState(true);
  const [pausedTime, setPausedTime] = useState(0);
  
  // Animation state for series change
  const [showSeriesAnimation, setShowSeriesAnimation] = useState(false);
  
  // Animation state for timer bounce on play/pause
  const [showTimerBounce, setShowTimerBounce] = useState(false);
  
  // Motivational message state
  const [motivationalMessage, setMotivationalMessage] = useState<string | null>(null);
  
  // Next exercise countdown state
  const [nextExerciseCountdown, setNextExerciseCountdown] = useState<number | null>(null);
  
  // UI state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Free workout specific state
  const [freeWorkoutName, setFreeWorkoutName] = useState('Entrenamiento Libre');
  const [saveAsRoutine, setSaveAsRoutine] = useState(false);
  
  // Stats for completed phase
  const [totalCalories, setTotalCalories] = useState(0);
  
  // Pagination for completed exercises list
  const [exercisesPage, setExercisesPage] = useState(0);
  const exercisesPerPage = 5;

  // ==================== LOAD DATA ====================
  const dataLoadedRef = useRef(false);
  
  useEffect(() => {
    // Prevent double execution in React Strict Mode (only for free workouts that use sessionStorage)
    if (dataLoadedRef.current && workoutType === 'free') return;
    
    const loadData = async () => {
      try {
        console.log('[loadData] Starting, workoutType:', workoutType, 'sessionIdOrRoutineId:', sessionIdOrRoutineId);
        if (workoutType === 'free') {
          // Free workout - get exercises from sessionStorage
          const storedData = sessionStorage.getItem('freeWorkoutExercises');
          if (storedData) {
            dataLoadedRef.current = true;
            const freeData: FreeWorkoutData = JSON.parse(storedData);
            // Ensure all exercises have the new properties
            const exercisesWithPhase = freeData.exercises.map(ex => ({
              ...ex,
              phase: ex.phase || 'setup' as ExercisePhase,
              currentSeriesIndex: ex.currentSeriesIndex || 0,
              exerciseElapsedSeconds: ex.exerciseElapsedSeconds || 0,
              totalExerciseTime: ex.totalExerciseTime || 0,
              exerciseStartTime: ex.exerciseStartTime || null,
              isPaused: ex.isPaused !== undefined ? ex.isPaused : true,
              pausedTime: ex.pausedTime || 0,
            }));
            setSelectedExercises(exercisesWithPhase);
            setRoutineName(freeData.workoutName || 'Entrenamiento Libre');
            setFreeWorkoutName(freeData.workoutName || 'Entrenamiento Libre');
            setSaveAsRoutine(freeData.saveAsRoutine || false);
            // Clear storage after loading
            sessionStorage.removeItem('freeWorkoutExercises');
          } else {
            // No exercises, redirect back
            router.push('/client/workout/free');
            return;
          }
        } else {
          // Routine workout - load session from API (ID is sessionId, not routineId)
          console.log('[loadData] Fetching routine session...');
          const res = await apiFetch(`/client/workout/${sessionIdOrRoutineId}`);
          const data = await res.json();
          console.log('[loadData] Session data received:', data);
          
          // Set session ID
          const resolvedSessionId = data.session?.id || sessionIdOrRoutineId;
          console.log('[loadData] Setting sessionId to:', resolvedSessionId);
          setSessionId(resolvedSessionId);
          
          // Get exercises from all routines in the session
          const allExercises: WorkoutExercise[] = [];
          const routineNames: string[] = [];
          
          if (data.routines && data.routines.length > 0) {
            data.routines.forEach((routine: { name: string; exercises: RoutineExercise[] }) => {
              routineNames.push(routine.name);
              if (routine.exercises) {
                routine.exercises.forEach((re: RoutineExercise) => {
                  allExercises.push({
                    id: re.id,
                    exercise: re.exercise,
                    targetSets: re.sets,
                    targetReps: parseInt(re.reps) || 12,
                    restSeconds: re.restSeconds || 60,
                    completedSeries: [],
                    isCompleted: false,
                    phase: 'setup',
                    currentSeriesIndex: 0,
                    exerciseElapsedSeconds: 0,
                    totalExerciseTime: 0,
                    exerciseStartTime: null,
                    isPaused: true,
                    pausedTime: 0,
                  });
                });
              }
            });
          }
          
          if (allExercises.length > 0) {
            setRoutineName(routineNames.join(' + ') || 'Rutina');
            setSelectedExercises(allExercises);
          } else {
            console.error('No exercises found in session');
          }
        }
        
        // Exercises already have phase: 'setup' by default
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workoutType, sessionIdOrRoutineId, router]);

  // ==================== BACK BUTTON HANDLER ====================
  const historyPushedRef = useRef(false);
  
  useEffect(() => {
    // Interceptar botón atrás del navegador durante el entrenamiento
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (workoutPhase === 'training') {
        e.preventDefault();
        e.returnValue = '¿Estás seguro que deseas salir? Tu progreso no se guardará.';
        return e.returnValue;
      }
    };

    const handlePopState = () => {
      if (workoutPhase === 'training') {
        // Prevenir navegación y mostrar modal
        window.history.pushState(null, '', window.location.href);
        setShowCancelModal(true);
      }
    };

    // Agregar entrada al historial para poder interceptar el botón atrás (solo una vez)
    if (workoutPhase === 'training' && !historyPushedRef.current) {
      window.history.pushState(null, '', window.location.href);
      historyPushedRef.current = true;
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [workoutPhase]);

  // ==================== TIMERS ====================
  // Total workout timer
  useEffect(() => {
    if (!workoutStartTime) return;
    
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - workoutStartTime.getTime()) / 1000);
      setTotalElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [workoutStartTime]);

  // Exercise timers - update all active (non-paused) exercises independently
  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedExercises(prev => prev.map(ex => {
        // Only update exercises that are active and not paused
        if (ex.phase === 'active' && !ex.isPaused && ex.exerciseStartTime) {
          const elapsed = Math.floor((Date.now() - ex.exerciseStartTime) / 1000) + ex.pausedTime;
          return { ...ex, exerciseElapsedSeconds: elapsed };
        }
        return ex;
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Mensajes motivacionales según la serie
  const getMotivationalMessage = (seriesIndex: number) => {
    const messages = ['¡MUY BIEN!', '¡EXCELENTE!', '¡INCREÍBLE!'];
    return messages[seriesIndex % messages.length];
  };

  // Rest timer - cuando termina, activa animación de serie
  useEffect(() => {
    if (!isResting || restTimeRemaining <= 0) {
      if (restTimeRemaining <= 0 && isResting) {
        setIsResting(false);
        // Activar animación de serie cuando termina el descanso
        setShowSeriesAnimation(true);
        setTimeout(() => setShowSeriesAnimation(false), 800);
        // Mostrar mensaje motivacional
        const currentEx = selectedExercises[currentExerciseIndex];
        setMotivationalMessage(getMotivationalMessage(currentEx?.currentSeriesIndex || 0));
        setTimeout(() => setMotivationalMessage(null), 2000);
      }
      return;
    }
    
    const interval = setInterval(() => {
      setRestTimeRemaining(prev => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isResting, restTimeRemaining, selectedExercises, currentExerciseIndex]);

  // ==================== EXERCISE HANDLERS ====================
  const currentExercise = selectedExercises[currentExerciseIndex];

  const updateTargetSets = (delta: number) => {
    if (!currentExercise) return;
    const newSets = Math.max(1, Math.min(10, currentExercise.targetSets + delta));
    setSelectedExercises(prev => prev.map((e, i) => 
      i === currentExerciseIndex ? { ...e, targetSets: newSets } : e
    ));
  };

  const updateRestSeconds = (delta: number) => {
    if (!currentExercise) return;
    const newRest = Math.max(10, Math.min(300, currentExercise.restSeconds + delta));
    setSelectedExercises(prev => prev.map((e, i) => 
      i === currentExerciseIndex ? { ...e, restSeconds: newRest } : e
    ));
    setCurrentRestSeconds(newRest);
  };

  const startExercise = () => {
    if (!workoutStartTime) {
      setWorkoutStartTime(new Date());
    }
    setCurrentReps(currentExercise?.targetReps || 12);
    setCurrentWeight(0);
    setCurrentRestSeconds(currentExercise?.restSeconds || 60);
    
    // Update exercise phase to active with timer state
    setSelectedExercises(prev => prev.map((e, i) => 
      i === currentExerciseIndex ? { 
        ...e, 
        phase: 'active' as ExercisePhase, 
        currentSeriesIndex: 0,
        exerciseStartTime: null,
        exerciseElapsedSeconds: 0,
        isPaused: true,
        pausedTime: 0,
      } : e
    ));
    
    // Mostrar mensaje motivacional inicial
    setMotivationalMessage('¡VAMOS!');
    setTimeout(() => setMotivationalMessage(null), 2500);
  };

  // Toggle play/pause del timer de ejercicio - uses exercise's own state
  const toggleExerciseTimer = () => {
    if (!currentExercise) return;
    
    // Trigger bounce animation
    setShowTimerBounce(true);
    setTimeout(() => setShowTimerBounce(false), 400);
    
    setSelectedExercises(prev => prev.map((e, i) => {
      if (i !== currentExerciseIndex) return e;
      
      if (e.isPaused) {
        // Resume - start or continue timer
        return {
          ...e,
          exerciseStartTime: Date.now(),
          isPaused: false,
        };
      } else {
        // Pause - save current time
        return {
          ...e,
          pausedTime: e.exerciseElapsedSeconds,
          isPaused: true,
        };
      }
    }));
  };

  // ==================== FINISH WORKOUT ====================
  const finishWorkoutCalledRef = useRef(false);
  
  const finishWorkout = useCallback(async () => {
    // Prevent duplicate calls
    if (saving || workoutPhase === 'completed' || finishWorkoutCalledRef.current) {
      console.log('[finishWorkout] Blocked duplicate call:', { saving, workoutPhase, alreadyCalled: finishWorkoutCalledRef.current });
      return;
    }
    
    finishWorkoutCalledRef.current = true;
    console.log('[finishWorkout] Starting...');
    setSaving(true);
    
    // Detener el timer al completar
    setWorkoutStartTime(null);
    setExerciseStartTime(null);
    setIsExercisePaused(true);
    
    try {
      const durationMinutes = workoutStartTime
        ? Math.round((Date.now() - workoutStartTime.getTime()) / 60000)
        : 0;

      // Calculate calories
      let calories = 0;
      const exercisesCompleted: CompletedExerciseData[] = selectedExercises
        .filter(e => e.completedSeries.length > 0)
        .map(e => {
          const totalReps = e.completedSeries.reduce((sum, s) => sum + s.reps, 0);
          const hasWeight = e.completedSeries.some(s => s.weight > 0);
          if (hasWeight) {
            calories += totalReps * (e.exercise.caloriesPerRep || 0.5);
          }
          
          return {
            exerciseId: e.exercise.id,
            exerciseName: e.exercise.name,
            sets: e.completedSeries.length,
            reps: e.targetReps.toString(),
            seriesData: e.completedSeries,
            completedAt: new Date().toISOString(),
          };
        });

      setTotalCalories(Math.round(calories));

      console.log('[finishWorkout] workoutType:', workoutType, 'sessionId:', sessionId);
      
      if (workoutType === 'free') {
        // Save free workout with name and saveAsRoutine option
        console.log('[finishWorkout] Saving free workout...');
        await apiFetch('/client/workout/free', {
          method: 'POST',
          body: JSON.stringify({
            exercisesCompleted,
            durationMinutes,
            caloriesBurned: Math.round(calories),
            workoutName: freeWorkoutName,
            saveAsRoutine,
          }),
        });
        console.log('[finishWorkout] Free workout saved');
      } else if (sessionId) {
        // Complete routine workout
        console.log('[finishWorkout] Completing routine workout...');
        const res = await apiFetch(`/client/workout/${sessionId}/complete`, {
          method: 'PUT',
          body: JSON.stringify({
            durationMinutes,
            caloriesBurned: Math.round(calories),
          }),
        });
        console.log('[finishWorkout] Routine workout completed, response:', await res.json());
      } else {
        console.error('[finishWorkout] No sessionId for routine workout!');
      }

      setWorkoutPhase('completed');
    } catch (error) {
      console.error('Error finishing workout:', error);
    } finally {
      setSaving(false);
    }
  }, [workoutStartTime, selectedExercises, workoutType, sessionId, freeWorkoutName, saveAsRoutine, saving, workoutPhase]);

  // ==================== ACTIVE PHASE HANDLERS ====================
  const completeSeries = useCallback(async () => {
    if (!currentExercise) return;
    
    const currentSeriesIdx = currentExercise.currentSeriesIndex;
    
    const seriesData: SeriesData = {
      setNumber: currentSeriesIdx + 1,
      reps: currentReps,
      weight: currentWeight,
    };
    
    // Check if more series to do
    if (currentSeriesIdx + 1 < currentExercise.targetSets) {
      // Start rest timer
      setIsResting(true);
      setRestTimeRemaining(currentRestSeconds);
      
      // Add to completed series, update series index, pause timer, accumulate time, and reset for new series
      setSelectedExercises(prev => prev.map((e, i) => {
        if (i === currentExerciseIndex) {
          return {
            ...e,
            completedSeries: [...e.completedSeries, seriesData],
            currentSeriesIndex: currentSeriesIdx + 1,
            isPaused: true,
            exerciseStartTime: null,
            pausedTime: 0,
            totalExerciseTime: e.totalExerciseTime + e.exerciseElapsedSeconds, // Acumular tiempo
            exerciseElapsedSeconds: 0,
          };
        }
        return e;
      }));
    } else {
      // Exercise completed - save to backend if routine workout
      const newCompletedSeries = [...currentExercise.completedSeries, seriesData];
      
      if (sessionId && workoutType === 'routine') {
        try {
          await apiFetch(`/client/workout/${sessionId}/exercise`, {
            method: 'PUT',
            body: JSON.stringify({
              exerciseId: currentExercise.exercise.id,
              sets: newCompletedSeries.length,
              reps: currentExercise.targetReps.toString(),
              seriesData: newCompletedSeries,
            }),
          });
        } catch (err) {
          console.error('Error saving exercise:', err);
        }
      }
      
      // Mark as completed with 'completed' phase - keeps the card showing completion data
      // Add last series, accumulate time, and mark as completed in one update
      setSelectedExercises(prev => prev.map((e, i) => {
        if (i === currentExerciseIndex) {
          return { 
            ...e, 
            completedSeries: [...e.completedSeries, seriesData],
            currentSeriesIndex: currentSeriesIdx + 1,
            isCompleted: true, 
            phase: 'completed' as ExercisePhase,
            isPaused: true, // Stop the timer
            totalExerciseTime: e.totalExerciseTime + e.exerciseElapsedSeconds, // Add last series time
          };
        }
        return e;
      }));
      
      // Check if all exercises are completed
      const allCompleted = selectedExercises.every((e, i) => 
        i === currentExerciseIndex ? true : e.isCompleted
      );
      
      if (allCompleted) {
        // Small delay to show completion before finishing
        setNextExerciseCountdown(4);
        const countdownInterval = setInterval(() => {
          setNextExerciseCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              finishWorkout();
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        // Start countdown and navigate to next exercise after 4 seconds
        setNextExerciseCountdown(4);
        const countdownInterval = setInterval(() => {
          setNextExerciseCountdown(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              // Navigate to next incomplete exercise
              const nextIncomplete = selectedExercises.findIndex((e, i) => i !== currentExerciseIndex && !e.isCompleted);
              if (nextIncomplete !== -1) {
                setCurrentExerciseIndex(nextIncomplete);
                const targetEx = selectedExercises[nextIncomplete];
                if (targetEx) {
                  setCurrentReps(targetEx.targetReps || 12);
                  setCurrentRestSeconds(targetEx.restSeconds || 60);
                }
              }
              return null;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [currentExercise, currentExerciseIndex, currentReps, currentWeight, currentRestSeconds, selectedExercises, sessionId, workoutType, finishWorkout]);

  const skipRest = () => {
    setIsResting(false);
    setRestTimeRemaining(0);
    // Activar animación de serie al saltar descanso
    setShowSeriesAnimation(true);
    setTimeout(() => setShowSeriesAnimation(false), 800);
    // Mostrar mensaje motivacional
    setMotivationalMessage(getMotivationalMessage(currentExercise?.currentSeriesIndex || 0));
    setTimeout(() => setMotivationalMessage(null), 2000);
  };

  const cancelExercise = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    router.push('/client/routines');
  };

  // Navigate to exercise with smooth scroll
  const goToExercise = useCallback((index: number) => {
    if (index < 0 || index >= selectedExercises.length) return;
    if (index === currentExerciseIndex) return;
    if (!carouselTrackRef.current) return;
    
    isScrolling.current = true;
    const track = carouselTrackRef.current;
    const cardWidth = window.innerWidth; // Use viewport width since cards are 100vw
    
    track.scrollTo({
      left: index * cardWidth,
      behavior: 'smooth'
    });
    
    setCurrentExerciseIndex(index);
    
    // Load the exercise's current reps/weight
    const targetExercise = selectedExercises[index];
    if (targetExercise) {
      setCurrentReps(targetExercise.targetReps || 12);
      setCurrentRestSeconds(targetExercise.restSeconds || 60);
    }
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 500);
  }, [selectedExercises, currentExerciseIndex]);

  // Handle scroll to detect current exercise
  const handleCarouselScroll = useCallback(() => {
    if (!carouselTrackRef.current || isScrolling.current) return;
    
    const track = carouselTrackRef.current;
    const scrollLeft = track.scrollLeft;
    const cardWidth = window.innerWidth; // Use viewport width since cards are 100vw
    const newIndex = Math.round(scrollLeft / cardWidth);
    
    if (newIndex !== currentExerciseIndex && newIndex >= 0 && newIndex < selectedExercises.length) {
      setCurrentExerciseIndex(newIndex);
      
      // Load the exercise's current reps/weight
      const targetExercise = selectedExercises[newIndex];
      if (targetExercise) {
        setCurrentReps(targetExercise.targetReps || 12);
        setCurrentRestSeconds(targetExercise.restSeconds || 60);
      }
    }
  }, [currentExerciseIndex, selectedExercises]);

  // Touch handlers for swipe with direction detection
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchEndX.current = null;
    isHorizontalSwipe.current = null;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    
    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    touchEndX.current = currentX;
    
    // Determine swipe direction on first significant movement
    if (isHorizontalSwipe.current === null) {
      const diffX = Math.abs(currentX - touchStartX.current);
      const diffY = Math.abs(currentY - touchStartY.current);
      
      // Need at least 10px movement to determine direction
      if (diffX > 10 || diffY > 10) {
        isHorizontalSwipe.current = diffX > diffY;
      }
    }
    
    // Only apply drag offset if horizontal swipe
    if (isHorizontalSwipe.current === true) {
      let offset = currentX - touchStartX.current;
      
      // Add resistance at edges
      if ((currentExerciseIndex === 0 && offset > 0) || 
          (currentExerciseIndex === selectedExercises.length - 1 && offset < 0)) {
        offset = offset * 0.3;
      }
      
      setDragOffset(offset);
    }
  }, [currentExerciseIndex, selectedExercises.length]);

  const handleTouchEnd = useCallback(() => {
    // Only process if it was a horizontal swipe
    if (isHorizontalSwipe.current === true) {
      const threshold = window.innerWidth * 0.15; // 15% of screen width
      
      if (Math.abs(dragOffset) > threshold) {
        if (dragOffset < 0 && currentExerciseIndex < selectedExercises.length - 1) {
          goToExercise(currentExerciseIndex + 1);
        } else if (dragOffset > 0 && currentExerciseIndex > 0) {
          goToExercise(currentExerciseIndex - 1);
        }
      }
    }
    
    // Reset
    setDragOffset(0);
    touchStartX.current = null;
    touchStartY.current = null;
    touchEndX.current = null;
    isHorizontalSwipe.current = null;
  }, [dragOffset, currentExerciseIndex, selectedExercises.length, goToExercise]);

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

  if (selectedExercises.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <p>No hay ejercicios disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      
      {/* TRAINING PHASE - unified view with tabs and swipeable cards */}
      {workoutPhase === 'training' && currentExercise && (
        <div className={styles.activePhase}>
          {/* Rest timer overlay - fixed position */}
          {isResting && (
            <div className={styles.restTimerOverlay}>
              <div className={styles.restTimerContent}>
                <div className={styles.restTimerTitle}>Descanso</div>
                <div className={styles.restTimerValue}>{formatTime(restTimeRemaining)}</div>
                <div className={styles.restTimerNext}>
                  Siguiente: Serie {currentExercise.currentSeriesIndex + 1} de {currentExercise.targetSets}
                </div>
                <button className={styles.skipRestBtn} onClick={skipRest}>
                  Saltar descanso
                </button>
              </div>
            </div>
          )}

          {/* Fixed header - stays in place while cards scroll */}
          <div className={styles.scrollableHeader}>
            {/* Progress header */}
            <div className={styles.progressHeader}>
              <button className={styles.closeBtn} onClick={cancelExercise}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <div className={styles.progressInfo}>
                <div className={styles.progressText}>
                  Ejercicio {currentExerciseIndex + 1} de {selectedExercises.length}
                </div>
                <div className={styles.progressBar}>
                  <div 
                    className={styles.progressFill}
                    style={{ width: `${((currentExerciseIndex + (currentExercise.currentSeriesIndex / currentExercise.targetSets)) / selectedExercises.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Exercise pills - clickable to navigate between exercises */}
            <div className={styles.exercisePills}>
              {selectedExercises.map((ex, idx) => (
                <button
                  key={ex.id}
                  className={`${styles.exercisePill} 
                    ${ex.isCompleted ? styles.exercisePillCompleted : ''} 
                    ${idx === currentExerciseIndex ? styles.exercisePillActive : ''}
                    ${ex.phase === 'active' && idx !== currentExerciseIndex ? styles.exercisePillInProgress : ''}`}
                  onClick={() => goToExercise(idx)}
                >
                  {ex.isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  ) : (
                    idx + 1
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Carousel container */}
          <div 
            className={styles.carouselContainer}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Carousel track with all cards */}
            <div 
              ref={carouselTrackRef}
              className={styles.carouselTrack}
              style={{ 
                transform: `translateX(calc(-${currentExerciseIndex * 100}% + ${dragOffset}px))`,
                transition: dragOffset === 0 ? 'transform 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none'
              }}
            >
              {selectedExercises.map((exercise, idx) => {
                const isActive = idx === currentExerciseIndex;
                
                return (
                  <div 
                    key={exercise.id} 
                    className={`${styles.carouselCard} ${isActive ? styles.carouselCardActive : ''}`}
                  >
                    <div className={styles.activeExerciseCard}>
                      {/* SETUP PHASE */}
                      {exercise.phase === 'setup' && (
                        <>
                          <div className={styles.exerciseImageContainer}>
                            <div className={styles.exerciseImagePlaceholder} />
                          </div>
                          <div className={styles.exerciseStartContent}>
                            <h2 className={styles.exerciseStartName}>{exercise.exercise.name}</h2>
                            {exercise.exercise.muscleGroup && (
                              <span className={styles.exerciseMusclePill}>{exercise.exercise.muscleGroup}</span>
                            )}
                            <div className={styles.seriesSelector}>
                              <button className={styles.seriesBtn} onClick={() => isActive && updateTargetSets(-1)}>−</button>
                              <span className={styles.seriesValue}>{exercise.targetSets}</span>
                              <button className={styles.seriesBtn} onClick={() => isActive && updateTargetSets(1)}>+</button>
                            </div>
                            <div className={styles.seriesLabel}>N° de series</div>
                            <div className={styles.seriesSelector}>
                              <button className={styles.seriesBtn} onClick={() => isActive && updateRestSeconds(-10)}>−</button>
                              <span className={styles.seriesValue}>{exercise.restSeconds}s</span>
                              <button className={styles.seriesBtn} onClick={() => isActive && updateRestSeconds(10)}>+</button>
                            </div>
                            <div className={styles.seriesLabel}>Descanso entre series</div>
                            <div className={styles.startExerciseText}>Empezar ejercicio</div>
                            <div className={styles.playBtnContainer}>
                              <button className={styles.playBtn} onClick={() => isActive && startExercise()}>
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </>
                      )}

                      {/* ACTIVE PHASE */}
                      {exercise.phase === 'active' && (
                        <>
                          <div className={`${styles.timersSection} ${isActive && showTimerBounce ? styles.timerBounce : ''}`}>
                            <div className={styles.totalTime}>
                              <span className={styles.totalTimeValue}>{formatTime(totalElapsedSeconds)}s</span>
                              <span className={styles.totalTimeLabel}>Tiempo total</span>
                            </div>
                            {isActive && motivationalMessage ? (
                              <div className={styles.motivationalMessage}>{motivationalMessage}</div>
                            ) : (
                              <div className={`${styles.exerciseTimer} ${!exercise.isPaused ? styles.clockAnimating : ''}`}>
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"/>
                                  <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                <span className={styles.exerciseTimerValue}>{formatTime(exercise.exerciseElapsedSeconds)}<span className={styles.exerciseTimerSeconds}>s</span></span>
                              </div>
                            )}
                            <div className={`${styles.currentSeriesPill} ${isActive && showSeriesAnimation ? styles.seriesChange : ''}`}>
                              SERIE {exercise.currentSeriesIndex + 1}
                            </div>
                            <div className={styles.activeExerciseName}>{exercise.exercise.name}</div>
                          </div>
                          <div className={styles.inputsRow}>
                            <div className={styles.inputGroup}>
                              <div className={styles.inputControls}>
                                <button className={styles.inputBtn} onClick={() => isActive && setCurrentReps(Math.max(1, currentReps - 1))}>−</button>
                                <span className={styles.inputValue}>{isActive ? currentReps : exercise.targetReps}</span>
                                <button className={styles.inputBtn} onClick={() => isActive && setCurrentReps(currentReps + 1)}>+</button>
                              </div>
                              <div className={styles.inputLabel}>Repeticiones</div>
                            </div>
                            <div className={styles.inputGroup}>
                              <div className={styles.inputControls}>
                                <button className={styles.inputBtn} onClick={() => isActive && setCurrentWeight(Math.max(0, currentWeight - 2.5))}>−</button>
                                <span className={styles.inputValue}>{isActive ? currentWeight : 0}</span>
                                <button className={styles.inputBtn} onClick={() => isActive && setCurrentWeight(currentWeight + 2.5)}>+</button>
                              </div>
                              <div className={styles.inputLabel}>Peso (kg)</div>
                            </div>
                          </div>
                          {exercise.isPaused && exercise.exerciseElapsedSeconds === 0 && (
                            <div className={styles.startSeriesHint}>Debes comenzar la serie</div>
                          )}
                          <div className={styles.actionButtons}>
                            <button className={styles.actionBtn} onClick={() => isActive && cancelExercise()}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="6" x2="6" y2="18"/>
                                <line x1="6" y1="6" x2="18" y2="18"/>
                              </svg>
                            </button>
                            <button className={`${styles.actionBtn} ${styles.actionBtnMain}`} onClick={() => isActive && toggleExerciseTimer()}>
                              {exercise.isPaused ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <polygon points="5 3 19 12 5 21 5 3"/>
                                </svg>
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                  <rect x="6" y="4" width="4" height="16"/>
                                  <rect x="14" y="4" width="4" height="16"/>
                                </svg>
                              )}
                            </button>
                            <button 
                              className={`${styles.actionBtn} ${styles.actionBtnCheck} ${exercise.isPaused ? styles.actionBtnDisabled : ''}`}
                              onClick={() => isActive && !exercise.isPaused && completeSeries()}
                              disabled={!isActive || exercise.isPaused}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                            </button>
                          </div>
                        </>
                      )}

                      {/* COMPLETED PHASE - Exercise finished */}
                      {exercise.phase === 'completed' && (
                        <div className={styles.exerciseCompletedContent}>
                          <div className={styles.completedCheckmark}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          </div>
                          <h2 className={styles.completedExerciseTitle}>¡Ejercicio Completado!</h2>
                          <div className={styles.completedExerciseName}>{exercise.exercise.name}</div>
                          
                          <div className={styles.completedStats}>
                            <div className={styles.completedStatItem}>
                              <div className={styles.completedStatValue}>{formatTime(exercise.totalExerciseTime)}</div>
                              <div className={styles.completedStatLabel}>Tiempo</div>
                            </div>
                            <div className={styles.completedStatItem}>
                              <div className={styles.completedStatValue}>{exercise.completedSeries.length}</div>
                              <div className={styles.completedStatLabel}>Series</div>
                            </div>
                          </div>

                          <div className={styles.completedSeriesList}>
                            {exercise.completedSeries.map((series, sIdx) => (
                              <div key={sIdx} className={styles.completedSeriesItem}>
                                <span className={styles.completedSeriesNumber}>Serie {series.setNumber}</span>
                                <span className={styles.completedSeriesData}>{series.reps} reps × {series.weight}kg</span>
                              </div>
                            ))}
                          </div>

                          {/* Next exercise countdown island */}
                          {nextExerciseCountdown !== null && isActive && (
                            <div className={styles.nextExerciseIsland}>
                              <span className={styles.nextExerciseText}>
                                {selectedExercises.every((e, i) => i === currentExerciseIndex ? true : e.isCompleted) 
                                  ? 'Finalizando en' 
                                  : 'Siguiente ejercicio en'}
                              </span>
                              <span className={styles.nextExerciseCountdown}>{nextExerciseCountdown}s</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Video section per card */}
                    <div className={styles.videoSection}>
                      <div className={styles.videoTitle}>{exercise.phase === 'setup' ? 'Descripción' : exercise.phase === 'completed' ? 'Resumen' : 'Video del ejercicio'}</div>
                      {exercise.phase === 'setup' ? (
                        <div className={styles.exerciseDescriptionBox}>
                          {exercise.exercise.description || 'Sin descripción disponible'}
                        </div>
                      ) : exercise.exercise.videoUrl && getYouTubeEmbedUrl(exercise.exercise.videoUrl) ? (
                        <div className={styles.videoContainer}>
                          <iframe
                            src={getYouTubeEmbedUrl(exercise.exercise.videoUrl)!}
                            title={`Video de ${exercise.exercise.name}`}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className={styles.videoIframe}
                          />
                        </div>
                      ) : (
                        <div className={styles.videoPlaceholder}>
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="2" y="4" width="20" height="16" rx="2"/>
                            <polygon points="10 9 15 12 10 15 10 9"/>
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PHASE: COMPLETED */}
      {workoutPhase === 'completed' && (
        <div className={styles.completedPhase}>
          {/* Progress header with all completed */}
          <div className={styles.progressHeader}>
            <button className={styles.closeBtn} onClick={() => router.push('/client/routines')}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <div className={styles.progressInfo}>
              <div className={styles.progressText}>
                Ejercicio {selectedExercises.length} de {selectedExercises.length}
              </div>
              <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: '100%' }} />
              </div>
            </div>
          </div>

          {/* All completed pills */}
          <div className={styles.exercisePills}>
            {selectedExercises.map((ex) => (
              <button key={ex.id} className={`${styles.exercisePill} ${styles.exercisePillCompleted}`}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            ))}
          </div>

          {/* Wrapper igual que activeCardWrapper */}
          <div className={styles.activeCardWrapper}>
            {/* Card verde igual que activeExerciseCard */}
            <div className={styles.activeExerciseCard}>
              <div className={styles.completedContent}>
                <h2 className={styles.completedTitle}>ENTRENAMIENTO<br/>COMPLETADO</h2>

                <div className={styles.statsRow}>
                  {/* Tiempo total */}
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                    </div>
                    <div className={styles.statValue}>{formatTime(totalElapsedSeconds)}<span className={styles.statValueSmall}>s</span></div>
                    <div className={styles.statLabel}>Tiempo total</div>
                  </div>

                  {/* Ejercicios - icono mancuerna */}
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6.5 6.5h11M6.5 17.5h11"/>
                        <rect x="3" y="8" width="4" height="8" rx="1"/>
                        <rect x="17" y="8" width="4" height="8" rx="1"/>
                        <rect x="7" y="10" width="10" height="4" rx="0.5"/>
                      </svg>
                    </div>
                    <div className={styles.statValue}>{selectedExercises.filter(e => e.isCompleted).length}</div>
                    <div className={styles.statLabel}>Ejercicios</div>
                  </div>

                  {/* Kcal quemadas - icono fuego en líneas */}
                  <div className={styles.statItem}>
                    <div className={styles.statIcon}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
                      </svg>
                    </div>
                    <div className={styles.statValue}>{totalCalories || 0}</div>
                    <div className={styles.statLabel}>Kcal quemadas</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sección gris igual que videoSection */}
            <div className={styles.videoSection}>
              <div className={styles.completedListHeader}>
                <div className={styles.completedListTitle}>Ejercicios realizados</div>
                {(() => {
                  const completedExercises = selectedExercises.filter(e => e.completedSeries.length > 0);
                  const totalPages = Math.ceil(completedExercises.length / exercisesPerPage);
                  return totalPages > 1 && (
                    <div className={styles.paginationControls}>
                      <button 
                        className={styles.paginationBtn}
                        onClick={() => setExercisesPage(p => Math.max(0, p - 1))}
                        disabled={exercisesPage === 0}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="15 18 9 12 15 6"/>
                        </svg>
                      </button>
                      <span className={styles.paginationText}>{exercisesPage + 1}/{totalPages}</span>
                      <button 
                        className={styles.paginationBtn}
                        onClick={() => setExercisesPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={exercisesPage >= totalPages - 1}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </button>
                    </div>
                  );
                })()}
              </div>
              <div className={styles.completedExercisesList}>
                {selectedExercises
                  .filter(e => e.completedSeries.length > 0)
                  .slice(exercisesPage * exercisesPerPage, (exercisesPage + 1) * exercisesPerPage)
                  .map(ex => (
                  <div key={ex.id} className={styles.completedExerciseItem}>
                    <div className={styles.completedExerciseCheck}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div className={styles.completedExerciseInfo}>
                      <div className={styles.completedListExerciseName}>{ex.exercise.name}</div>
                    </div>
                    <div className={styles.completedExerciseSeries}>
                      {ex.completedSeries.length} serie{ex.completedSeries.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>

              <button className={styles.backToHomeBtn} onClick={() => router.push('/client/routines')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className={styles.cancelModal}>
          <div className={styles.cancelModalContent}>
            <h3 className={styles.cancelModalTitle}>¿Cancelar entrenamiento?</h3>
            <p className={styles.cancelModalText}>
              Tu progreso no se guardará si sales ahora.
            </p>
            <div className={styles.cancelModalButtons}>
              <button className={styles.cancelModalKeep} onClick={() => setShowCancelModal(false)}>
                Continuar entrenando
              </button>
              <button className={styles.cancelModalExit} onClick={confirmCancel}>
                Salir sin guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
