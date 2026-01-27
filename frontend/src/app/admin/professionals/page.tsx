'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { ProfessionalList, Professional } from '@/components/professionals';

export default function ProfessionalsPage() {
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchProfessionals = async () => {
    try {
      const res = await apiFetch('/admin/professionals');
      const data = await res.json();
      setProfessionals(data.professionals || []);
    } catch (error) {
      console.error('Error fetching professionals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfessionals();
  }, []);

  const totalClients = professionals.reduce((acc, p) => acc + (p.professionalProfile?._count?.assignedClients || 0), 0);

  return (
    <div className={styles.container}>
      {/* Hero Header */}
      <div className={styles.heroHeader}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>Equipo de Profesionales</h1>
          <p className={styles.heroSubtitle}>Gestiona tu equipo de entrenadores y sus asignaciones</p>
        </div>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Agregar
        </button>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{professionals.length}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.active}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{professionals.filter(p => p.isActive).length}</span>
            <span className={styles.statLabel}>activos</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.clients}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalClients}</span>
            <span className={styles.statLabel}>clientes</span>
          </div>
        </div>
      </div>

      <div className={styles.resultsCount}>
        {professionals.length} profesional{professionals.length !== 1 ? 'es' : ''}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Cargando profesionales...</p>
        </div>
      ) : (
        <ProfessionalList
          professionals={professionals}
          detailBasePath="/admin/professionals"
        />
      )}

      {modalOpen && (
        <ProfessionalModal
          onClose={() => setModalOpen(false)}
          onSave={() => {
            setModalOpen(false);
            fetchProfessionals();
          }}
        />
      )}
    </div>
  );
}

function ProfessionalModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    specialty: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData({ ...formData, password });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/admin/professionals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear profesional');
      }

      setSuccess({ email: formData.email, password: formData.password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <h2 className={styles.successTitle}>¡Profesional creado!</h2>
            <p className={styles.successText}>Comparte estas credenciales con el profesional:</p>
            
            <div className={styles.credentials}>
              <div className={styles.credentialItem}>
                <span className={styles.credentialLabel}>Email</span>
                <span className={styles.credentialValue}>{success.email}</span>
              </div>
              <div className={styles.credentialItem}>
                <span className={styles.credentialLabel}>Contraseña</span>
                <span className={styles.credentialValue}>{success.password}</span>
              </div>
            </div>
            
            <p className={styles.successNote}>
              El profesional podrá cambiar su contraseña después de iniciar sesión.
            </p>
            
            <button className={styles.submitBtn} onClick={onSave}>
              Entendido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Nuevo Profesional</h2>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.sectionTitle}>Datos personales</div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label}>Nombre *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="Juan"
                required
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Apellido *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Pérez"
                required
              />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            <input
              type="tel"
              className={styles.input}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Especialidad</label>
            <input
              type="text"
              className={styles.input}
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="Ej: Musculación, CrossFit, Funcional..."
            />
          </div>

          <div className={styles.sectionTitle}>Credenciales de acceso</div>

          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input
              type="email"
              className={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="profesional@email.com"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Contraseña *</label>
            <div className={styles.passwordRow}>
              <input
                type="text"
                className={styles.input}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <button type="button" className={styles.generateBtn} onClick={generatePassword}>
                Generar
              </button>
            </div>
            <span className={styles.hint}>Esta será la contraseña inicial del profesional</span>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear profesional'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
