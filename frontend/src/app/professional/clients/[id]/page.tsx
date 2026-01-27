'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface ClientDetail {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  subscriptionStatus: string;
  plan: {
    name: string;
    price: number;
  } | null;
  startDate: string | null;
  routines: {
    id: string;
    name: string;
    createdAt: string;
  }[];
}

interface WeekRoutines {
  [key: number]: DayAssignment[];
}

interface Routine {
  id: string;
  name: string;
  category: string;
}

interface DayAssignment {
  id: string;
  dayOfWeek: number;
  routine: Routine;
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

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [weekRoutines, setWeekRoutines] = useState<WeekRoutines>({});

  const fetchWeekRoutines = async () => {
    try {
      const weekRes = await apiFetch(`/professional/clients/${params.id}/week`);
      const weekData = await weekRes.json();
      setWeekRoutines(weekData.weekRoutines || {});
    } catch (error) {
      console.error('Error fetching week routines:', error);
    }
  };

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const res = await apiFetch(`/professional/clients/${params.id}`);
        const data = await res.json();
        setClient(data.client);
      } catch (error) {
        console.error('Error fetching client:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchClient();
      fetchWeekRoutines();
    }
  }, [params.id]);

  const handleModalClose = () => {
    setShowWeekModal(false);
    fetchWeekRoutines();
  };

  const hasAnyAssignment = Object.values(weekRoutines).some(day => day.length > 0);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!client) {
    return (
      <div className={styles.container}>
        <GlassCard className={styles.errorCard}>
          <p>Cliente no encontrado</p>
          <button onClick={() => router.back()} className={styles.backButton}>
            Volver
          </button>
        </GlassCard>
      </div>
    );
  }

  const isActive = client.subscriptionStatus === 'ACTIVE';

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backLink}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 18l-6-6 6-6" />
        </svg>
        Volver
      </button>

      <GlassCard className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatar}>
            {client.user.firstName.charAt(0)}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.clientName}>
              {client.user.firstName} {client.user.lastName}
            </h1>
            <span className={styles.planName}>
              {client.plan?.name?.toUpperCase() || 'SIN PLAN'}
            </span>
            <span className={`${styles.status} ${isActive ? styles.active : styles.inactive}`}>
              {isActive ? 'Activo' : 'Inactivo'}
              {isActive && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              )}
            </span>
          </div>
        </div>
      </GlassCard>

      <GlassCard className={styles.infoCard}>
        <h3 className={styles.sectionTitle}>Información de contacto</h3>
        <div className={styles.infoGrid}>
          <div className={styles.infoItem}>
            <span className={styles.infoLabel}>Email</span>
            <span className={styles.infoValue}>{client.user.email}</span>
          </div>
          {client.user.phone && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Teléfono</span>
              <span className={styles.infoValue}>{client.user.phone}</span>
            </div>
          )}
          {client.startDate && (
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Fecha de inicio</span>
              <span className={styles.infoValue}>
                {new Date(client.startDate).toLocaleDateString('es-AR')}
              </span>
            </div>
          )}
        </div>
      </GlassCard>

      <GlassCard className={styles.routinesCard}>
        <div className={styles.routinesHeader}>
          <h3 className={styles.sectionTitle}>Rutinas asignadas</h3>
          <button className={styles.addButton} onClick={() => setShowWeekModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Asignar rutinas
          </button>
        </div>
        
        {hasAnyAssignment ? (
          <div className={styles.weekSchedule}>
            {[1, 2, 3, 4, 5, 6, 0].map(day => {
              const dayAssignments = weekRoutines[day] || [];
              if (dayAssignments.length === 0) return null;
              return (
                <div key={day} className={styles.dayRow}>
                  <span className={styles.dayName}>{DAY_NAMES[day]}</span>
                  <div className={styles.dayRoutines}>
                    {dayAssignments.map(assignment => (
                      <span key={assignment.id} className={styles.routinePill}>
                        {assignment.routine.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className={styles.emptyText}>No tiene rutinas asignadas</p>
        )}
      </GlassCard>

      {showWeekModal && client && (
        <WeekAssignmentModal
          clientId={client.id}
          clientName={`${client.user.firstName} ${client.user.lastName}`}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}

function WeekAssignmentModal({ clientId, clientName, onClose }: { clientId: string; clientName: string; onClose: () => void }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weekAssignments, setWeekAssignments] = useState<Record<number, DayAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const routinesRes = await apiFetch('/professional/routines');
        const routinesData = await routinesRes.json();
        setRoutines(routinesData.routines || []);

        const weekRes = await apiFetch(`/professional/clients/${clientId}/week`);
        const weekData = await weekRes.json();
        setWeekAssignments(weekData.weekRoutines || {});
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [clientId]);

  const handleAddRoutine = async (routineId: string) => {
    try {
      const res = await apiFetch(`/professional/clients/${clientId}/day-assignment`, {
        method: 'POST',
        body: JSON.stringify({ routineId, dayOfWeek: selectedDay }),
      });

      if (res.ok) {
        const data = await res.json();
        setWeekAssignments(prev => ({
          ...prev,
          [selectedDay]: [...(prev[selectedDay] || []), data.assignment],
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
  const getAssignedRoutineIds = (day: number) => getDayAssignments(day).map(a => a.routine.id);

  if (loading) {
    return (
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            Rutinas de {clientName}
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.weekTabs}>
          {[1, 2, 3, 4, 5, 6, 0].map(day => (
            <button
              key={day}
              className={`${styles.dayTab} ${selectedDay === day ? styles.active : ''} ${getDayAssignments(day).length > 0 ? styles.hasRoutines : ''}`}
              onClick={() => setSelectedDay(day)}
            >
              <span className={styles.dayTabName}>{DAY_NAMES[day]}</span>
              {getDayAssignments(day).length > 0 && (
                <span className={styles.dayTabCount}>{getDayAssignments(day).length}</span>
              )}
            </button>
          ))}
        </div>

        <div className={styles.dayContent}>
          <h3 className={styles.dayTitle}>{DAY_NAMES[selectedDay]}</h3>

          <div className={styles.assignedList}>
            {getDayAssignments(selectedDay).length === 0 ? (
              <p className={styles.emptyDay}>Sin rutinas asignadas</p>
            ) : (
              getDayAssignments(selectedDay).map(assignment => (
                <div key={assignment.id} className={styles.assignedItem}>
                  <span className={styles.assignedName}>{assignment.routine.name}</span>
                  <button
                    className={styles.removeBtn}
                    onClick={() => handleRemoveAssignment(assignment.id, selectedDay)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>

          <div className={styles.availableSection}>
            <h4 className={styles.availableTitle}>Agregar rutina</h4>
            <div className={styles.availableList}>
              {routines
                .filter(r => !getAssignedRoutineIds(selectedDay).includes(r.id))
                .map(routine => (
                  <button
                    key={routine.id}
                    className={styles.availableItem}
                    onClick={() => handleAddRoutine(routine.id)}
                  >
                    <span>{routine.name}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                ))}
              {routines.filter(r => !getAssignedRoutineIds(selectedDay).includes(r.id)).length === 0 && (
                <p className={styles.noRoutines}>Todas las rutinas ya están asignadas a este día</p>
              )}
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button className={styles.doneBtn} onClick={onClose}>
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
