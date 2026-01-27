'use client';

import { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

// Componente Slide to Unlock con animación de hint
function SlideToUnlock({ onUnlock }: { onUnlock: () => void }) {
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const maxSlide = useRef(0);

  // Animación de hint cada 3.5 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDragging && sliderPosition === 0) {
        setShowHint(true);
        setTimeout(() => setShowHint(false), 600);
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isDragging, sliderPosition]);

  const handleStart = (clientX: number) => {
    setIsDragging(true);
    startXRef.current = clientX - sliderPosition;
    if (containerRef.current) {
      maxSlide.current = containerRef.current.offsetWidth - 56;
    }
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    const newPos = Math.max(0, Math.min(clientX - startXRef.current, maxSlide.current));
    setSliderPosition(newPos);
  };

  const handleEnd = () => {
    setIsDragging(false);
    if (sliderPosition > maxSlide.current * 0.85) {
      setSliderPosition(maxSlide.current);
      setTimeout(() => onUnlock(), 200);
    } else {
      setSliderPosition(0);
    }
  };

  const progress = maxSlide.current > 0 ? sliderPosition / maxSlide.current : 0;
  const isUnlocked = progress >= 0.85;

  return (
    <div 
      ref={containerRef}
      className={styles.slideContainer}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
    >
      {/* Barra de progreso verde */}
      <div 
        className={styles.slideProgress}
        style={{ width: `${progress * 100}%` }}
      />
      
      <div 
        className={`${styles.slideThumb} ${showHint ? styles.slideHint : ''} ${isUnlocked ? styles.slideUnlocked : ''}`}
        style={{ transform: `translateX(${sliderPosition}px)` }}
        onMouseDown={(e) => handleStart(e.clientX)}
        onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      >
        {isUnlocked ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        )}
      </div>
      <span 
        className={styles.slideText}
        style={{ opacity: 1 - progress * 1.5 }}
      >
        ENTRENAMIENTO LIBRE
      </span>
    </div>
  );
}

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
}

interface RoutineExercise {
  id: string;
  exercise: Exercise;
  sets: number;
  reps: string;
  restSeconds: number;
}

interface Routine {
  id: string;
  name: string;
  category: string;
  level: number;
  estimatedMinutes: number | null;
  exercises: RoutineExercise[];
  _count?: { exercises: number };
  isOwn?: boolean;
  dayAssignments?: { dayOfWeek: number }[];
}

interface DayAssignment {
  id: string;
  dayOfWeek: number;
  routine: Routine;
}

interface TodayData {
  routines: Routine[];
  dayOfWeek: number;
  isCompleted: boolean;
  completedRoutineIds: string[];
}

interface WorkoutSession {
  id: string;
  date: string;
  completed: boolean;
  durationMinutes: number | null;
  caloriesBurned: number | null;
  exercisesCompleted: unknown[];
  sessionName?: string;
  isFreeWorkout?: boolean;
}

interface WorkoutStats {
  totalSessions: number;
  totalMinutes: number;
  totalExercises: number;
  avgDuration: number;
}

const DAY_NAMES: Record<number, string> = {
  0: 'Domingo',
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
};

const DAY_NAMES_SHORT: Record<number, string> = {
  0: 'Dom',
  1: 'Lun',
  2: 'Mar',
  3: 'Mié',
  4: 'Jue',
  5: 'Vie',
  6: 'Sáb',
};

const MUSCLE_GROUP_MAP: Record<string, 'pecho' | 'espalda' | 'cuadriceps' | 'isquios'> = {
  'PECHO': 'pecho',
  'CHEST': 'pecho',
  'ESPALDA': 'espalda',
  'BACK': 'espalda',
  'CUADRICEPS': 'cuadriceps',
  'QUADS': 'cuadriceps',
  'PIERNAS': 'cuadriceps',
  'LEGS': 'cuadriceps',
  'ISQUIOS': 'isquios',
  'HAMSTRINGS': 'isquios',
  'GLUTEOS': 'isquios',
  'GLUTES': 'isquios',
};

interface DayPickerItem {
  date: Date;
  dayOfWeek: number;
  dayNumber: number;
  monthShort: string;
  routine: string;
  isToday: boolean;
  isPast: boolean;
}

interface MyRoutine extends Routine {
  isOwn: true;
  dayAssignments?: { dayOfWeek: number }[];
}

