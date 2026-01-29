'use client';

import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import ImageUploader from '@/components/ImageUploader/ImageUploader';
import { useUser } from '@/contexts/UserContext';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatar: string | null;
}

interface ProfessionalProfile {
  specialty: string | null;
  bio: string | null;
}

export default function ProfessionalProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfessionalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { refreshUser } = useUser();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    avatar: '',
    specialty: '',
    bio: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [userRes, profileRes] = await Promise.all([
        apiFetch('/auth/me'),
        apiFetch('/professional/profile'),
      ]);
      
      const userData = await userRes.json();
      const profileData = await profileRes.json();
      
      setUser(userData.user);
      setProfile(profileData.profile);
      
      setProfileForm({
        firstName: userData.user.firstName || '',
        lastName: userData.user.lastName || '',
        phone: userData.user.phone || '',
        avatar: userData.user.avatar || '',
        specialty: profileData.profile?.specialty || '',
        bio: profileData.profile?.bio || '',
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      // Update user info
      const userRes = await apiFetch('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify({
          firstName: profileForm.firstName,
          lastName: profileForm.lastName,
          phone: profileForm.phone,
          avatar: profileForm.avatar,
        }),
      });

      if (!userRes.ok) {
        const data = await userRes.json();
        throw new Error(data.error || 'Error al actualizar perfil');
      }

      // Update professional profile
      const profileRes = await apiFetch('/professional/profile', {
        method: 'PUT',
        body: JSON.stringify({
          specialty: profileForm.specialty,
          bio: profileForm.bio,
        }),
      });

      if (!profileRes.ok) {
        const data = await profileRes.json();
        throw new Error(data.error || 'Error al actualizar perfil profesional');
      }

      setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
      fetchData();
      refreshUser();
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al actualizar' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setSaving(false);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'La contraseña debe tener al menos 6 caracteres' });
      setSaving(false);
      return;
    }

    try {
      const res = await apiFetch('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al cambiar contraseña');
      }

      setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Error al cambiar contraseña' });
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
      <h1 className={styles.title}>Mi Perfil</h1>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Información Personal</h2>
        <form onSubmit={handleProfileSubmit} className={styles.form}>
          <div className={styles.avatarSection}>
            <ImageUploader
              currentImage={profileForm.avatar}
              onImageUploaded={(url: string) => setProfileForm({ ...profileForm, avatar: url })}
              onImageRemoved={() => setProfileForm({ ...profileForm, avatar: '' })}
              aspectRatio={1}
              uploadEndpoint="/upload/avatar"
            />
          </div>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Nombre</label>
              <input
                type="text"
                className={styles.input}
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Apellido</label>
              <input
                type="text"
                className={styles.input}
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email</label>
            <input
              type="email"
              className={styles.input}
              value={user?.email || ''}
              disabled
            />
            <span className={styles.hint}>El email no se puede cambiar</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Teléfono</label>
            <input
              type="tel"
              className={styles.input}
              value={profileForm.phone}
              onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              placeholder="+54 11 1234-5678"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Especialidad</label>
            <input
              type="text"
              className={styles.input}
              value={profileForm.specialty}
              onChange={(e) => setProfileForm({ ...profileForm, specialty: e.target.value })}
              placeholder="Ej: Entrenador personal, Nutricionista..."
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Biografía</label>
            <textarea
              className={styles.textarea}
              value={profileForm.bio}
              onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
              placeholder="Cuéntanos sobre tu experiencia y especialidades..."
              rows={4}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Cambiar Contraseña</h2>
        <form onSubmit={handlePasswordSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Contraseña actual</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Nueva contraseña</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Confirmar nueva contraseña</label>
            <input
              type="password"
              className={styles.input}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              required
              minLength={6}
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={saving}>
            {saving ? 'Cambiando...' : 'Cambiar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}
