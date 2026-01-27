'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';
import ImageUploader from '@/components/ImageUploader';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  subscription: {
    id: string;
    status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
    startDate: string | null;
    endDate: string | null;
    specialConsiderations: string | null;
    notes: string | null;
    medicalClearanceUrl: string | null;
    plan: { id: string; name: string; price: number } | null;
    assignedProfessional: {
      id: string;
      user: { firstName: string; lastName: string };
    } | null;
    assignedRoutines: Array<{
      id: string;
      routine: { id: string; name: string; category: string };
    }>;
  };
}

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  professionalProfile: { id: string } | null;
}

interface Plan {
  id: string;
  name: string;
  price: number;
}

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  CANCELLED: 'Cancelado',
};


export default function ClientDetailPage() {
  const params = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    subscriptionStatus: 'ACTIVE',
    planId: '',
    assignedProfessionalId: '',
    specialConsiderations: '',
    notes: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientRes, prosRes, plansRes] = await Promise.all([
          apiFetch(`/admin/clients/${params.id}`),
          apiFetch('/admin/professionals'),
          apiFetch('/admin/plans'),
        ]);

        const clientData = await clientRes.json();
        const prosData = await prosRes.json();
        const plansData = await plansRes.json();

        if (clientData.client) {
          setClient(clientData.client);
          const sub = clientData.client.subscription;
          setFormData({
            subscriptionStatus: sub?.status || 'ACTIVE',
            planId: sub?.plan?.id || '',
            assignedProfessionalId: sub?.assignedProfessional?.id || '',
            specialConsiderations: sub?.specialConsiderations || '',
            notes: sub?.notes || '',
          });
        }
        setProfessionals(prosData.professionals || []);
        setPlans(plansData.plans || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSave = async () => {
    try {
      const res = await apiFetch(`/admin/clients/${params.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error updating client:', error);
    }
  };

  const handleMedicalClearanceUpdate = async (imageUrl: string | null) => {
    try {
      const res = await apiFetch(`/admin/clients/${params.id}/medical-clearance`, {
        method: 'PATCH',
        body: JSON.stringify({ medicalClearanceUrl: imageUrl }),
      });

      if (res.ok && client) {
        setClient({
          ...client,
          subscription: {
            ...client.subscription,
            medicalClearanceUrl: imageUrl,
          },
        });
      }
    } catch (error) {
      console.error('Error updating medical clearance:', error);
    }
  };

  const handleToggleStatus = async () => {
    if (!client) return;
    
    const newIsActive = !client.isActive;
    const newSubscriptionStatus = newIsActive ? 'ACTIVE' : 'INACTIVE';
    
    const confirmMsg = newIsActive 
      ? '¿Activar este cliente?' 
      : '¿Desactivar este cliente? Su suscripción pasará a estado Inactivo.';
    
    if (!confirm(confirmMsg)) return;

    try {
      const res = await apiFetch(`/admin/clients/${params.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          isActive: newIsActive,
          subscriptionStatus: newSubscriptionStatus 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setClient(data.client);
      }
    } catch (error) {
      console.error('Error toggling client status:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!client) {
    return (
      <div className={styles.notFound}>
        <h2>Cliente no encontrado</h2>
        <Link href="/admin/clients" className={styles.backLink}>Volver a clientes</Link>
      </div>
    );
  }

  const sub = client.subscription;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/clients" className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </Link>
        <div className={styles.headerActions}>
          <button 
            className={`${styles.statusToggleBtn} ${client.isActive ? styles.deactivate : styles.activate}`}
            onClick={handleToggleStatus}
          >
            {client.isActive ? 'Desactivar Cliente' : 'Activar Cliente'}
          </button>
          {editing ? (
            <>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handleSave}>Guardar</button>
            </>
          ) : (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>Editar</button>
          )}
        </div>
      </div>

      <div className={styles.sub}>
        <div className={styles.avatar}>
          {client.firstName.charAt(0)}{client.lastName.charAt(0)}
        </div>
        <div className={styles.subInfo}>
          <h1 className={styles.name}>{client.firstName} {client.lastName}</h1>
          <p className={styles.email}>{client.email}</p>
          {client.phone && <p className={styles.phone}>{client.phone}</p>}
        </div>
        <div className={styles.statusBadges}>
          <div 
            className={styles.statusBadge}
            style={{
              backgroundColor: client.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: client.isActive ? '#22C55E' : '#EF4444'
            }}
          >
            {client.isActive ? 'Usuario Activo' : 'Usuario Inactivo'}
          </div>
          <div 
            className={styles.statusBadge}
            style={{
              backgroundColor: sub?.status === 'ACTIVE' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
              color: sub?.status === 'ACTIVE' ? '#22C55E' : '#EF4444'
            }}
          >
            Suscripción: {statusLabels[sub?.status || 'INACTIVE']}
          </div>
        </div>
      </div>

      <div className={styles.grid}>
        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Suscripción</h3>
          {editing ? (
            <div className={styles.formFields}>
              <div className={styles.field}>
                <label>Estado</label>
                <select
                  value={formData.subscriptionStatus}
                  onChange={(e) => setFormData({ ...formData, subscriptionStatus: e.target.value })}
                  className={styles.select}
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                  <option value="CANCELLED">Cancelado</option>
                </select>
              </div>
              <div className={styles.field}>
                <label>Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className={styles.select}
                >
                  <option value="">Sin plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name} - ${plan.price}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Método de Pago</label>
                <div className={styles.mpBadge}>💳 MercadoPago</div>
              </div>
            </div>
          ) : (
            <div className={styles.infoList}>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Plan</span>
                <span className={styles.infoValue}>{sub?.plan?.name || 'Sin plan'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Precio</span>
                <span className={styles.infoValue}>{sub?.plan ? `$${sub.plan.price}` : '-'}</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Fecha de inicio</span>
                <span className={styles.infoValue}>
                  {sub?.startDate ? new Date(sub.startDate).toLocaleDateString() : '-'}
                </span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.infoLabel}>Método de pago</span>
                <span className={styles.infoValue}>💳 MercadoPago</span>
              </div>
            </div>
          )}
        </GlassCard>

        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Profesional Asignado</h3>
          {editing ? (
            <div className={styles.field}>
              <select
                value={formData.assignedProfessionalId}
                onChange={(e) => setFormData({ ...formData, assignedProfessionalId: e.target.value })}
                className={styles.select}
              >
                <option value="">Sin asignar</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.professionalProfile?.id || ''}>
                    {pro.firstName} {pro.lastName}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.assignedPro}>
              {sub?.assignedProfessional ? (
                <>
                  <div className={styles.proAvatar}>
                    {sub.assignedProfessional.user.firstName.charAt(0)}
                  </div>
                  <span>{sub.assignedProfessional.user.firstName} {sub.assignedProfessional.user.lastName}</span>
                </>
              ) : (
                <span className={styles.noAssigned}>Sin profesional asignado</span>
              )}
            </div>
          )}
        </GlassCard>

        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Consideraciones Especiales</h3>
          {editing ? (
            <textarea
              value={formData.specialConsiderations}
              onChange={(e) => setFormData({ ...formData, specialConsiderations: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="Lesiones, condiciones médicas, objetivos..."
            />
          ) : (
            <p className={styles.notes}>{sub?.specialConsiderations || 'Sin consideraciones especiales'}</p>
          )}
        </GlassCard>

        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Notas</h3>
          {editing ? (
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className={styles.textarea}
              rows={3}
              placeholder="Notas sobre el cliente..."
            />
          ) : (
            <p className={styles.notes}>{sub?.notes || 'Sin notas'}</p>
          )}
        </GlassCard>

        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Apto Médico</h3>
          <div className={styles.medicalSection}>
            <ImageUploader
              currentImage={sub?.medicalClearanceUrl || null}
              onImageUploaded={(url) => handleMedicalClearanceUpdate(url)}
              onImageRemoved={() => handleMedicalClearanceUpdate(null)}
              aspectRatio={3 / 4}
              maxSizeMB={10}
              uploadEndpoint="/upload/medical-clearance"
            />
            {sub?.medicalClearanceUrl && (
              <a 
                href={sub.medicalClearanceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className={styles.viewFullBtn}
              >
                Ver documento completo
              </a>
            )}
          </div>
        </GlassCard>

        <GlassCard padding="md" className={styles.card}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Rutinas Asignadas</h3>
          </div>
          {!sub?.assignedRoutines || sub.assignedRoutines.length === 0 ? (
            <p className={styles.noRoutines}>Sin rutinas asignadas</p>
          ) : (
            <div className={styles.routinesList}>
              {sub.assignedRoutines.map((ar) => (
                <div key={ar.id} className={styles.routineItem}>
                  <span className={styles.routineName}>{ar.routine.name}</span>
                  <span className={styles.routineStatus}>
                    Asignada
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
