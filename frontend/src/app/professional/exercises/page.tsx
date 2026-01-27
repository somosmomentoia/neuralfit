'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { ExerciseList, Exercise } from '@/components/exercises';

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

export default function ProfessionalExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const [search, setSearch] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();

  const fetchExercises = async () => {
    try {
      const [myRes, allRes, meRes] = await Promise.all([
        apiFetch('/professional/exercises'),
        apiFetch('/professional/exercises/approved'),
        apiFetch('/auth/me'),
      ]);
      const myData = await myRes.json();
      const allData = await allRes.json();
      const meData = await meRes.json();
      setExercises(myData.exercises || []);
      setAllExercises(allData.exercises || []);
      setCurrentUserId(meData.user?.id);
    } catch (error) {
      console.error('Error fetching exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleEdit = (exercise: Exercise) => {
    // TODO: Implementar edición
    console.log('Edit exercise:', exercise);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;
    try {
      await apiFetch(`/professional/exercises/${id}`, { method: 'DELETE' });
      await fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const baseExercises = tab === 'mine' ? exercises : allExercises;
  const displayedExercises = baseExercises.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.muscleGroup?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Ejercicios</h1>
          <p className={styles.subtitle}>Crea y gestiona ejercicios</p>
        </div>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo
        </button>
      </div>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${tab === 'mine' ? styles.active : ''}`}
          onClick={() => setTab('mine')}
        >
          Mis ejercicios ({exercises.length})
        </button>
        <button 
          className={`${styles.tab} ${tab === 'all' ? styles.active : ''}`}
          onClick={() => setTab('all')}
        >
          Biblioteca ({allExercises.length})
        </button>
      </div>

      {/* Search */}
      <div className={styles.searchBar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.resultsCount}>
        {displayedExercises.length} ejercicio{displayedExercises.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando ejercicios...</div>
      ) : (
        <ExerciseList
          exercises={displayedExercises}
          userRole="professional"
          currentUserId={currentUserId}
          onEdit={tab === 'mine' ? handleEdit : undefined}
          onDelete={tab === 'mine' ? handleDelete : undefined}
          showStatus={tab === 'mine'}
          detailBasePath="/professional/exercises"
        />
      )}

      {modalOpen && (
        <ExerciseModal
          onClose={() => setModalOpen(false)}
          onSave={() => {
            setModalOpen(false);
            fetchExercises();
          }}
        />
      )}
    </div>
  );
}

const MUSCLE_GROUPS = [
  { value: '', label: 'Seleccionar...' },
  { value: 'Pecho', label: 'Pecho' },
  { value: 'Espalda', label: 'Espalda' },
  { value: 'Hombros', label: 'Hombros' },
  { value: 'Bíceps', label: 'Bíceps' },
  { value: 'Tríceps', label: 'Tríceps' },
  { value: 'Antebrazos', label: 'Antebrazos' },
  { value: 'Abdominales', label: 'Abdominales' },
  { value: 'Cuádriceps', label: 'Cuádriceps' },
  { value: 'Isquiotibiales', label: 'Isquiotibiales' },
  { value: 'Glúteos', label: 'Glúteos' },
  { value: 'Pantorrillas', label: 'Pantorrillas' },
  { value: 'Trapecio', label: 'Trapecio' },
  { value: 'Dorsales', label: 'Dorsales' },
  { value: 'Lumbares', label: 'Lumbares' },
  { value: 'Aductores', label: 'Aductores' },
  { value: 'Abductores', label: 'Abductores' },
  { value: 'Core', label: 'Core' },
  { value: 'Multiarticular', label: 'Multiarticular' },
  { value: 'Cardio', label: 'Cardio' },
  { value: 'Cuerpo completo', label: 'Cuerpo completo' },
];

function ExerciseModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    category: 'MUSCULACION' as 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA',
    difficulty: 3,
    description: '',
    videoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/professional/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear');
      }

      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo Ejercicio</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <p className={styles.notice}>Los ejercicios creados quedan pendientes de aprobación por el administrador.</p>

          <div className={styles.field}>
            <label className={styles.label}>Nombre *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Categoría *</label>
              <select
                className={styles.input}
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as typeof formData.category })}
              >
                <option value="MUSCULACION">Musculación</option>
                <option value="AEROBICA">Aeróbica</option>
                <option value="DEPORTISTA">Deportista</option>
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Grupo muscular</label>
              <select
                className={styles.input}
                value={formData.muscleGroup}
                onChange={(e) => setFormData({ ...formData, muscleGroup: e.target.value })}
              >
                {MUSCLE_GROUPS.map((group) => (
                  <option key={group.value} value={group.value}>
                    {group.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Dificultad: {formData.difficulty}</label>
            <input
              type="range"
              min="1"
              max="5"
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: parseInt(e.target.value) })}
              className={styles.range}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Descripción</label>
            <textarea
              className={styles.textarea}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              placeholder="Explicación del ejercicio..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Video YouTube URL</label>
            <input
              type="url"
              className={styles.input}
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://youtube.com/watch?v=..."
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creando...' : 'Crear ejercicio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
