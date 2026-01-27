'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';

interface CardInfo {
  lastFour: string;
  brand: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
}

interface PaymentMethodData {
  paymentMethod: 'MANUAL' | 'AUTO_DEBIT';
  card: CardInfo | null;
}

export default function PaymentMethodsPage() {
  const router = useRouter();
  const [data, setData] = useState<PaymentMethodData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'MANUAL' | 'AUTO_DEBIT'>('MANUAL');
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardHolderName: '',
    cardExpiryMonth: '',
    cardExpiryYear: '',
    cvv: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/client/payment-method');
        const result = await res.json();
        setData(result);
        setSelectedMethod(result.paymentMethod);
      } catch (error) {
        console.error('Error fetching payment method:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleMethodChange = (method: 'MANUAL' | 'AUTO_DEBIT') => {
    setSelectedMethod(method);
    if (method === 'AUTO_DEBIT' && !data?.card) {
      setShowCardForm(true);
    } else {
      setShowCardForm(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setCardForm({ ...cardForm, cardNumber: formatted });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: {
        paymentMethod: 'MANUAL' | 'AUTO_DEBIT';
        cardNumber?: string;
        cardHolderName?: string;
        cardExpiryMonth?: string;
        cardExpiryYear?: string;
      } = {
        paymentMethod: selectedMethod,
      };

      if (selectedMethod === 'AUTO_DEBIT' && showCardForm) {
        if (!cardForm.cardNumber || !cardForm.cardHolderName || !cardForm.cardExpiryMonth || !cardForm.cardExpiryYear) {
          setError('Completa todos los campos de la tarjeta');
          setSaving(false);
          return;
        }
        payload.cardNumber = cardForm.cardNumber.replace(/\s/g, '');
        payload.cardHolderName = cardForm.cardHolderName;
        payload.cardExpiryMonth = cardForm.cardExpiryMonth;
        payload.cardExpiryYear = cardForm.cardExpiryYear;
      }

      const res = await apiFetch('/client/payment-method', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Error al guardar');
        return;
      }

      setData(result);
      setSuccess('Método de pago actualizado correctamente');
      setShowCardForm(false);
      setCardForm({ cardNumber: '', cardHolderName: '', cardExpiryMonth: '', cardExpiryYear: '', cvv: '' });
    } catch (error) {
      console.error('Error saving payment method:', error);
      setError('Error al guardar el método de pago');
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

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={() => router.back()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Volver
      </button>

      <h1 className={styles.title}>Métodos de Pago</h1>

      {error && <div className={styles.error}>{error}</div>}
      {success && <div className={styles.success}>{success}</div>}

      <div className={styles.methodsGrid}>
        <GlassCard
          className={`${styles.methodCard} ${selectedMethod === 'MANUAL' ? styles.selected : ''}`}
          onClick={() => handleMethodChange('MANUAL')}
        >
          <div className={styles.methodIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
          </div>
          <div className={styles.methodInfo}>
            <h3>Pago Manual</h3>
            <p>Paga en efectivo o transferencia en la recepción del gimnasio</p>
          </div>
          <div className={styles.radioCircle}>
            {selectedMethod === 'MANUAL' && <div className={styles.radioInner} />}
          </div>
        </GlassCard>

        <GlassCard
          className={`${styles.methodCard} ${selectedMethod === 'AUTO_DEBIT' ? styles.selected : ''}`}
          onClick={() => handleMethodChange('AUTO_DEBIT')}
        >
          <div className={styles.methodIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <circle cx="12" cy="12" r="3" />
              <path d="M2 12h4M18 12h4" />
            </svg>
          </div>
          <div className={styles.methodInfo}>
            <h3>Débito Automático</h3>
            <p>Se cobra automáticamente de tu tarjeta cada mes</p>
          </div>
          <div className={styles.radioCircle}>
            {selectedMethod === 'AUTO_DEBIT' && <div className={styles.radioInner} />}
          </div>
        </GlassCard>
      </div>

      {/* Current Card Info */}
      {selectedMethod === 'AUTO_DEBIT' && data?.card && !showCardForm && (
        <GlassCard className={styles.currentCard}>
          <div className={styles.cardBrand}>{data.card.brand}</div>
          <div className={styles.cardNumber}>•••• •••• •••• {data.card.lastFour}</div>
          <div className={styles.cardDetails}>
            <span>{data.card.holderName}</span>
            <span>{data.card.expiryMonth.toString().padStart(2, '0')}/{data.card.expiryYear}</span>
          </div>
          <button className={styles.changeCardBtn} onClick={() => setShowCardForm(true)}>
            Cambiar tarjeta
          </button>
        </GlassCard>
      )}

      {/* Card Form */}
      {showCardForm && (
        <GlassCard className={styles.cardForm}>
          <h3 className={styles.formTitle}>Datos de la tarjeta</h3>
          
          <div className={styles.field}>
            <label>Número de tarjeta</label>
            <input
              type="text"
              value={cardForm.cardNumber}
              onChange={handleCardNumberChange}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
            />
          </div>

          <div className={styles.field}>
            <label>Nombre del titular</label>
            <input
              type="text"
              value={cardForm.cardHolderName}
              onChange={e => setCardForm({ ...cardForm, cardHolderName: e.target.value.toUpperCase() })}
              placeholder="JUAN PEREZ"
            />
          </div>

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label>Mes</label>
              <select
                value={cardForm.cardExpiryMonth}
                onChange={e => setCardForm({ ...cardForm, cardExpiryMonth: e.target.value })}
              >
                <option value="">MM</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{(i + 1).toString().padStart(2, '0')}</option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label>Año</label>
              <select
                value={cardForm.cardExpiryYear}
                onChange={e => setCardForm({ ...cardForm, cardExpiryYear: e.target.value })}
              >
                <option value="">AAAA</option>
                {Array.from({ length: 10 }, (_, i) => {
                  const year = new Date().getFullYear() + i;
                  return <option key={year} value={year}>{year}</option>;
                })}
              </select>
            </div>
            <div className={styles.field}>
              <label>CVV</label>
              <input
                type="text"
                value={cardForm.cvv}
                onChange={e => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                placeholder="123"
                maxLength={4}
              />
            </div>
          </div>

          <p className={styles.securityNote}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Tus datos están protegidos con encriptación SSL
          </p>
        </GlassCard>
      )}

      <button
        className={styles.saveBtn}
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Guardando...' : 'Guardar cambios'}
      </button>
    </div>
  );
}