export default function ClientRoutinesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [activeTab, setActiveTab] = useState<'training' | 'history' | 'routines'>('training');
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [weekRoutines, setWeekRoutines] = useState<Record<number, DayAssignment[]>>({});
  const [allRoutines, setAllRoutines] = useState<Routine[]>([]);
  const [myRoutines, setMyRoutines] = useState<MyRoutine[]>([]);
  const [assignedRoutines, setAssignedRoutines] = useState<Routine[]>([]);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutSession[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(10); // Centro = hoy
  const [activeRoutineIndex, setActiveRoutineIndex] = useState(0);
  const [historyViewMode, setHistoryViewMode] = useState<'list' | 'calendar'>('list');
  const [historyMonth, setHistoryMonth] = useState(new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const HISTORY_PAGE_SIZE = 7;
  const scrollRef = useRef<HTMLDivElement>(null);
  const todayCarouselRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);

  const fetchRoutines = useCallback(async () => {
    try {
      const todayRes = await apiFetch('/client/routines/today');
      const todayJson = await todayRes.json();
      setTodayData(todayJson);

      const weekRes = await apiFetch('/client/routines/week');
      const weekJson = await weekRes.json();
      setWeekRoutines(weekJson.weekRoutines || {});

      const assignments: DayAssignment[] = weekJson.assignments || [];
      const uniqueRoutines = new Map<string, Routine>();
      const uniqueAssignedRoutines = new Map<string, Routine & { dayAssignments: { dayOfWeek: number }[] }>();
      
      assignments.forEach((a: DayAssignment) => {
        if (!uniqueRoutines.has(a.routine.id)) {
          uniqueRoutines.set(a.routine.id, a.routine);
        }
        // Solo agregar a asignadas si NO es propia (asignada por un profesional)
        if (!a.routine.isOwn) {
          if (!uniqueAssignedRoutines.has(a.routine.id)) {
            uniqueAssignedRoutines.set(a.routine.id, { ...a.routine, dayAssignments: [{ dayOfWeek: a.dayOfWeek }] });
          } else {
            // Agregar el día si no existe ya
            const existing = uniqueAssignedRoutines.get(a.routine.id)!;
            if (!existing.dayAssignments.some(d => d.dayOfWeek === a.dayOfWeek)) {
              existing.dayAssignments.push({ dayOfWeek: a.dayOfWeek });
            }
          }
        }
      });
      setAllRoutines(Array.from(uniqueRoutines.values()));
      setAssignedRoutines(Array.from(uniqueAssignedRoutines.values()));

      // Cargar rutinas propias del usuario
      const myRes = await apiFetch('/client/routines/my');
      if (myRes.ok) {
        const myJson = await myRes.json();
        setMyRoutines((myJson.routines || []).map((r: Routine) => ({ ...r, isOwn: true })));
      }
    } catch (error) {
      console.error('Error fetching routines:', error);
    } finally {
      setLoading(false);
    }
    
    // Fetch historial separado para que no bloquee si falla
    try {
      const historyRes = await apiFetch('/client/workout/history');
      if (historyRes.ok) {
        const historyJson = await historyRes.json();
        setWorkoutHistory(historyJson.sessions || []);
        setWorkoutStats(historyJson.stats || null);
      } else {
        console.error('[DEBUG] History fetch failed:', historyRes.status);
      }
    } catch (historyError) {
      console.error('[DEBUG] Error fetching history:', historyError);
    }
  }, []);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines]);

  const handleStartWorkout = async (e: React.MouseEvent, routineId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent duplicate calls
    if (startingWorkout) return;
    setStartingWorkout(true);
    
    try {
      const res = await apiFetch('/client/workout/start', { 
        method: 'POST',
        body: JSON.stringify({ routineId }),
      });
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Error response:', errorData);
        alert(errorData.error || 'Error al iniciar el entrenamiento');
        setStartingWorkout(false);
        return;
      }
      const data = await res.json();
      if (data.session?.id) {
        router.push(`/client/workout/${data.session.id}`);
      } else {
        console.error('No session returned:', data);
        alert('No se pudo crear la sesión de entrenamiento');
        setStartingWorkout(false);
      }
    } catch (error) {
      console.error('Error starting workout:', error);
      alert('Error de conexión. Intenta de nuevo.');
      setStartingWorkout(false);
    }
  };

  const handleDeleteRoutine = async (routineId: string, routineName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar la rutina "${routineName}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      const res = await apiFetch(`/client/routines/my/${routineId}`, { 
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        alert(errorData.error || 'Error al eliminar la rutina');
        return;
      }
      
      // Actualizar todas las listas de rutinas
      setMyRoutines(prev => prev.filter(r => r.id !== routineId));
      setAllRoutines(prev => prev.filter(r => r.id !== routineId));
      
      // Actualizar todayData si la rutina estaba en las rutinas de hoy
      if (todayData?.routines.some(r => r.id === routineId)) {
        setTodayData(prev => prev ? {
          ...prev,
          routines: prev.routines.filter(r => r.id !== routineId)
        } : null);
      }
      
      // Actualizar weekRoutines removiendo la rutina de todos los días
      setWeekRoutines(prev => {
        const updated: Record<number, DayAssignment[]> = {};
        Object.entries(prev).forEach(([day, assignments]) => {
          updated[Number(day)] = assignments.filter(a => a.routine.id !== routineId);
        });
        return updated;
      });
      
      alert('Rutina eliminada correctamente');
    } catch (error) {
      console.error('Error deleting routine:', error);
      alert('Error de conexión. Intenta de nuevo.');
    }
  };

  // Obtener grupos musculares únicos de las rutinas de hoy
  const getTodayMuscleGroups = (): string[] => {
    if (!todayData?.routines) return [];
    const groups = new Set<string>();
    todayData.routines.forEach(r => {
      r.exercises?.forEach(e => {
        if (e.exercise.muscleGroup) {
          groups.add(e.exercise.muscleGroup);
        }
      });
    });
    return Array.from(groups);
  };

  // Calcular tiempo estimado total
  const getTotalEstimatedTime = (): string => {
    if (!todayData?.routines) return '';
    const total = todayData.routines.reduce((acc, r) => acc + (r.estimatedMinutes || 0), 0);
    if (total === 0) return '';
    const min = Math.max(total - 10, 15);
    const max = total + 10;
    return `${min}-${max} min`;
  };

  // Generar nombre combinado de rutinas
  const getTodayRoutineName = (): string => {
    if (!todayData?.routines || todayData.routines.length === 0) return 'Sin rutina';
    if (todayData.routines.length === 1) return todayData.routines[0].name;
    return todayData.routines.map(r => r.name).join(' + ');
  };

  // Generar array de 21 días (±10 días desde hoy) para el scroll picker
  const dayPickerItems = useMemo((): DayPickerItem[] => {
    const items: DayPickerItem[] = [];
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Helper para obtener nombre de rutina de un día de la semana
    const getRoutineName = (dayOfWeek: number): string => {
      const assignments = weekRoutines[dayOfWeek] || [];
      if (assignments.length === 0) return 'Descanso';
      if (assignments.length === 1) return assignments[0].routine.name;
      return assignments.map(a => a.routine.name).join(' + ');
    };

    // Generar -10 a +10 días
    for (let i = -10; i <= 10; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() + i);
      
      items.push({
        date,
        dayOfWeek: date.getDay(),
        dayNumber: date.getDate(),
        monthShort: date.toLocaleDateString('es-AR', { month: 'short' }),
        routine: getRoutineName(date.getDay()),
        isToday: i === 0,
        isPast: i < 0,
      });
    }
    
    return items;
  }, [weekRoutines]);

  // Scroll al centro (hoy) cuando se carga o cuando cambia el tab a training
  useEffect(() => {
    if (scrollRef.current && !loading && dayPickerItems.length > 0 && activeTab === 'training') {
      // Pequeño delay para asegurar que el DOM esté listo
      const scrollToToday = () => {
        if (scrollRef.current) {
          const container = scrollRef.current;
          const cards = container.children;
          if (cards.length > 10) {
            const todayCard = cards[10] as HTMLElement;
            const scrollPos = todayCard.offsetLeft - (container.offsetWidth / 2) + (todayCard.offsetWidth / 2);
            container.scrollLeft = scrollPos;
            setSelectedDayIndex(10);
          }
        }
      };
      
      // Ejecutar inmediatamente y con delay para asegurar que funcione
      scrollToToday();
      setTimeout(scrollToToday, 150);
    }
  }, [loading, dayPickerItems.length, activeTab]);

  // Manejar scroll y detectar card central
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isScrolling.current) return;
    
    const container = scrollRef.current;
    const containerCenter = container.scrollLeft + (container.offsetWidth / 2);
    const cards = Array.from(container.children) as HTMLElement[];
    
    let closestIndex = 10;
    let closestDistance = Infinity;
    
    cards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + (card.offsetWidth / 2);
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    
    if (closestIndex !== selectedDayIndex) {
      setSelectedDayIndex(closestIndex);
    }
  }, [selectedDayIndex]);

  // Scroll snap manejado por CSS - solo actualizar el índice seleccionado
  const handleScrollEnd = useCallback(() => {
    if (!scrollRef.current) return;
    
    // El scroll-snap de CSS maneja el centrado automáticamente
    // Solo necesitamos actualizar el índice después de que termine el scroll
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 300);
  }, [selectedDayIndex]);

  // Click en una card para centrarla
  const scrollToDay = useCallback((index: number) => {
    if (!scrollRef.current) return;
    
    isScrolling.current = true;
    const container = scrollRef.current;
    const cards = Array.from(container.children) as HTMLElement[];
    
    if (cards[index]) {
      const card = cards[index];
      const scrollPos = card.offsetLeft - (container.offsetWidth / 2) + (card.offsetWidth / 2);
      container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      setSelectedDayIndex(index);
    }
    
    setTimeout(() => {
      isScrolling.current = false;
    }, 300);
  }, []);

  // Manejar scroll del carousel de rutinas de hoy
  const handleTodayCarouselScroll = useCallback(() => {
    if (!todayCarouselRef.current) return;
    const container = todayCarouselRef.current;
    const scrollLeft = container.scrollLeft;
    const cardWidth = container.offsetWidth - 40 + 16; // card width + gap
    const newIndex = Math.round(scrollLeft / cardWidth);
    if (newIndex !== activeRoutineIndex) {
      setActiveRoutineIndex(newIndex);
    }
  }, [activeRoutineIndex]);

  // Calcular heatmap de grupos musculares
  const muscleHeatmap = useMemo(() => {
    const counts = { pecho: 0, espalda: 0, cuadriceps: 0, isquios: 0 };
    
    allRoutines.forEach(routine => {
      routine.exercises?.forEach(ex => {
        const group = ex.exercise.muscleGroup?.toUpperCase();
        if (group && MUSCLE_GROUP_MAP[group]) {
          counts[MUSCLE_GROUP_MAP[group]]++;
        }
      });
    });

    // Normalizar a 0-100
    const max = Math.max(...Object.values(counts), 1);
    return {
      pecho: (counts.pecho / max) * 100,
      espalda: (counts.espalda / max) * 100,
      cuadriceps: (counts.cuadriceps / max) * 100,
      isquios: (counts.isquios / max) * 100,
    };
  }, [allRoutines]);

  // Obtener nivel de la última rutina
  const lastRoutineLevel = useMemo(() => {
    if (todayData?.routines && todayData.routines.length > 0) {
      return todayData.routines[0].level || 1;
    }
    if (allRoutines.length > 0) {
      return allRoutines[0].level || 1;
    }
    return 1;
  }, [todayData, allRoutines]);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  const muscleGroups = getTodayMuscleGroups();
  const estimatedTime = getTotalEstimatedTime();
  const todayName = getTodayRoutineName();
  const hasRoutineToday = todayData?.routines && todayData.routines.length > 0;

  // Calcular circumference para el ring de nivel
  const levelProgress = (lastRoutineLevel / 5) * 100;
  const circumference = 2 * Math.PI * 42;
  const strokeDashoffset = circumference - (levelProgress / 100) * circumference;

  return (
    <div className={styles.container}>
      {/* Tabs Pills */}
      <div className={styles.tabsPills}>
        <button 
          className={`${styles.tabPill} ${activeTab === 'training' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('training')}
        >
          Entrenamiento
        </button>
        <button 
          className={`${styles.tabPill} ${activeTab === 'history' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Historial
        </button>
        <button 
          className={`${styles.tabPill} ${activeTab === 'routines' ? styles.tabPillActive : ''}`}
          onClick={() => setActiveTab('routines')}
        >
          Mis Rutinas
        </button>
      </div>

      {activeTab === 'training' && (
        <>
          {/* Rutina de hoy - Swipe Cards */}
          <section className={styles.mainSection}>
            <p className={styles.sectionLabel}>Rutina de hoy</p>
            
            {hasRoutineToday ? (
              <>
                <div 
                  ref={todayCarouselRef}
                  className={styles.todayCarousel}
                  onScroll={handleTodayCarouselScroll}
                >
                  {todayData?.routines
                    .slice()
                    .sort((a, b) => {
                      const aCompleted = todayData?.completedRoutineIds?.includes(a.id) || false;
                      const bCompleted = todayData?.completedRoutineIds?.includes(b.id) || false;
                      // No completadas primero
                      if (aCompleted && !bCompleted) return 1;
                      if (!aCompleted && bCompleted) return -1;
                      return 0;
                    })
                    .map((routine, index) => {
                    const routineMuscleGroups = [...new Set(
                      routine.exercises?.map(e => e.exercise.muscleGroup).filter(Boolean) || []
                    )];
                    
                    // Calcular duración estimada basada en ejercicios si no hay estimatedMinutes
                    const calculateEstimatedTime = () => {
                      if (routine.estimatedMinutes) {
                        return routine.estimatedMinutes;
                      }
                      // Calcular: ~3 min por serie + descanso entre series
                      const exercises = routine.exercises || [];
                      let totalMinutes = 0;
                      exercises.forEach(ex => {
                        const sets = ex.sets || 3;
                        const restSeconds = ex.restSeconds || 60;
                        // ~45 seg por serie + descanso
                        totalMinutes += (sets * 0.75) + ((sets - 1) * (restSeconds / 60));
                      });
                      // Agregar 5 min de calentamiento
                      return Math.round(totalMinutes + 5);
                    };
                    
                    const estimatedMins = calculateEstimatedTime();
                    const routineTime = estimatedMins > 0 
                      ? `${Math.max(estimatedMins - 10, 15)}-${estimatedMins + 10} min`
                      : '';
                    const isRoutineCompleted = todayData?.completedRoutineIds?.includes(routine.id) || false;
                    
                    return (
                      <div 
                        key={routine.id} 
                        className={`${styles.mainCard} ${isRoutineCompleted ? styles.completed : ''}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src="/mina entrenando.png" 
                          alt="" 
                          className={styles.mainCardImage}
                        />
                        <div className={styles.mainCardContent}>
                          <div className={styles.mainCardTop}>
                            <h2 className={styles.mainCardTitle}>{routine.name}</h2>
                            {routineMuscleGroups.length > 0 && (
                              <span className={styles.mainCardGroups}>
                                {routineMuscleGroups.length} GRUPOS MUSCULARES
                              </span>
                            )}
                            {routineTime && (
                              <span className={styles.mainCardTime}>{routineTime}</span>
                            )}
                          </div>
                          <div className={styles.mainCardMeta}>
                            {isRoutineCompleted ? (
                              <div className={styles.completedBadge}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                COMPLETADO
                              </div>
                            ) : (
                              <button type="button" className={styles.startButton} onClick={(e) => handleStartWorkout(e, routine.id)}>
                                EMPEZAR AHORA
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {todayData && todayData.routines.length > 1 && (
                  <div className={styles.carouselDots}>
                    {todayData.routines.map((_, index) => (
                      <span 
                        key={index} 
                        className={`${styles.carouselDot} ${index === activeRoutineIndex ? styles.carouselDotActive : ''}`} 
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className={styles.createRoutineCard}>
                <div className={styles.createRoutineGlow} />
                <div className={styles.createRoutineContent}>
                  <div className={styles.createRoutineIcon}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 5v14M5 12h14"/>
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </div>
                  <h3 className={styles.createRoutineTitle}>Crea tu primera rutina</h3>
                  <p className={styles.createRoutineDesc}>
                    Diseña entrenamientos personalizados y alcanza tus objetivos
                  </p>
                  <button 
                    className={styles.createRoutineBtn}
                    onClick={() => router.push('/client/routines/create')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 5v14M5 12h14"/>
                    </svg>
                    <span>Crear rutina</span>
                  </button>
                  <div className={styles.createRoutineFeatures}>
                    <div className={styles.createRoutineFeature}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Ejercicios personalizados</span>
                    </div>
                    <div className={styles.createRoutineFeature}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Seguimiento de progreso</span>
                    </div>
                    <div className={styles.createRoutineFeature}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      <span>Asigna a cualquier día</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Slide to unlock - Entrenamiento Libre */}
          <section className={styles.slideSection}>
            <SlideToUnlock onUnlock={() => router.push('/client/workout/free')} />
          </section>

          {/* Tu semana - Scroll Picker estilo Crown Swap */}
          <section className={styles.weekSection}>
            <p className={styles.sectionLabel}>Tu semana</p>
            <div 
              ref={scrollRef}
              className={styles.dayPicker}
              onScroll={handleScroll}
              onTouchEnd={handleScrollEnd}
              onMouseUp={handleScrollEnd}
            >
              {dayPickerItems.map((day, index) => {
                const isSelected = index === selectedDayIndex;
                const distance = Math.abs(index - selectedDayIndex);
                const opacity = Math.max(0.4, 1 - distance * 0.2);
                const scale = Math.max(0.9, 1 - distance * 0.03);
                
                return (
                  <div
                    key={index}
                    className={`${styles.dayCard} ${isSelected ? styles.selected : ''} ${day.isToday ? styles.isToday : ''} ${day.isPast ? styles.isPast : ''}`}
                    onClick={() => scrollToDay(index)}
                    style={{
                      opacity: isSelected ? 1 : opacity,
                      transform: `scale(${isSelected ? 1 : scale})`,
                    }}
                  >
                    <span className={styles.dayCardWeekday}>{DAY_NAMES_SHORT[day.dayOfWeek]}</span>
                    <span className={styles.dayCardNumber}>{day.dayNumber}</span>
                    <span className={styles.dayCardMonth}>{day.monthShort}</span>
                    <span className={styles.dayCardRoutine}>{day.routine}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Timeline fija con fechas dinámicas */}
            <div className={styles.timelineContainer}>
              <div className={styles.timelineLine} />
              
              {/* Punto izquierdo - día anterior */}
              <div className={styles.timelineDotItem}>
                <div className={styles.timelineDot} />
                <span className={styles.timelineDotLabel}>
                  {selectedDayIndex > 0 
                    ? `${DAY_NAMES_SHORT[dayPickerItems[selectedDayIndex - 1].dayOfWeek]} ${dayPickerItems[selectedDayIndex - 1].dayNumber}`
                    : ''}
                </span>
              </div>
              
              {/* Punto central - día seleccionado */}
              <div className={styles.timelineDotItem}>
                <div className={`${styles.timelineDot} ${styles.center}`} />
                <span className={`${styles.timelineDotLabel} ${styles.center}`}>
                  {dayPickerItems[selectedDayIndex]?.isToday 
                    ? 'Hoy' 
                    : `${DAY_NAMES_SHORT[dayPickerItems[selectedDayIndex]?.dayOfWeek]} ${dayPickerItems[selectedDayIndex]?.dayNumber}`}
                </span>
              </div>
              
              {/* Punto derecho - día siguiente */}
              <div className={styles.timelineDotItem}>
                <div className={styles.timelineDot} />
                <span className={styles.timelineDotLabel}>
                  {selectedDayIndex < dayPickerItems.length - 1 
                    ? `${DAY_NAMES_SHORT[dayPickerItems[selectedDayIndex + 1].dayOfWeek]} ${dayPickerItems[selectedDayIndex + 1].dayNumber}`
                    : ''}
                </span>
              </div>
            </div>
          </section>

          {/* Actividad reciente */}
          <section className={styles.activitySection}>
            <p className={styles.sectionLabel}>Actividad reciente</p>
            <div className={styles.activityCards}>
              {/* Level Ring Card */}
              <div className={styles.activityCard}>
                <div className={styles.levelRing}>
                  <svg className={styles.levelRingSvg} viewBox="0 0 100 100">
                    <circle className={styles.levelRingBg} cx="50" cy="50" r="42" />
                    <circle 
                      className={styles.levelRingProgress} 
                      cx="50" 
                      cy="50" 
                      r="42"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className={styles.levelBadge}>
                    Nivel {lastRoutineLevel}
                  </div>
                </div>
                <span className={styles.activityLabel}>Último entrenamiento</span>
              </div>

              {/* Heatmap Card - Círculos dispersos */}
              <div className={styles.activityCard}>
                <div className={styles.heatmapContainer}>
                  <svg className={styles.heatmapSvg} viewBox="0 0 120 120">
                    {/* Ejes cruzados */}
                    <line className={styles.heatmapAxis} x1="60" y1="10" x2="60" y2="110" />
                    <line className={styles.heatmapAxis} x1="10" y1="60" x2="110" y2="60" />
                    
                    {/* Labels en los extremos */}
                    <text className={styles.heatmapLabel} x="60" y="8">Pecho</text>
                    <text className={styles.heatmapLabel} x="110" y="63">Espalda</text>
                    <text className={styles.heatmapLabel} x="60" y="118">Isquiotibiales</text>
                    <text className={styles.heatmapLabel} x="10" y="63">Cuadriceps</text>
                    
                    {/* Círculos dispersos - tamaño basado en intensidad */}
                    {/* Pecho - arriba */}
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointGreen}`} 
                      cx="60" cy={25 - muscleHeatmap.pecho * 0.1} 
                      r={8 + muscleHeatmap.pecho * 0.08} />
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointYellow}`} 
                      cx="72" cy={35 - muscleHeatmap.pecho * 0.05} 
                      r={5 + muscleHeatmap.pecho * 0.04} />
                    
                    {/* Espalda - derecha */}
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointGreen}`} 
                      cx={85 + muscleHeatmap.espalda * 0.1} cy="55" 
                      r={7 + muscleHeatmap.espalda * 0.06} />
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointOlive}`} 
                      cx={80 + muscleHeatmap.espalda * 0.05} cy="68" 
                      r={5 + muscleHeatmap.espalda * 0.04} />
                    
                    {/* Isquiotibiales - abajo */}
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointYellow}`} 
                      cx="55" cy={85 + muscleHeatmap.isquios * 0.1} 
                      r={6 + muscleHeatmap.isquios * 0.05} />
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointOlive}`} 
                      cx="68" cy={90 + muscleHeatmap.isquios * 0.05} 
                      r={5 + muscleHeatmap.isquios * 0.04} />
                    
                    {/* Cuadriceps - izquierda */}
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointYellow}`} 
                      cx={35 - muscleHeatmap.cuadriceps * 0.1} cy="55" 
                      r={7 + muscleHeatmap.cuadriceps * 0.06} />
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointGreen}`} 
                      cx={40 - muscleHeatmap.cuadriceps * 0.05} cy="70" 
                      r={5 + muscleHeatmap.cuadriceps * 0.04} />
                    
                    {/* Centro */}
                    <circle className={`${styles.heatmapPoint} ${styles.heatmapPointYellow}`} cx="60" cy="60" r="8" />
                  </svg>
                </div>
                <span className={styles.activityLabel}>Último entrenamiento</span>
              </div>
            </div>
          </section>
        </>
      )}

      {activeTab === 'history' && (
        <div className={styles.historyContainer}>
          {/* Switch Lista/Calendario */}
          <div className={styles.historyToggle}>
            <button 
              className={`${styles.historyToggleBtn} ${historyViewMode === 'list' ? styles.historyToggleActive : ''}`}
              onClick={() => setHistoryViewMode('list')}
            >
              Lista
            </button>
            <button 
              className={`${styles.historyToggleBtn} ${historyViewMode === 'calendar' ? styles.historyToggleActive : ''}`}
              onClick={() => setHistoryViewMode('calendar')}
            >
              Calendario
            </button>
          </div>

          {historyViewMode === 'list' ? (
            /* Vista Lista */
            workoutHistory.length === 0 ? (
              <div className={styles.emptyHistory}>
                <p>Aún no tienes entrenamientos registrados</p>
                <span>¡Comienza hoy tu primer entrenamiento!</span>
              </div>
            ) : (
              <>
                <div className={styles.historyList}>
                  {workoutHistory
                    .slice((historyPage - 1) * HISTORY_PAGE_SIZE, historyPage * HISTORY_PAGE_SIZE)
                    .map((session) => {
                    const date = new Date(session.date);
                    const exerciseCount = Array.isArray(session.exercisesCompleted) 
                      ? session.exercisesCompleted.length 
                      : 0;
                    const sessionTitle = session.isFreeWorkout 
                      ? 'Entrenamiento Libre' 
                      : (session.sessionName || 'Entrenamiento');
                    
                    return (
                      <div 
                        key={session.id} 
                        className={styles.historyCard}
                        onClick={() => router.push(`/client/routines/session/${session.id}`)}
                      >
                        <div className={styles.historyDateBlock}>
                          <span className={styles.historyDateDay}>{date.getDate()}</span>
                          <span className={styles.historyDateMonth}>
                            {date.toLocaleDateString('es-AR', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className={styles.historyDateTime}>
                            {date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className={styles.historyInfo}>
                          <span className={styles.historyTitle}>{sessionTitle}</span>
                          <span className={styles.historyMeta}>
                            {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''} • {session.caloriesBurned || 0}kcal
                          </span>
                        </div>
                        <div className={`${styles.historyBadge} ${session.isFreeWorkout ? styles.historyBadgeFree : ''}`}>
                          {session.isFreeWorkout ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Paginación */}
                {workoutHistory.length > HISTORY_PAGE_SIZE && (
                  <div className={styles.historyPagination}>
                    <button 
                      className={styles.paginationBtn}
                      onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                      disabled={historyPage === 1}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                    </button>
                    <span className={styles.paginationInfo}>
                      {historyPage} / {Math.ceil(workoutHistory.length / HISTORY_PAGE_SIZE)}
                    </span>
                    <button 
                      className={styles.paginationBtn}
                      onClick={() => setHistoryPage(p => Math.min(Math.ceil(workoutHistory.length / HISTORY_PAGE_SIZE), p + 1))}
                      disabled={historyPage >= Math.ceil(workoutHistory.length / HISTORY_PAGE_SIZE)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                  </div>
                )}
              </>
            )
          ) : (
            /* Vista Calendario */
            <div className={styles.calendarContainer}>
              <div className={styles.calendarHeader}>
                <button 
                  className={styles.calendarNav}
                  onClick={() => setHistoryMonth(new Date(historyMonth.getFullYear(), historyMonth.getMonth() - 1, 1))}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15 18 9 12 15 6"/>
                  </svg>
                </button>
                <span className={styles.calendarMonthLabel}>
                  {historyMonth.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                </span>
                <button 
                  className={styles.calendarNav}
                  onClick={() => setHistoryMonth(new Date(historyMonth.getFullYear(), historyMonth.getMonth() + 1, 1))}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              </div>
              
              <div className={styles.calendarWeekdays}>
                {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(d => (
                  <span key={d} className={styles.calendarWeekday}>{d}</span>
                ))}
              </div>
              
              <div className={styles.calendarGrid}>
                {(() => {
                  const year = historyMonth.getFullYear();
                  const month = historyMonth.getMonth();
                  const firstDay = new Date(year, month, 1).getDay();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  const today = new Date();
                  
                  const days: React.ReactNode[] = [];
                  
                  // Días vacíos al inicio
                  for (let i = 0; i < firstDay; i++) {
                    days.push(<div key={`empty-${i}`} className={styles.calendarDayEmpty} />);
                  }
                  
                  // Días del mes
                  for (let day = 1; day <= daysInMonth; day++) {
                    const dayDate = new Date(year, month, day);
                    const isToday = dayDate.toDateString() === today.toDateString();
                    const daySessions = workoutHistory.filter(s => {
                      const sDate = new Date(s.date);
                      return sDate.getFullYear() === year && 
                             sDate.getMonth() === month && 
                             sDate.getDate() === day;
                    });
                    const hasWorkout = daySessions.length > 0;
                    
                    const isSelected = selectedCalendarDate && 
                      selectedCalendarDate.getFullYear() === year &&
                      selectedCalendarDate.getMonth() === month &&
                      selectedCalendarDate.getDate() === day;
                    
                    days.push(
                      <div 
                        key={day}
                        className={`${styles.calendarDay} ${isToday ? styles.calendarDayToday : ''} ${hasWorkout ? styles.calendarDayActive : ''} ${isSelected ? styles.calendarDaySelected : ''}`}
                        onClick={() => {
                          if (hasWorkout) {
                            setSelectedCalendarDate(dayDate);
                          }
                        }}
                      >
                        <span className={styles.calendarDayNumber}>{day}</span>
                        {hasWorkout && <span className={styles.calendarDayDot} />}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
              
              {/* Lista de entrenamientos del día seleccionado */}
              {selectedCalendarDate && (() => {
                const selectedSessions = workoutHistory.filter(s => {
                  const sDate = new Date(s.date);
                  return sDate.getFullYear() === selectedCalendarDate.getFullYear() && 
                         sDate.getMonth() === selectedCalendarDate.getMonth() && 
                         sDate.getDate() === selectedCalendarDate.getDate();
                });
                
                if (selectedSessions.length === 0) return null;
                
                return (
                  <div className={styles.calendarDaySessions}>
                    <h4 className={styles.calendarDaySessionsTitle}>
                      {selectedCalendarDate.toLocaleDateString('es-AR', { 
                        weekday: 'long', 
                        day: 'numeric', 
                        month: 'long' 
                      })}
                    </h4>
                    <div className={styles.calendarDaySessionsList}>
                      {selectedSessions.map((session) => {
                        const sessionTitle = session.isFreeWorkout 
                          ? 'Entrenamiento Libre' 
                          : (session.sessionName || 'Entrenamiento');
                        const exerciseCount = Array.isArray(session.exercisesCompleted) 
                          ? session.exercisesCompleted.length 
                          : 0;
                        
                        return (
                          <div 
                            key={session.id}
                            className={styles.calendarSessionCard}
                            onClick={() => router.push(`/client/routines/session/${session.id}`)}
                          >
                            <div className={styles.calendarSessionIcon}>
                              {session.isFreeWorkout ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                                </svg>
                              ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <div className={styles.calendarSessionInfo}>
                              <span className={styles.calendarSessionTitle}>{sessionTitle}</span>
                              <span className={styles.calendarSessionMeta}>
                                {exerciseCount} ejercicio{exerciseCount !== 1 ? 's' : ''} • {session.durationMinutes || 0} min • {session.caloriesBurned || 0} kcal
                              </span>
                            </div>
                            <svg className={styles.calendarSessionArrow} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 18 15 12 9 6"/>
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {activeTab === 'routines' && (
        <div className={styles.routinesContainer}>
          {/* Rutinas propias */}
          <section className={styles.routinesSection}>
            <div className={styles.routinesSectionHeader}>
              <h3 className={styles.routinesSectionTitle}>Mis rutinas creadas</h3>
              <a href="/client/routines/create" className={styles.createRoutineBtn}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Crear
              </a>
            </div>
            
            {myRoutines.length === 0 ? (
              <div className={styles.emptyRoutines}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <line x1="12" y1="8" x2="12" y2="16"/>
                  <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p>No tienes rutinas creadas</p>
                <span>Crea tu primera rutina personalizada</span>
              </div>
            ) : (
              <div className={styles.routinesList}>
                {myRoutines.map((routine) => {
                  const isExpanded = expandedRoutine === routine.id;
                  return (
                    <div key={routine.id} className={`${styles.routineCard} ${isExpanded ? styles.routineCardExpanded : ''}`}>
                      {/* Header clickeable */}
                      <div 
                        className={styles.routineCardHeader}
                        onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                      >
                        <div className={styles.routineCardMain}>
                          <div className={styles.routineCardIcon}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                              <polyline points="14 2 14 8 20 8"/>
                            </svg>
                          </div>
                          <div className={styles.routineCardInfo}>
                            <span className={styles.routineCardName}>{routine.name}</span>
                            <span className={styles.routineCardMeta}>
                              {routine._count?.exercises || routine.exercises?.length || 0} ejercicios
                            </span>
                          </div>
                        </div>
                        <div className={styles.routineCardHeaderRight}>
                          <span className={styles.routineCardBadge}>Propia</span>
                          <div className={`${styles.routineExpandIcon} ${isExpanded ? styles.rotated : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenido expandible */}
                      <div className={`${styles.routineCardContentWrapper} ${isExpanded ? styles.expanded : ''}`}>
                        <div className={styles.routineCardContentInner}>
                          <div className={styles.routineCardContent}>
                            {/* Días asignados */}
                            <div className={styles.routineCardDays}>
                              {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                                const isAssigned = routine.dayAssignments?.some(d => d.dayOfWeek === day);
                                return (
                                  <span 
                                    key={day} 
                                    className={`${styles.routineDayPill} ${isAssigned ? styles.routineDayActive : ''}`}
                                  >
                                    {DAY_NAMES_SHORT[day]}
                                  </span>
                                );
                              })}
                            </div>
                            
                            <div className={styles.routineCardActions}>
                              <button 
                                className={styles.routineActionBtn}
                                onClick={(e) => { e.stopPropagation(); router.push(`/client/routine/${routine.id}/detail`); }}
                              >
                                Ver detalle
                              </button>
                              <button 
                                className={styles.routineActionBtnSecondary}
                                onClick={(e) => { e.stopPropagation(); router.push(`/client/routines/${routine.id}/modify`); }}
                              >
                                Modificar
                              </button>
                              <button 
                                className={styles.routineActionBtnSecondary}
                                onClick={(e) => { e.stopPropagation(); router.push(`/client/routines/${routine.id}/edit`); }}
                              >
                                Días
                              </button>
                              <button 
                                className={styles.routineActionBtnDelete}
                                onClick={(e) => { e.stopPropagation(); handleDeleteRoutine(routine.id, routine.name); }}
                                title="Eliminar rutina"
                              >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                                  <line x1="10" y1="11" x2="10" y2="17"/>
                                  <line x1="14" y1="11" x2="14" y2="17"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Rutinas asignadas por el profesional */}
          <section className={styles.routinesSection}>
            <div className={styles.routinesSectionHeader}>
              <h3 className={styles.routinesSectionTitle}>Rutinas asignadas</h3>
            </div>
            
            {assignedRoutines.length === 0 ? (
              <div className={styles.emptyRoutines}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                <p>No tienes rutinas asignadas</p>
                <span>Tu entrenador te asignará rutinas próximamente</span>
              </div>
            ) : (
              <div className={styles.routinesList}>
                {assignedRoutines.map((routine) => {
                  const isExpanded = expandedRoutine === `assigned-${routine.id}`;
                  return (
                    <div key={routine.id} className={`${styles.routineCard} ${isExpanded ? styles.routineCardExpanded : ''}`}>
                      {/* Header clickeable */}
                      <div 
                        className={styles.routineCardHeader}
                        onClick={() => setExpandedRoutine(isExpanded ? null : `assigned-${routine.id}`)}
                      >
                        <div className={styles.routineCardMain}>
                          <div className={styles.routineCardIconAssigned}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                              <circle cx="9" cy="7" r="4"/>
                            </svg>
                          </div>
                          <div className={styles.routineCardInfo}>
                            <span className={styles.routineCardName}>{routine.name}</span>
                            <span className={styles.routineCardMeta}>
                              {routine._count?.exercises || routine.exercises?.length || 0} ejercicios
                            </span>
                          </div>
                        </div>
                        <div className={styles.routineCardHeaderRight}>
                          <span className={styles.routineCardBadgeAssigned}>Asignada</span>
                          <div className={`${styles.routineExpandIcon} ${isExpanded ? styles.rotated : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M6 9l6 6 6-6"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      
                      {/* Contenido expandible */}
                      <div className={`${styles.routineCardContentWrapper} ${isExpanded ? styles.expanded : ''}`}>
                        <div className={styles.routineCardContentInner}>
                          <div className={styles.routineCardContent}>
                            {/* Días asignados por el profesional */}
                            {routine.dayAssignments && routine.dayAssignments.length > 0 && (
                              <div className={styles.routineCardDays}>
                                {[1, 2, 3, 4, 5, 6, 0].map((day) => {
                                  const isAssigned = routine.dayAssignments?.some(d => d.dayOfWeek === day);
                                  return (
                                    <span 
                                      key={day} 
                                      className={`${styles.routineDayPill} ${isAssigned ? styles.routineDayActiveAssigned : ''}`}
                                    >
                                      {DAY_NAMES_SHORT[day]}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            
                            <div className={styles.routineCardActions}>
                              <button 
                                className={styles.routineActionBtn}
                                onClick={(e) => { e.stopPropagation(); router.push(`/client/routine/${routine.id}/detail`); }}
                              >
                                Ver detalle
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
