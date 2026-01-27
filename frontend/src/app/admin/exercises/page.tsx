'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { ExerciseList, Exercise } from '@/components/exercises';

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

export default function ExercisesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    try {
      const res = await apiFetch('/admin/exercises');
      const data = await res.json();
      setExercises(data.exercises || []);
      return data.exercises || [];
    } catch (error) {
      console.error('Error fetching exercises:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  // Handle edit param from URL (from detail page)
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && exercises.length > 0) {
      const exerciseToEdit = exercises.find(e => e.id === editId);
      if (exerciseToEdit) {
        setEditingExercise(exerciseToEdit);
        setModalOpen(true);
        // Clear the URL param
        router.replace('/admin/exercises');
      }
    }
  }, [searchParams, exercises, router]);

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/admin/exercises/${id}/approve`, { method: 'POST' });
      await fetchExercises();
    } catch (error) {
      console.error('Error approving exercise:', error);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await apiFetch(`/admin/exercises/${id}/reject`, { method: 'POST' });
      await fetchExercises();
    } catch (error) {
      console.error('Error rejecting exercise:', error);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return;
    try {
      await apiFetch(`/admin/exercises/${id}`, { method: 'DELETE' });
      await fetchExercises();
    } catch (error) {
      console.error('Error deleting exercise:', error);
    }
  };

  const searchFiltered = exercises.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    (e.muscleGroup?.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredExercises = filter === 'ALL' 
    ? searchFiltered 
    : filter === 'PENDING' || filter === 'APPROVED' || filter === 'REJECTED'
      ? searchFiltered.filter(e => e.status === filter)
      : searchFiltered.filter(e => e.category === filter);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <h1 className={styles.title}>Ejercicios</h1>
          <p className={styles.subtitle}>Base de ejercicios del gimnasio</p>
        </div>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Ejercicio
        </button>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{exercises.length}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.approved}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{exercises.filter(e => e.status === 'APPROVED').length}</span>
            <span className={styles.statLabel}>aprobados</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.pending}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{exercises.filter(e => e.status === 'PENDING').length}</span>
            <span className={styles.statLabel}>pendientes</span>
          </div>
        </div>
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

      <div className={styles.filters}>
        {['ALL', 'APPROVED', 'PENDING', 'REJECTED', 'MUSCULACION', 'AEROBICA', 'DEPORTISTA'].map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'ALL' ? 'Todos' : statusLabels[f] || categoryLabels[f]}
          </button>
        ))}
      </div>

      <div className={styles.resultsCount}>
        {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando ejercicios...</div>
      ) : (
        <ExerciseList
          exercises={filteredExercises}
          userRole="admin"
          onApprove={handleApprove}
          onReject={handleReject}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showStatus={true}
          detailBasePath="/admin/exercises"
        />
      )}

      {modalOpen && (
        <ExerciseModal
          exercise={editingExercise}
          onClose={() => {
            setModalOpen(false);
            setEditingExercise(null);
          }}
          onSave={() => {
            setModalOpen(false);
            setEditingExercise(null);
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

function ExerciseModal({ exercise, onClose, onSave }: { exercise: Exercise | null; onClose: () => void; onSave: () => void }) {
  const isEditing = !!exercise;
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    muscleGroup: exercise?.muscleGroup || '',
    category: (exercise?.category || 'MUSCULACION') as 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA',
    difficulty: exercise?.difficulty || 3,
    description: exercise?.description || '',
    videoUrl: exercise?.videoUrl || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const url = isEditing ? `/admin/exercises/${exercise.id}` : '/admin/exercises';
      const method = isEditing ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || (isEditing ? 'Error al actualizar' : 'Error al crear'));
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
          <h2 className={styles.modalTitle}>{isEditing ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          {!isEditing && <p className={styles.notice}>Este ejercicio será creado como oficial del gimnasio y quedará aprobado automáticamente.</p>}

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
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (isEditing ? 'Guardando...' : 'Creando...') : (isEditing ? 'Guardar cambios' : 'Crear ejercicio')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
