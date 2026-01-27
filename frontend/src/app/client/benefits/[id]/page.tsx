'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  discount: string;
  imageUrl: string | null;
  websiteUrl: string | null;
  gym?: {
    name: string;
  };
}

export default function BenefitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [benefit, setBenefit] = useState<Benefit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBenefit = async () => {
      try {
        const res = await apiFetch(`/client/benefits/${params.id}`);
        if (!res.ok) {
          router.push('/client/benefits');
          return;
        }
        const data = await res.json();
        setBenefit(data.benefit);
      } catch (error) {
        console.error('Error fetching benefit:', error);
        router.push('/client/benefits');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchBenefit();
    }
  }, [params.id, router]);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!benefit) {
    return null;
  }

  return (
    <div className={styles.container}>
      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => router.back()}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        Volver
      </button>

      {/* Hero Image */}
      <div className={styles.heroContainer}>
        {benefit.imageUrl ? (
          <img 
            src={benefit.imageUrl} 
            alt={benefit.name}
            className={styles.heroImage}
          />
        ) : (
          <div className={styles.heroPlaceholder}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )}
        <div className={styles.discountBadge}>{benefit.discount}</div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        <h1 className={styles.title}>{benefit.name}</h1>
        
        {benefit.gym && (
          <div className={styles.gymInfo}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 21h18M9 8h1M9 12h1M9 16h1M14 8h1M14 12h1M14 16h1M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/>
            </svg>
            <span>{benefit.gym.name}</span>
          </div>
        )}

        {benefit.description ? (
          <div className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Descripción</h2>
            <p className={styles.description}>{benefit.description}</p>
          </div>
        ) : (
          <div className={styles.descriptionSection}>
            <p className={styles.noDescription}>No hay descripción disponible para este beneficio.</p>
          </div>
        )}

        {/* CTA Button */}
        {benefit.websiteUrl && (
          <a 
            href={benefit.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.ctaButton}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
            </svg>
            Ir al sitio web
          </a>
        )}
      </div>
    </div>
  );
}
