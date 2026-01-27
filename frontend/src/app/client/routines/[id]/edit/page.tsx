'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Routine {
  id: string;
  name: string;
  description: string | null;
  dayAssignments: { dayOfWeek: number }[];
  exercises: {
    id: string;
    exercise: { name: string };
    sets: number;
    reps: string;
  }[];
}

const DAYS = [
  { value: 1, label: 'Lunes', short: 'Lun' },
  { value: 2, label: 'Martes', short: 'Mar' },
  { value: 3, label: 'Miércoles', short: 'Mié' },
  { value: 4, label: 'Jueves', short: 'Jue' },
  { value: 5, label: 'Viernes', short: 'Vie' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' },
];

export default function EditRoutineDaysPage() {
  const params = useParams();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRoutine = async () => {
      try {
        const res = await apiFetch(`/client/routines/my/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setRoutine(data.routine);
          setSelectedDays(data.routine.dayAssignments?.map((d: { dayOfWeek: number }) => d.dayOfWeek) || []);
        } else {
          setError('No se pudo cargar la rutina');
        }
      } catch (err) {
        console.error('Error fetching routine:', err);
        setError('Error al cargar la rutina');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchRoutine();
    }
  }, [params.id]);

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (!routine) return;

    setSaving(true);
    setError('');

    try {
      const res = await apiFetch(`/client/routines/my/${routine.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          dayAssignments: selectedDays,
        }),
      });

      if (res.ok) {
        router.push('/client/routines?tab=routines');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
      }
    } catch (err) {
      console.error('Error saving:', err);
      setError('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (!routine) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Rutina no encontrada'}</p>
          <button onClick={() => router.back()}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 className={styles.title}>Editar días</h1>
      </div>

      <div className={styles.routineInfo}>
        <h2 className={styles.routineName}>{routine.name}</h2>
        {routine.description && (
          <p className={styles.routineDesc}>{routine.description}</p>
        )}
        <span className={styles.exerciseCount}>
          {routine.exercises?.length || 0} ejercicios
        </span>
      </div>

      <div className={styles.daysSection}>
        <h3 className={styles.sectionTitle}>¿Qué días entrenas esta rutina?</h3>
        <p className={styles.sectionHint}>Selecciona los días de la semana</p>
        
        <div className={styles.daysGrid}>
          {DAYS.map((day) => (
            <button
              key={day.value}
              className={`${styles.dayBtn} ${selectedDays.includes(day.value) ? styles.dayBtnActive : ''}`}
              onClick={() => toggleDay(day.value)}
            >
              <span className={styles.dayShort}>{day.short}</span>
              <span className={styles.dayFull}>{day.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          {error}
        </div>
      )}

      <div className={styles.actions}>
        <button 
          className={styles.cancelBtn}
          onClick={() => router.back()}
          disabled={saving}
        >
          Cancelar
        </button>
        <button 
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
}
