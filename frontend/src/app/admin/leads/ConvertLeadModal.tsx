'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './ConvertLeadModal.module.css';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
}

interface ConvertLeadModalProps {
  lead: Lead;
  onClose: () => void;
  onSuccess: () => void;
}

export function ConvertLeadModal({ lead, onClose, onSuccess }: ConvertLeadModalProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planId, setPlanId] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await apiFetch('/admin/plans');
        const data = await res.json();
        setPlans(data.plans || []);
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch(`/admin/leads/${lead.id}/convert`, {
        method: 'POST',
        body: JSON.stringify({ password, planId: planId || undefined }),
      });

      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al convertir el lead');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Convertir Lead a Cliente</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className={styles.leadInfo}>
          <div className={styles.avatar}>
            {lead.firstName.charAt(0)}{lead.lastName.charAt(0)}
          </div>
          <div>
            <p className={styles.leadName}>{lead.firstName} {lead.lastName}</p>
            <p className={styles.leadEmail}>{lead.email}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña para la cuenta</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Mínimo 6 caracteres"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Confirmar contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={styles.input}
              placeholder="Repetir contraseña"
              required
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Plan (opcional)</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className={styles.select}
            >
              <option value="">Sin plan asignado</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} - ${plan.price} ({plan.durationDays} días)
                </option>
              ))}
            </select>
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? 'Convirtiendo...' : 'Convertir a Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
