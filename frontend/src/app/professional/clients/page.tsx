'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Client {
  id: string;
  subscriptionStatus: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  assignedRoutines: Array<{
    id: string;
    isActive: boolean;
    routine: { name: string };
  }>;
}

interface Routine {
  id: string;
  name: string;
  category: string;
  _count?: { exercises: number };
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

export default function ProfessionalClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showWeekModal, setShowWeekModal] = useState(false);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await apiFetch('/professional/clients');
        const data = await res.json();
        setClients(data.clients || []);
      } catch (error) {
        console.error('Error fetching clients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    `${c.user.firstName} ${c.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    c.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mis Clientes</h1>
        <p className={styles.subtitle}>{clients.length} clientes asignados</p>
      </div>

      <div className={styles.searchBar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.resultsCount}>
        {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando clientes...</div>
      ) : filteredClients.length === 0 ? (
        <div className={styles.empty}>
          <p>{search ? 'No se encontraron clientes' : 'No tienes clientes asignados'}</p>
        </div>
      ) : (
        <div className={styles.clientsList}>
          {filteredClients.map((client) => {
            const activeRoutine = client.assignedRoutines.find(r => r.isActive);
            const isExpanded = expandedClient === client.id;
            return (
              <div 
                key={client.id} 
                className={`${styles.clientCard} ${isExpanded ? styles.expanded : ''}`}
              >
                {/* Card Header - Clickable */}
                <div 
                  className={styles.cardHeader}
                  onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                >
                  <div className={styles.cardHeaderLeft}>
                    <div className={styles.avatar}>
                      {client.user.firstName.charAt(0)}{client.user.lastName.charAt(0)}
                    </div>
                    <div className={styles.cardHeaderInfo}>
                      <h3 className={styles.clientName}>{client.user.firstName} {client.user.lastName}</h3>
                      <span className={styles.separator}>·</span>
                      <span className={styles.email}>{client.user.email}</span>
                      {activeRoutine && (
                        <>
                          <span className={styles.separator}>·</span>
                          <span className={styles.routineBadge}>{activeRoutine.routine.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className={styles.cardHeaderRight}>
                    <span 
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: client.subscriptionStatus === 'ACTIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: client.subscriptionStatus === 'ACTIVE' ? '#22C55E' : '#EF4444'
                      }}
                    >
                      {client.subscriptionStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                    <div className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className={styles.cardContent}>
                    <div className={styles.detailsRow}>
                      {client.user.phone && (
                        <div className={styles.detailItem}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72"/>
                          </svg>
                          <span>{client.user.phone}</span>
                        </div>
                      )}
                      <div className={styles.detailItem}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                        </svg>
                        <span>{activeRoutine ? activeRoutine.routine.name : 'Sin rutina activa'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.cardActions}>
                      <Link href={`/professional/clients/${client.id}`} className={`${styles.actionBtn} ${styles.primary}`}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        Ver perfil
                      </Link>
                      <button 
                        className={styles.actionBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClient(client);
                          setShowWeekModal(true);
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Asignar rutinas
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showWeekModal && selectedClient && (
        <WeekAssignmentModal
          client={selectedClient}
          onClose={() => {
            setShowWeekModal(false);
            setSelectedClient(null);
          }}
        />
      )}
    </div>
  );
}

function WeekAssignmentModal({ client, onClose }: { client: Client; onClose: () => void }) {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [weekAssignments, setWeekAssignments] = useState<Record<number, DayAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Obtener rutinas disponibles
        const routinesRes = await apiFetch('/professional/routines');
        const routinesData = await routinesRes.json();
        setRoutines(routinesData.routines || []);

        // Obtener asignaciones actuales del cliente
        const weekRes = await apiFetch(`/professional/clients/${client.id}/week`);
        const weekData = await weekRes.json();
        setWeekAssignments(weekData.weekRoutines || {});
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client.id]);

  const handleAddRoutine = async (routineId: string) => {
    try {
      const res = await apiFetch(`/professional/clients/${client.id}/day-assignment`, {
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
            Rutinas de {client.user.firstName} {client.user.lastName}
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

          {/* Rutinas asignadas a este día */}
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

          {/* Rutinas disponibles para agregar */}
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
