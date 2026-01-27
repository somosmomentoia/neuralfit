'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface RoutineExercise {
  id: string;
  sets: number | null;
  reps: string | null;
  restSeconds: number | null;
  exercise: {
    id: string;
    name: string;
    muscleGroup: string | null;
  };
}

interface Routine {
  id: string;
  name: string;
  category: 'MUSCULACION' | 'AEROBICA' | 'DEPORTISTA';
  level: number;
  isTemplate: boolean;
  exercises: RoutineExercise[];
  _count: { exercises: number; clientRoutines: number };
}

interface Client {
  id: string;
  user: { firstName: string; lastName: string };
}

export default function RoutineDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  useEffect(() => {
    apiFetch(`/professional/routines/${params.id}`)
      .then(res => res.json())
      .then(data => setRoutine(data.routine))
      .catch(() => router.push('/professional/routines'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleDelete = async () => {
    const res = await apiFetch(`/professional/routines/${params.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/professional/routines');
  };

  const handleDuplicate = async () => {
    if (!routine) return;
    setDuplicating(true);
    try {
      const res = await apiFetch('/professional/routines', {
        method: 'POST',
        body: JSON.stringify({
          name: `${routine.name} (copia)`,
          category: routine.category,
          level: routine.level,
          exercises: routine.exercises.map((re, i) => ({
            exerciseId: re.exercise.id,
            order: i + 1,
            sets: re.sets,
            reps: re.reps,
            restSeconds: re.restSeconds,
          })),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        router.push(`/professional/routines/${data.routine.id}`);
      }
    } finally {
      setDuplicating(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;
  if (!routine) return <div className={styles.loading}>No encontrada</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.back()}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className={styles.headerInfo}>
          <span className={styles.badge}>{routine.category}</span>
          <h1 className={styles.title}>{routine.name}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{routine._count.exercises}</span>
          <span className={styles.statLabel}>Ejercicios</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statLabel}>Nivel</span>
          <div className={styles.dots}>
            {[1,2,3,4,5].map(l => (
              <span key={l} className={`${styles.dot} ${l <= routine.level ? styles.active : ''}`} />
            ))}
          </div>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>{routine._count.clientRoutines}</span>
          <span className={styles.statLabel}>Asignados</span>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {!routine.isTemplate && (
          <button className={styles.actionBtn} onClick={() => router.push(`/professional/routines/${routine.id}/edit`)}>
            Editar
          </button>
        )}
        <button 
          className={styles.actionBtn} 
          onClick={handleDuplicate}
          disabled={duplicating}
        >
          {duplicating ? '...' : 'Duplicar'}
        </button>
        <button className={styles.actionBtnPrimary} onClick={() => setAssignModal(true)}>
          Asignar
        </button>
        {!routine.isTemplate && (
          <button className={styles.actionBtnDanger} onClick={() => setDeleteConfirm(true)}>
            ✕
          </button>
        )}
      </div>

      {/* Exercises */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Ejercicios ({routine.exercises.length})</h2>
        <div className={styles.exerciseList}>
          {routine.exercises.map((re, idx) => (
            <div key={re.id} className={styles.exerciseItem}>
              <span className={styles.order}>{idx + 1}</span>
              <div className={styles.exerciseInfo}>
                <span className={styles.exerciseName}>{re.exercise.name}</span>
                <span className={styles.exerciseMeta}>
                  {re.sets && `${re.sets} series`}
                  {re.reps && ` • ${re.reps} reps`}
                  {re.restSeconds && ` • ${re.restSeconds}s`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <AssignModal
          routineId={routine.id}
          routineName={routine.name}
          onClose={() => setAssignModal(false)}
          onDone={() => { setAssignModal(false); window.location.reload(); }}
        />
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className={styles.overlay} onClick={() => setDeleteConfirm(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h3>¿Eliminar rutina?</h3>
            <p>Esta acción no se puede deshacer.</p>
            <div className={styles.modalActions}>
              <button onClick={() => setDeleteConfirm(false)}>Cancelar</button>
              <button className={styles.dangerBtn} onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface DayAssignment {
  id: string;
  dayOfWeek: number;
  routine: { id: string; name: string };
}

const DAY_NAMES: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo',
};

function AssignModal({ routineId, routineName, onClose, onDone }: { routineId: string; routineName: string; onClose: () => void; onDone: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [weekAssignments, setWeekAssignments] = useState<Record<number, DayAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    apiFetch('/professional/clients')
      .then(res => res.json())
      .then(data => setClients(data.clients || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchClientWeek = async (clientId: string) => {
    try {
      const res = await apiFetch(`/professional/clients/${clientId}/week`);
      const data = await res.json();
      setWeekAssignments(data.weekRoutines || {});
    } catch (error) {
      console.error('Error fetching week:', error);
    }
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    fetchClientWeek(client.id);
  };

  const handleAddToDay = async (dayOfWeek: number) => {
    if (!selectedClient) return;
    try {
      const res = await apiFetch(`/professional/clients/${selectedClient.id}/day-assignment`, {
        method: 'POST',
        body: JSON.stringify({ routineId, dayOfWeek }),
      });

      if (res.ok) {
        const data = await res.json();
        setWeekAssignments(prev => ({
          ...prev,
          [dayOfWeek]: [...(prev[dayOfWeek] || []), data.assignment],
        }));
      }
    } catch (error) {
      console.error('Error adding routine:', error);
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, dayOfWeek: number) => {
    try {
      const res = await apiFetch(`/professional/day-assignment/${assignmentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setWeekAssignments(prev => ({
          ...prev,
          [dayOfWeek]: (prev[dayOfWeek] || []).filter(a => a.id !== assignmentId),
        }));
      }
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  const getDayAssignments = (day: number) => weekAssignments[day] || [];
  const isRoutineAssignedToDay = (day: number) => getDayAssignments(day).some(a => a.routine.id === routineId);

  // Step 1: Select client
  if (!selectedClient) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>Asignar rutina</h3>
            <button className={styles.closeBtn} onClick={onClose}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <p className={styles.modalSubtitle}>Selecciona un cliente para asignar "{routineName}"</p>
          {loading ? (
            <p className={styles.loadingText}>Cargando clientes...</p>
          ) : clients.length === 0 ? (
            <p className={styles.emptyText}>No tienes clientes asignados</p>
          ) : (
            <div className={styles.clientList}>
              {clients.map(c => (
                <button
                  key={c.id}
                  className={styles.clientOption}
                  onClick={() => handleSelectClient(c)}
                >
                  <div className={styles.clientAvatar}>
                    {c.user.firstName.charAt(0)}{c.user.lastName.charAt(0)}
                  </div>
                  <span>{c.user.firstName} {c.user.lastName}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Assign days
  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <button className={styles.backBtnSmall} onClick={() => setSelectedClient(null)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <h3>Asignar a {selectedClient.user.firstName}</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <p className={styles.modalSubtitle}>Selecciona los días para "{routineName}"</p>

        <div className={styles.weekTabs}>
          {[1, 2, 3, 4, 5, 6, 0].map(day => {
            const hasThisRoutine = isRoutineAssignedToDay(day);
            return (
              <button
                key={day}
                className={`${styles.dayTab} ${selectedDay === day ? styles.active : ''} ${hasThisRoutine ? styles.hasRoutine : ''}`}
                onClick={() => setSelectedDay(day)}
              >
                <span className={styles.dayTabName}>{DAY_NAMES[day]}</span>
                {hasThisRoutine && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>

        <div className={styles.dayContent}>
          <h4 className={styles.dayTitle}>{DAY_NAMES[selectedDay]}</h4>
          
          {isRoutineAssignedToDay(selectedDay) ? (
            <div className={styles.assignedState}>
              <div className={styles.assignedBadge}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
                Asignada a este día
              </div>
              <button
                className={styles.removeFromDayBtn}
                onClick={() => {
                  const assignment = getDayAssignments(selectedDay).find(a => a.routine.id === routineId);
                  if (assignment) handleRemoveAssignment(assignment.id, selectedDay);
                }}
              >
                Quitar de {DAY_NAMES[selectedDay]}
              </button>
            </div>
          ) : (
            <button
              className={styles.addToDayBtn}
              onClick={() => handleAddToDay(selectedDay)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Agregar a {DAY_NAMES[selectedDay]}
            </button>
          )}

          {getDayAssignments(selectedDay).filter(a => a.routine.id !== routineId).length > 0 && (
            <div className={styles.otherRoutines}>
              <span className={styles.otherRoutinesLabel}>Otras rutinas en este día:</span>
              {getDayAssignments(selectedDay)
                .filter(a => a.routine.id !== routineId)
                .map(a => (
                  <span key={a.id} className={styles.otherRoutinePill}>{a.routine.name}</span>
                ))}
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button className={styles.doneBtn} onClick={onDone}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
