'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { ClientList, Client } from '@/components/clients';

const statusLabels: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  CANCELLED: 'Cancelado',
};

const statusColors: Record<string, string> = {
  ACTIVE: '#22C55E',
  INACTIVE: '#F59E0B',
  CANCELLED: '#EF4444',
};

interface Plan {
  id: string;
  name: string;
  price: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const fetchClients = async () => {
    try {
      const res = await apiFetch('/admin/clients');
      const data = await res.json();
      setClients(data.clients || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => {
    const matchesFilter = filter === 'ALL' || c.clientProfile?.subscriptionStatus === filter;
    const matchesSearch = search === '' || 
      `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.clientProfile?.subscriptionStatus === 'ACTIVE').length,
    inactive: clients.filter(c => c.clientProfile?.subscriptionStatus === 'INACTIVE').length,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clientes</h1>
          <p className={styles.subtitle}>Gestiona los clientes de tu gimnasio</p>
        </div>
        <button className={styles.addButton} onClick={() => setModalOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Nuevo Cliente
        </button>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statItem}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.total}</span>
            <span className={styles.statLabel}>total</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.active}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.active}</span>
            <span className={styles.statLabel}>activos</span>
          </div>
        </div>
        <div className={`${styles.statItem} ${styles.inactive}`}>
          <svg className={styles.statIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats.inactive}</span>
            <span className={styles.statLabel}>inactivos</span>
          </div>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.filters}>
          {['ALL', 'ACTIVE', 'INACTIVE', 'CANCELLED'].map((status) => (
            <button
              key={status}
              className={`${styles.filterBtn} ${filter === status ? styles.active : ''}`}
              onClick={() => setFilter(status)}
            >
              {status === 'ALL' ? 'Todos' : statusLabels[status]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.resultsCount}>
        {filteredClients.length} cliente{filteredClients.length !== 1 ? 's' : ''}
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando clientes...</div>
      ) : (
        <ClientList
          clients={filteredClients}
          detailBasePath="/admin/clients"
        />
      )}
      {modalOpen && (
        <ClientModal
          onClose={() => setModalOpen(false)}
          onSave={() => {
            setModalOpen(false);
            fetchClients();
          }}
        />
      )}
    </div>
  );
}

interface Professional {
  id: string;
  visibleId: string;
  firstName: string;
  lastName: string;
  professionalProfile: { id: string } | null;
}

function ClientModal({ onClose, onSave }: { onClose: () => void; onSave: () => void }) {
  const today = new Date().toISOString().split('T')[0];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    planId: '',
    assignedProfessionalId: '',
    startDate: today,
    specialConsiderations: '',
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, prosRes] = await Promise.all([
          apiFetch('/admin/plans'),
          apiFetch('/admin/professionals')
        ]);
        const plansData = await plansRes.json();
        const prosData = await prosRes.json();
        setPlans(plansData.plans || []);
        setProfessionals(prosData.professionals || []);
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.password || formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch('/admin/clients', {
        method: 'POST',
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear cliente');
      }

      alert(`Cliente creado exitosamente.\n\nCredenciales de acceso:\nEmail: ${formData.email}\nContraseña: ${formData.password}`);
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
          <h2 className={styles.modalTitle}>Nuevo Cliente</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Nombre *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Apellido *</label>
              <input
                type="text"
                className={styles.input}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Email *</label>
              <input
                type="email"
                className={styles.input}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Teléfono</label>
              <input
                type="tel"
                className={styles.input}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Contraseña *</label>
            <div className={styles.passwordField}>
              <input
                type={showPassword ? 'text' : 'password'}
                className={styles.input}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button 
                type="button" 
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Plan</label>
              <select
                className={styles.input}
                value={formData.planId}
                onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
              >
                <option value="">Sin plan asignado</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - ${plan.price}/mes
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Profesional asignado</label>
              <select
                className={styles.input}
                value={formData.assignedProfessionalId}
                onChange={(e) => setFormData({ ...formData, assignedProfessionalId: e.target.value })}
              >
                <option value="">Sin asignar</option>
                {professionals.map((pro) => (
                  <option key={pro.id} value={pro.professionalProfile?.id || ''}>
                    {pro.firstName} {pro.lastName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formField}>
              <label className={styles.label}>Fecha de inicio</label>
              <input
                type="date"
                className={styles.input}
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.label}>Método de pago</label>
              <div className={styles.mpBadgeInfo}>
                💳 MercadoPago (el cliente pagará al suscribirse)
              </div>
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.label}>Consideraciones especiales</label>
            <textarea
              className={styles.textarea}
              value={formData.specialConsiderations}
              onChange={(e) => setFormData({ ...formData, specialConsiderations: e.target.value })}
              placeholder="Lesiones, condiciones médicas, objetivos específicos..."
              rows={3}
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Creando...' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
