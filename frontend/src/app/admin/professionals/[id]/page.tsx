'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface Professional {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  professionalProfile: {
    id: string;
    specialty: string | null;
    bio: string | null;
    assignedClients: Array<{
      id: string;
      subscriptionStatus: string;
      user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
      plan: { name: string } | null;
    }>;
  } | null;
}

export default function ProfessionalDetailPage() {
  const params = useParams();
  const [professional, setProfessional] = useState<Professional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch(`/admin/professionals/${params.id}`);
        const data = await res.json();
        if (data.professional) {
          setProfessional(data.professional);
        }
      } catch (error) {
        console.error('Error fetching professional:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!professional) {
    return (
      <div className={styles.notFound}>
        <h2>Profesional no encontrado</h2>
        <Link href="/admin/professionals" className={styles.backLink}>Volver a profesionales</Link>
      </div>
    );
  }

  const profile = professional.professionalProfile;
  const clients = profile?.assignedClients || [];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/admin/professionals" className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </Link>
      </div>

      <div className={styles.profile}>
        <div className={styles.avatar}>
          {professional.firstName.charAt(0)}{professional.lastName.charAt(0)}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.name}>{professional.firstName} {professional.lastName}</h1>
          <p className={styles.email}>{professional.email}</p>
          {professional.phone && <p className={styles.phone}>{professional.phone}</p>}
          {profile?.specialty && <p className={styles.specialty}>{profile.specialty}</p>}
        </div>
        <div 
          className={styles.statusBadge}
          style={{
            backgroundColor: professional.isActive ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: professional.isActive ? '#22C55E' : '#EF4444'
          }}
        >
          {professional.isActive ? 'Activo' : 'Inactivo'}
        </div>
      </div>

      <div className={styles.grid}>
        <GlassCard padding="md" className={styles.card}>
          <h3 className={styles.cardTitle}>Información</h3>
          <div className={styles.infoList}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Especialidad</span>
              <span className={styles.infoValue}>{profile?.specialty || 'No especificada'}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Clientes asignados</span>
              <span className={styles.infoValue}>{clients.length}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>Miembro desde</span>
              <span className={styles.infoValue}>
                {new Date(professional.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </GlassCard>

        {profile?.bio && (
          <GlassCard padding="md" className={styles.card}>
            <h3 className={styles.cardTitle}>Biografía</h3>
            <p className={styles.bio}>{profile.bio}</p>
          </GlassCard>
        )}

        <GlassCard padding="md" className={styles.card + ' ' + styles.fullWidth}>
          <h3 className={styles.cardTitle}>Clientes Asignados ({clients.length})</h3>
          {clients.length === 0 ? (
            <p className={styles.noClients}>Sin clientes asignados</p>
          ) : (
            <div className={styles.clientsList}>
              {clients.map((client) => (
                <Link 
                  key={client.id} 
                  href={`/admin/clients/${client.user.id}`}
                  className={styles.clientItem}
                >
                  <div className={styles.clientAvatar}>
                    {client.user.firstName.charAt(0)}{client.user.lastName.charAt(0)}
                  </div>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>
                      {client.user.firstName} {client.user.lastName}
                    </span>
                    <span className={styles.clientEmail}>{client.user.email}</span>
                  </div>
                  <div className={styles.clientMeta}>
                    {client.plan && <span className={styles.clientPlan}>{client.plan.name}</span>}
                    <span 
                      className={styles.clientStatus}
                      style={{
                        color: client.subscriptionStatus === 'ACTIVE' ? '#22C55E' : '#EF4444'
                      }}
                    >
                      {client.subscriptionStatus === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
