'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  discount: string;
  imageUrl: string | null;
  websiteUrl: string | null;
}

interface GymGroup {
  gym: {
    id: string;
    name: string;
    logo: string | null;
  };
  benefits: Benefit[];
}

export default function BenefitsPage() {
  const [gymGroups, setGymGroups] = useState<GymGroup[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
  const baseUrl = API_URL.replace('/api', '');

  useEffect(() => {
    const fetchBenefits = async () => {
      try {
        const res = await apiFetch('/client/benefits');
        const data = await res.json();
        const groups = data.gymGroups || [];
        setGymGroups(groups);
        // Seleccionar el primer gym por defecto
        if (groups.length > 0) {
          setSelectedGymId(groups[0].gym.id);
        }
      } catch (error) {
        console.error('Error fetching benefits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBenefits();
  }, []);

  const selectedGroup = gymGroups.find(g => g.gym.id === selectedGymId);
  const filteredBenefits = selectedGroup?.benefits || [];

  if (loading) {
    return <div className={styles.loading}>Cargando beneficios...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Beneficios Exclusivos</h1>
        <p className={styles.subtitle}>Descuentos y promociones para miembros</p>
      </div>

      {gymGroups.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p>No hay beneficios disponibles</p>
          <span>Los beneficios aparecerán cuando tu gimnasio los agregue</span>
        </div>
      ) : (
        <>
          {/* Gym Pills/Tabs */}
          {gymGroups.length > 1 && (
            <div className={styles.gymTabs}>
              {gymGroups.map((group) => (
                <button
                  key={group.gym.id}
                  className={`${styles.gymTab} ${selectedGymId === group.gym.id ? styles.gymTabActive : ''}`}
                  onClick={() => setSelectedGymId(group.gym.id)}
                >
                  {group.gym.name}
                </button>
              ))}
            </div>
          )}

          {/* Benefits List */}
          <div className={styles.benefitsList}>
            {filteredBenefits.map((benefit) => (
              <Link 
                key={benefit.id} 
                href={`/client/benefits/${benefit.id}`}
                className={styles.benefitCard}
              >
                <div className={styles.benefitImageContainer}>
                  {benefit.imageUrl ? (
                    <img 
                      src={benefit.imageUrl.startsWith('/') ? `${baseUrl}${benefit.imageUrl}` : benefit.imageUrl} 
                      alt={benefit.name}
                      className={styles.benefitImage}
                    />
                  ) : (
                    <div className={styles.benefitImagePlaceholder}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className={styles.discountBadge}>{benefit.discount}</span>
                </div>
                <div className={styles.benefitInfo}>
                  <h3 className={styles.benefitName}>{benefit.name}</h3>
                  <span className={styles.viewDetail}>
                    Ver detalle
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
