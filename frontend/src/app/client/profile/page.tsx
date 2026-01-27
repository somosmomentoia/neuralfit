'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface HealthData {
  weight: number | null;
  height: number | null;
  medicalClearanceUrl: string | null;
}

export default function ClientProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showHealthModal, setShowHealthModal] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await apiFetch('/auth/me');
        const userData = await userRes.json();

        const profileData = {
          firstName: userData.user?.firstName || '',
          lastName: userData.user?.lastName || '',
          email: userData.user?.email || '',
          phone: userData.user?.phone || '',
          avatar: userData.user?.avatar || null,
        };

        console.log('Profile loaded, avatar URL:', profileData.avatar);
        setProfile(profileData);
        setFormData({
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          phone: profileData.phone || '',
        });

        // Fetch health data
        try {
          const healthRes = await apiFetch('/client/profile/health');
          const healthJson = await healthRes.json();
          setHealthData(healthJson.health || null);
        } catch {
          console.log('Health data not available');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || null,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProfile(prev => prev ? {
          ...prev,
          firstName: data.user.firstName,
          lastName: data.user.lastName,
          phone: data.user.phone,
        } : null);
        setEditing(false);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const token = localStorage.getItem('token');
      
      const res = await fetch(`${API_URL}/upload/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        // Update profile with new avatar
        await apiFetch('/auth/profile', {
          method: 'PUT',
          body: JSON.stringify({ avatar: data.imageUrl }),
        });
        setProfile(prev => prev ? { ...prev, avatar: data.imageUrl } : null);
        // Refresh para actualizar el sidebar
        window.location.reload();
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  return (
    <div className={styles.container}>
      {/* Avatar Section */}
      <div className={styles.avatarSection}>
        <div className={styles.avatar} onClick={() => avatarInputRef.current?.click()}>
          {profile?.avatar ? (
            <img 
              src={profile.avatar.startsWith('http') ? profile.avatar : `${API_URL.replace('/api', '')}${profile.avatar}`} 
              alt="Avatar" 
              className={styles.avatarImage}
              onError={(e) => console.error('Avatar load error, URL:', profile.avatar)}
            />
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          )}
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          style={{ display: 'none' }}
        />
        <button className={styles.changePhotoBtn} onClick={() => avatarInputRef.current?.click()}>
          Cambiar foto
        </button>
      </div>

      {/* Profile Form */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>Datos personales</h3>
          {!editing ? (
            <button className={styles.editBtn} onClick={() => setEditing(true)}>
              Editar
            </button>
          ) : (
            <div className={styles.editActions}>
              <button className={styles.cancelBtn} onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button className={styles.saveBtn} onClick={handleSave}>
                Guardar
              </button>
            </div>
          )}
        </div>

        <div className={styles.formFields}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            {editing ? (
              <input
                type="text"
                className={styles.input}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            ) : (
              <span className={styles.value}>{profile?.firstName}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Apellido</label>
            {editing ? (
              <input
                type="text"
                className={styles.input}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            ) : (
              <span className={styles.value}>{profile?.lastName}</span>
            )}
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <span className={styles.value}>{profile?.email}</span>
            <span className={styles.hint}>El email no se puede modificar</span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            {editing ? (
              <input
                type="tel"
                className={styles.input}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+54 9 11 1234-5678"
              />
            ) : (
              <span className={styles.value}>{profile?.phone || 'No especificado'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>Seguridad</h3>
        </div>

        <div className={styles.securityOptions}>
          <button className={styles.securityBtn} onClick={() => setShowPasswordModal(true)}>
            <div className={styles.securityIcon}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <span>Cambiar contraseña</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Health Section */}
      <div className={styles.formCard}>
        <div className={styles.formHeader}>
          <h3 className={styles.formTitle}>Salud</h3>
          <button className={styles.editBtn} onClick={() => setShowHealthModal(true)}>
            Editar
          </button>
        </div>

        <div className={styles.healthGrid}>
          <div className={styles.healthItem}>
            <span className={styles.healthLabel}>Peso</span>
            <span className={styles.healthValue}>
              {healthData?.weight ? `${healthData.weight} kg` : 'No especificado'}
            </span>
          </div>
          <div className={styles.healthItem}>
            <span className={styles.healthLabel}>Altura</span>
            <span className={styles.healthValue}>
              {healthData?.height ? `${healthData.height} cm` : 'No especificado'}
            </span>
          </div>
        </div>

        <div className={styles.securityOptions}>
          <button className={styles.securityBtn} onClick={() => router.push('/client/medical')}>
            <div className={styles.securityIconMedical}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className={styles.medicalInfo}>
              <span>Apto médico</span>
              {healthData?.medicalClearanceUrl && (
                <span className={styles.uploadedBadge}>Subido</span>
              )}
            </div>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <PasswordModal onClose={() => setShowPasswordModal(false)} />
      )}

      {/* Health Modal */}
      {showHealthModal && (
        <HealthModal 
          healthData={healthData}
          onClose={() => setShowHealthModal(false)}
          onSave={(data) => {
            setHealthData(prev => prev ? { ...prev, ...data } : { ...data, medicalClearanceUrl: null });
            setShowHealthModal(false);
          }}
        />
      )}
    </div>
  );
}

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cambiar contraseña');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Cambiar contraseña</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {success ? (
          <div className={styles.successMessage}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>Contraseña actualizada</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.modalForm}>
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.modalField}>
              <label>Contraseña actual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label>Nueva contraseña</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.modalField}>
              <label>Confirmar nueva contraseña</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className={styles.saveBtn} disabled={loading}>
                {loading ? 'Guardando...' : 'Cambiar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function HealthModal({ 
  healthData, 
  onClose, 
  onSave 
}: { 
  healthData: HealthData | null; 
  onClose: () => void; 
  onSave: (data: { weight: number | null; height: number | null }) => void;
}) {
  const [weight, setWeight] = useState(healthData?.weight?.toString() || '');
  const [height, setHeight] = useState(healthData?.height?.toString() || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await apiFetch('/client/profile', {
        method: 'PUT',
        body: JSON.stringify({
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
        }),
      });

      if (res.ok) {
        onSave({
          weight: weight ? parseFloat(weight) : null,
          height: height ? parseFloat(height) : null,
        });
      } else {
        const data = await res.json();
        setError(data.error || 'Error al guardar');
      }
    } catch {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Datos de salud</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.modalField}>
            <label>Peso (kg)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="500"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Ej: 70.5"
            />
          </div>

          <div className={styles.modalField}>
            <label>Altura (cm)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="300"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Ej: 175"
            />
          </div>

          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
