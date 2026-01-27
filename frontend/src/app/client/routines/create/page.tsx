'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  description: string | null;
}

interface RoutineExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string;
  restSeconds: number;
}

const DAYS = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 0, label: 'Dom' },
];

export default function CreateRoutinePage() {
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState(1);
  const [intensity, setIntensity] = useState(3);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [routineExercises, setRoutineExercises] = useState<RoutineExercise[]>([]);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [muscleFilter, setMuscleFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForAdd, setSelectedForAdd] = useState<Set<string>>(new Set());
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isTouchDragging, setIsTouchDragging] = useState(false);
  const [dragTranslateY, setDragTranslateY] = useState(0);
  const touchTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exerciseListRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number>(0);
  const autoScrollRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const res = await apiFetch('/client/exercises/global');
        const data = await res.json();
        setExercises(data.exercises || []);
      } catch (err) {
        console.error('Error fetching exercises:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Bloquear scroll durante drag - necesita passive: false
  useEffect(() => {
    const listEl = exerciseListRef.current;
    if (!listEl) return;

    const preventScroll = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };

    listEl.addEventListener('touchmove', preventScroll, { passive: false });
    
    // También bloquear en el document durante drag
    const preventDocScroll = (e: TouchEvent) => {
      if (isTouchDragging) {
        e.preventDefault();
      }
    };
    document.addEventListener('touchmove', preventDocScroll, { passive: false });

    return () => {
      listEl.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('touchmove', preventDocScroll);
    };
  }, [isTouchDragging]);

  const muscleGroups = [...new Set(exercises.map(e => e.muscleGroup).filter(Boolean))] as string[];

  const filteredExercises = exercises.filter(e => {
    const matchesMuscle = !muscleFilter || e.muscleGroup === muscleFilter;
    const matchesSearch = !searchQuery || 
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.muscleGroup && e.muscleGroup.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesMuscle && matchesSearch;
  });

  // Ejercicios ya agregados (para mostrar como deshabilitados)
  const addedExerciseIds = new Set(routineExercises.map(e => e.exerciseId));

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedForAdd(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const addSelectedExercises = () => {
    const exercisesToAdd = exercises.filter(e => selectedForAdd.has(e.id));
    const newExercises = exercisesToAdd.map(exercise => ({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      sets: 3,
      reps: '12',
      restSeconds: 60,
    }));
    setRoutineExercises(prev => [...prev, ...newExercises]);
    setSelectedForAdd(new Set());
    setSearchQuery('');
    setShowExercisePicker(false);
  };

  const openExercisePicker = () => {
    setSelectedForAdd(new Set());
    setSearchQuery('');
    setMuscleFilter(null);
    setShowExercisePicker(true);
  };

  const removeExercise = (index: number) => {
    setRoutineExercises(prev => prev.filter((_, i) => i !== index));
  };

  const updateExercise = (index: number, field: keyof RoutineExercise, value: string | number) => {
    setRoutineExercises(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === routineExercises.length - 1)
    ) {
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...routineExercises];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];
    setRoutineExercises(updated);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const updated = [...routineExercises];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(index, 0, draggedItem);
    setRoutineExercises(updated);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Touch events para drag and drop móvil - motor simplificado y estable
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    dragStartYRef.current = touch.clientY;
    
    // Long press para iniciar drag
    touchTimerRef.current = setTimeout(() => {
      setDraggedIndex(index);
      setIsTouchDragging(true);
      setDragTranslateY(0);
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
    }, 150);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Cancelar timer si se mueve antes de activar drag
    if (!isTouchDragging && touchStartY !== null && touchTimerRef.current) {
      const touch = e.touches[0];
      const deltaY = Math.abs(touch.clientY - touchStartY);
      if (deltaY > 8) {
        clearTimeout(touchTimerRef.current);
        touchTimerRef.current = null;
        return;
      }
    }

    if (!isTouchDragging || draggedIndex === null || !exerciseListRef.current) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const touch = e.touches[0];
    const elements = Array.from(exerciseListRef.current.querySelectorAll('[data-exercise-index]')) as HTMLElement[];
    
    if (elements.length === 0 || !elements[draggedIndex]) return;

    // Calcular límites estrictos basados en la lista
    const firstRect = elements[0].getBoundingClientRect();
    const lastRect = elements[elements.length - 1].getBoundingClientRect();
    const draggedRect = elements[draggedIndex].getBoundingClientRect();
    const cardHeight = draggedRect.height;
    
    // Calcular translateY con límites estrictos
    let translateY = touch.clientY - dragStartYRef.current;
    
    // Límite superior: la card no puede subir más allá del tope de la primera card - 8px
    const maxUp = firstRect.top - draggedRect.top - 8;
    // Límite inferior: la card no puede bajar más allá del fondo de la última card + 8px
    const maxDown = lastRect.bottom - draggedRect.bottom + 8;
    
    translateY = Math.max(maxUp, Math.min(maxDown, translateY));
    
    setDragTranslateY(translateY);

    // Detectar intercambio basado en posición del dedo
    for (let i = 0; i < elements.length; i++) {
      const targetIndex = parseInt(elements[i].dataset.exerciseIndex || '0');
      if (targetIndex === draggedIndex) continue;
      
      const rect = elements[i].getBoundingClientRect();
      const centerY = rect.top + rect.height / 2;
      
      // Intercambio cuando el dedo pasa el centro de otra card
      if (targetIndex < draggedIndex && touch.clientY < centerY) {
        // Mover hacia arriba
        const updated = [...routineExercises];
        const [draggedItem] = updated.splice(draggedIndex, 1);
        updated.splice(targetIndex, 0, draggedItem);
        setRoutineExercises(updated);
        setDraggedIndex(targetIndex);
        // Reset del punto de referencia
        dragStartYRef.current = touch.clientY;
        setDragTranslateY(0);
        if (navigator.vibrate) navigator.vibrate(20);
        break;
      }
      
      if (targetIndex > draggedIndex && touch.clientY > centerY) {
        // Mover hacia abajo
        const updated = [...routineExercises];
        const [draggedItem] = updated.splice(draggedIndex, 1);
        updated.splice(targetIndex, 0, draggedItem);
        setRoutineExercises(updated);
        setDraggedIndex(targetIndex);
        // Reset del punto de referencia
        dragStartYRef.current = touch.clientY;
        setDragTranslateY(0);
        if (navigator.vibrate) navigator.vibrate(20);
        break;
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsTouchDragging(false);
    setTouchStartY(null);
    setDragTranslateY(0);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (routineExercises.length === 0) {
      setError('Agrega al menos un ejercicio');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const res = await apiFetch('/client/routines/my', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          category: 'MUSCULACION',
          level,
          intensity,
          exercises: routineExercises.map(e => ({
            exerciseId: e.exerciseId,
            sets: e.sets,
            reps: e.reps,
            restSeconds: e.restSeconds,
          })),
          dayAssignments: selectedDays,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear rutina');
      }

      router.push('/client/routines');
    } catch (err) {
      console.error('Error creating routine:', err);
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (errorMsg.includes('fetch') || errorMsg.includes('network') || errorMsg.includes('Load failed')) {
        setError(`Error de conexión: ${errorMsg}. Intenta de nuevo.`);
      } else {
        setError(errorMsg || 'Error desconocido');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/client/routines" className={styles.backBtn}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </Link>
        <h1 className={styles.title}>Crear Rutina</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.form}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre de la rutina *</label>
          <input
            type="text"
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Día de pecho y tríceps"
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción (opcional)</label>
          <textarea
            className={styles.textarea}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notas sobre esta rutina..."
            rows={2}
          />
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label className={styles.label}>Nivel: {level}/5</label>
            <div className={styles.sliderContainer}>
              <div className={styles.sliderTrack}>
                <div className={styles.sliderFill} style={{ width: `${((level - 1) / 4) * 100}%` }} />
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={level}
                onChange={(e) => setLevel(parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Intensidad: {intensity}/5</label>
            <div className={styles.sliderContainer}>
              <div className={styles.sliderTrack}>
                <div className={styles.sliderFill} style={{ width: `${((intensity - 1) / 4) * 100}%` }} />
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={intensity}
                onChange={(e) => setIntensity(parseInt(e.target.value))}
                className={styles.slider}
              />
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Días de la semana</label>
          <div className={styles.daysGrid}>
            {DAYS.map((day) => (
              <button
                key={day.value}
                type="button"
                className={`${styles.dayBtn} ${selectedDays.includes(day.value) ? styles.dayActive : ''}`}
                onClick={() => toggleDay(day.value)}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.exercisesSection}>
          <div className={styles.exercisesHeader}>
            <label className={styles.label}>Ejercicios ({routineExercises.length})</label>
            <button
              type="button"
              className={styles.addExerciseBtn}
              onClick={openExercisePicker}
            >
              + Agregar
            </button>
          </div>

          {routineExercises.length === 0 ? (
            <div className={styles.emptyExercises}>
              <p>No hay ejercicios agregados</p>
              <button
                type="button"
                className={styles.addFirstBtn}
                onClick={openExercisePicker}
              >
                Agregar primer ejercicio
              </button>
            </div>
          ) : (
            <div 
              className={`${styles.exercisesList} ${isTouchDragging ? styles.touchDragging : ''}`}
              ref={exerciseListRef}
            >
              {routineExercises.map((ex, index) => (
                <div 
                  key={index}
                  data-exercise-index={index}
                  className={`${styles.exerciseItem} ${draggedIndex === index ? styles.dragging : ''} ${dragOverIndex === index ? styles.dragOver : ''}`}
                  style={draggedIndex === index && isTouchDragging ? { 
                    transform: `translateY(${dragTranslateY}px) scale(1.02)`,
                    zIndex: 100,
                    position: 'relative',
                  } : undefined}
                  draggable={!isTouchDragging}
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(index, e)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className={styles.exerciseOrder}>
                    <div className={styles.dragHandle}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="9" cy="6" r="2"/>
                        <circle cx="15" cy="6" r="2"/>
                        <circle cx="9" cy="12" r="2"/>
                        <circle cx="15" cy="12" r="2"/>
                        <circle cx="9" cy="18" r="2"/>
                        <circle cx="15" cy="18" r="2"/>
                      </svg>
                    </div>
                    <span>{index + 1}</span>
                  </div>
                  <div className={styles.exerciseInfo}>
                    <span className={styles.exerciseName}>{ex.exerciseName}</span>
                    <div className={styles.exerciseInputs}>
                      <div className={styles.inputGroup}>
                        <label>Series</label>
                        <input
                          type="number"
                          value={ex.sets}
                          onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 0)}
                          min="1"
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Reps</label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Desc.</label>
                        <input
                          type="number"
                          value={ex.restSeconds}
                          onChange={(e) => updateExercise(index, 'restSeconds', parseInt(e.target.value) || 0)}
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.removeBtn}
                    onClick={() => removeExercise(index)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.cancelBtn}
          onClick={() => router.push('/client/routines')}
        >
          Cancelar
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Crear Rutina'}
        </button>
      </div>

      {/* Exercise Picker Modal */}
      {showExercisePicker && (
        <div className={styles.overlay} onClick={() => setShowExercisePicker(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Seleccionar Ejercicios</h2>
              <button className={styles.closeBtn} onClick={() => setShowExercisePicker(false)}>×</button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className={styles.searchBar}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar ejercicios..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
                autoFocus
              />
              {searchQuery && (
                <button className={styles.clearSearch} onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            {/* Filtros por grupo muscular */}
            <div className={styles.muscleFilters}>
              <button
                className={`${styles.muscleBtn} ${!muscleFilter ? styles.muscleActive : ''}`}
                onClick={() => setMuscleFilter(null)}
              >
                Todos
              </button>
              {muscleGroups.map((group) => (
                <button
                  key={group}
                  className={`${styles.muscleBtn} ${muscleFilter === group ? styles.muscleActive : ''}`}
                  onClick={() => setMuscleFilter(group)}
                >
                  {group}
                </button>
              ))}
            </div>

            {/* Contador de seleccionados */}
            {selectedForAdd.size > 0 && (
              <div className={styles.selectedCount}>
                {selectedForAdd.size} ejercicio{selectedForAdd.size > 1 ? 's' : ''} seleccionado{selectedForAdd.size > 1 ? 's' : ''}
              </div>
            )}

            {/* Lista de ejercicios */}
            <div className={styles.exercisePickerList}>
              {filteredExercises.length === 0 ? (
                <div className={styles.noResults}>No se encontraron ejercicios</div>
              ) : (
                filteredExercises.map((ex) => {
                  const isAlreadyAdded = addedExerciseIds.has(ex.id);
                  const isSelected = selectedForAdd.has(ex.id);
                  return (
                    <button
                      key={ex.id}
                      className={`${styles.exercisePickerItem} ${isSelected ? styles.exercisePickerSelected : ''} ${isAlreadyAdded ? styles.exercisePickerDisabled : ''}`}
                      onClick={() => !isAlreadyAdded && toggleExerciseSelection(ex.id)}
                      disabled={isAlreadyAdded}
                    >
                      <div className={styles.exercisePickerCheck}>
                        {isAlreadyAdded ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 12h14"/>
                          </svg>
                        ) : isSelected ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        ) : null}
                      </div>
                      <div className={styles.exercisePickerInfo}>
                        <span className={styles.exercisePickerName}>{ex.name}</span>
                        <span className={styles.exercisePickerMuscle}>{ex.muscleGroup}</span>
                      </div>
                      {isAlreadyAdded && <span className={styles.alreadyAddedBadge}>Agregado</span>}
                    </button>
                  );
                })
              )}
            </div>

            {/* Botón de agregar */}
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelModalBtn}
                onClick={() => setShowExercisePicker(false)}
              >
                Cancelar
              </button>
              <button 
                className={styles.addSelectedBtn}
                onClick={addSelectedExercises}
                disabled={selectedForAdd.size === 0}
              >
                Agregar {selectedForAdd.size > 0 ? `(${selectedForAdd.size})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
