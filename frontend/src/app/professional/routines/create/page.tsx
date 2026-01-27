'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string | null;
  description?: string;
  difficulty?: number;
}

interface SelectedExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string | null;
  sets: number;
  reps: string;
  restSeconds: number;
}

export default function CreateRoutinePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'MUSCULACION' as 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA',
    level: 3,
  });

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [selectedExercises, setSelectedExercises] = useState<SelectedExercise[]>([]);
  const [tempSelectedIds, setTempSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('');

  useEffect(() => {
    apiFetch('/professional/exercises/approved')
      .then(res => res.json())
      .then(data => setAvailableExercises(data.exercises || []))
      .catch(console.error);
  }, []);

  const muscleGroups = [...new Set(availableExercises.map(e => e.muscleGroup).filter(Boolean))] as string[];

  const filteredExercises = availableExercises.filter(ex => {
    const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGroup = !selectedGroup || ex.muscleGroup === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const openExerciseModal = () => {
    const currentIds = new Set(selectedExercises.map(e => e.exerciseId));
    setTempSelectedIds(currentIds);
    setSearchTerm('');
    setSelectedGroup('');
    setShowExerciseModal(true);
  };

  const toggleExerciseSelection = (exercise: Exercise) => {
    setTempSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exercise.id)) {
        newSet.delete(exercise.id);
      } else {
        newSet.add(exercise.id);
      }
      return newSet;
    });
  };

  const confirmExerciseSelection = () => {
    const currentExerciseIds = new Set(selectedExercises.map(e => e.exerciseId));
    
    const exercisesToAdd = availableExercises.filter(
      ex => tempSelectedIds.has(ex.id) && !currentExerciseIds.has(ex.id)
    );
    
    const updatedExercises = selectedExercises.filter(
      ex => tempSelectedIds.has(ex.exerciseId)
    );
    
    const newExercises: SelectedExercise[] = exercisesToAdd.map(ex => ({
      id: `${ex.id}-${Date.now()}-${Math.random()}`,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      sets: 3,
      reps: '12',
      restSeconds: 60,
    }));
    
    setSelectedExercises([...updatedExercises, ...newExercises]);
    setShowExerciseModal(false);
  };

  const removeExercise = (id: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== id));
  };

  const updateExercise = (id: string, field: keyof SelectedExercise, value: string | number) => {
    setSelectedExercises(prev => prev.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (selectedExercises.length === 0) {
      setError('Agrega al menos un ejercicio');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/professional/routines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          exercises: selectedExercises.map((ex, index) => ({
            exerciseId: ex.exerciseId,
            order: index + 1,
            sets: ex.sets,
            reps: ex.reps,
            restSeconds: ex.restSeconds,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear');
      }

      const data = await res.json();
      router.push(`/professional/routines/${data.routine.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={handleSubmit} className={styles.form}>
        {/* Header */}
        <div className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={() => router.back()}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 className={styles.title}>Nueva Rutina</h1>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        {/* Info básica */}
        <div className={styles.section}>
          <input
            type="text"
            className={styles.nameInput}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nombre de la rutina"
          />
          
          <textarea
            className={styles.descriptionInput}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descripción (opcional)"
            rows={2}
          />
          
          <div className={styles.row}>
            <div className={styles.categories}>
              {(['MUSCULACION', 'AEROBICA', 'DEPORTISTA'] as const).map(cat => (
                <button
                  key={cat}
                  type="button"
                  className={`${styles.catBtn} ${formData.category === cat ? styles.active : ''}`}
                  onClick={() => setFormData({ ...formData, category: cat })}
                >
                  {cat === 'MUSCULACION' ? '🏋️' : cat === 'AEROBICA' ? '🏃' : '⚽'}
                </button>
              ))}
            </div>
            <div className={styles.levelRow}>
              <span className={styles.levelLabel}>Nivel</span>
              {[1, 2, 3, 4, 5].map(l => (
                <button
                  key={l}
                  type="button"
                  className={`${styles.lvlBtn} ${formData.level >= l ? styles.active : ''}`}
                  onClick={() => setFormData({ ...formData, level: l })}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Ejercicios seleccionados */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span>Ejercicios de la rutina</span>
            <button type="button" className={styles.addExercisesBtn} onClick={openExerciseModal}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar
            </button>
          </div>
          
          {selectedExercises.length === 0 ? (
            <div className={styles.emptyState} onClick={openExerciseModal}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6.5 6.5h11M6.5 17.5h11"/>
                <rect x="3" y="8" width="4" height="8" rx="1"/>
                <rect x="17" y="8" width="4" height="8" rx="1"/>
                <rect x="7" y="10" width="10" height="4" rx="0.5"/>
              </svg>
              <p>Toca para agregar ejercicios</p>
            </div>
          ) : (
            <div className={styles.selectedList}>
              {selectedExercises.map((ex, idx) => (
                <div key={ex.id} className={styles.selectedItem}>
                  <div className={styles.exerciseHeader}>
                    <span className={styles.order}>{idx + 1}</span>
                    <div className={styles.exerciseInfo}>
                      <span className={styles.exName}>{ex.name}</span>
                      {ex.muscleGroup && <span className={styles.muscleTag}>{ex.muscleGroup}</span>}
                    </div>
                    <button type="button" className={styles.removeBtn} onClick={() => removeExercise(ex.id)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                  <div className={styles.configRow}>
                    <div className={styles.inputGroup}>
                      <label>Series</label>
                      <input
                        type="number"
                        value={ex.sets}
                        onChange={(e) => updateExercise(ex.id, 'sets', parseInt(e.target.value) || 1)}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Reps</label>
                      <input
                        type="text"
                        value={ex.reps}
                        onChange={(e) => updateExercise(ex.id, 'reps', e.target.value)}
                        placeholder="12"
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Descanso (s)</label>
                      <input
                        type="number"
                        value={ex.restSeconds}
                        onChange={(e) => updateExercise(ex.id, 'restSeconds', parseInt(e.target.value) || 60)}
                        min="0"
                        step="15"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>

      {/* Modal fullscreen para selección de ejercicios */}
      {showExerciseModal && (
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <button type="button" className={styles.modalClose} onClick={() => setShowExerciseModal(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            <h2 className={styles.modalTitle}>Seleccionar Ejercicios</h2>
            <button type="button" className={styles.modalConfirm} onClick={confirmExerciseSelection}>
              Listo ({tempSelectedIds.size})
            </button>
          </div>

          <div className={styles.modalSearch}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.modalFilters}>
            <button
              type="button"
              className={`${styles.filterChip} ${selectedGroup === '' ? styles.active : ''}`}
              onClick={() => setSelectedGroup('')}
            >
              Todos
            </button>
            {muscleGroups.map(g => (
              <button
                key={g}
                type="button"
                className={`${styles.filterChip} ${selectedGroup === g ? styles.active : ''}`}
                onClick={() => setSelectedGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>

          <div className={styles.modalList}>
            {filteredExercises.map(ex => {
              const isSelected = tempSelectedIds.has(ex.id);
              return (
                <button
                  key={ex.id}
                  type="button"
                  className={`${styles.exerciseOption} ${isSelected ? styles.selected : ''}`}
                  onClick={() => toggleExerciseSelection(ex)}
                >
                  <div className={styles.exerciseOptionInfo}>
                    <span className={styles.exerciseOptionName}>{ex.name}</span>
                    {ex.muscleGroup && <span className={styles.exerciseOptionMuscle}>{ex.muscleGroup}</span>}
                  </div>
                  <div className={styles.checkbox}>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
            {filteredExercises.length === 0 && (
              <div className={styles.modalEmpty}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <p>No se encontraron ejercicios</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
