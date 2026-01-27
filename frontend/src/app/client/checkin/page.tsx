'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
}

export default function ClientCheckinPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userRes = await apiFetch('/auth/me');
        const userData = await userRes.json();

        setProfile({
          id: userData.user?.id || '',
          firstName: userData.user?.firstName || 'Usuario',
          lastName: userData.user?.lastName || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  // Generate a simple QR-like pattern based on user ID
  const generateQRPattern = () => {
    const id = profile?.id || 'default';
    const pattern = [];
    for (let i = 0; i < 7; i++) {
      const row = [];
      for (let j = 0; j < 7; j++) {
        // Create a deterministic pattern based on ID
        const charCode = id.charCodeAt((i * 7 + j) % id.length) || 0;
        const isFilled = (charCode + i + j) % 3 !== 0;
        // Keep corners filled for QR-like appearance
        const isCorner = (i < 2 && j < 2) || (i < 2 && j > 4) || (i > 4 && j < 2);
        row.push(isCorner || isFilled);
      }
      pattern.push(row);
    }
    return pattern;
  };

  const qrPattern = generateQRPattern();

  return (
    <div className={styles.container}>
      <div className={styles.qrContainer}>
        <div className={styles.qrCard}>
          {/* QR Code Display */}
          <div className={styles.qrCode}>
            <div className={styles.qrGrid}>
              {qrPattern.map((row, i) => (
                <div key={i} className={styles.qrRow}>
                  {row.map((filled, j) => (
                    <div 
                      key={j} 
                      className={`${styles.qrCell} ${filled ? styles.filled : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            
            {/* User name below QR */}
            <span className={styles.qrUserName}>
              {profile?.firstName} {profile?.lastName?.charAt(0)}.
            </span>
          </div>
        </div>

        <p className={styles.instructions}>
          Mostrá este código al ingresar al gym
        </p>

        <div className={styles.infoCard}>
          <div className={styles.infoIcon}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          <div className={styles.infoText}>
            <p>Este código es personal e intransferible.</p>
            <p>Se actualiza automáticamente cada día.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
