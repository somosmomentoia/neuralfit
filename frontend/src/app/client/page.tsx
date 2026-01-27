'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

interface UserData {
  firstName: string;
  lastName: string;
}

interface Subscription {
  id: string;
  status: 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'SUSPENDED';
  type: string;
  startDate: string | null;
  endDate: string | null;
  gym: {
    id: string;
    name: string;
    logo: string | null;
    branches: { name: string }[];
  };
  plan: {
    name: string;
    price: number;
    durationDays: number;
  } | null;
}

interface Benefit {
  id: string;
  name: string;
  description: string | null;
  discount: string;
  imageUrl: string | null;
  websiteUrl: string | null;
}

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  googleMapsUrl: string | null;
  openTime: string | null;
  closeTime: string | null;
  scheduleNotes: string | null;
  hasParking: boolean;
  is24Hours: boolean;
  hasContinuousSchedule: boolean;
  hasAirConditioning: boolean;
  hasShowers: boolean;
  hasLockers: boolean;
  hasWifi: boolean;
}

export default function ClientHomePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, subscriptionsRes, branchesRes, benefitsRes] = await Promise.all([
          apiFetch('/auth/me'),
          apiFetch('/client/subscriptions'),
          apiFetch('/client/branches'),
          apiFetch('/client/benefits'),
        ]);

        const userData = await userRes.json();
        const subscriptionsData = await subscriptionsRes.json();
        const branchesData = await branchesRes.json();
        const benefitsData = await benefitsRes.json();

        // Si no tiene subscripciones, redirigir a explorar membresías
        if (!subscriptionsData.subscriptions || subscriptionsData.subscriptions.length === 0) {
          router.push('/client/plan?tab=explore');
          return;
        }

        setUser({
          firstName: userData.user?.firstName || 'Usuario',
          lastName: userData.user?.lastName || '',
        });
        setSubscriptions(subscriptionsData.subscriptions || []);
        setBranches(branchesData.branches || []);
        setBenefits(benefitsData.benefits || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleScroll = () => {
    if (carouselRef.current) {
      const scrollLeft = carouselRef.current.scrollLeft;
      const cardWidth = carouselRef.current.offsetWidth;
      const newIndex = Math.round(scrollLeft / cardWidth);
      setActiveCardIndex(newIndex);
    }
  };

  const scrollToCard = (index: number) => {
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth;
      carouselRef.current.scrollTo({ left: cardWidth * index, behavior: 'smooth' });
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activo';
      case 'PENDING': return 'Pendiente';
      case 'EXPIRED': return 'Vencido';
      case 'CANCELLED': return 'Cancelado';
      case 'SUSPENDED': return 'Suspendido';
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'ACTIVE': return styles.active;
      case 'PENDING': return styles.pending;
      case 'EXPIRED': return styles.expired;
      default: return styles.inactive;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No definido';
    return new Date(dateStr).toLocaleDateString('es-AR');
  };

  return (
    <div className={styles.container}>
      {/* Membership Cards Carousel */}
      <section className={styles.membershipSection}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Mis Membresías</h3>
          <Link href="/client/plan" className={styles.seeAllLink}>Agregar</Link>
        </div>

        <div 
          className={styles.membershipCarousel}
          ref={carouselRef}
          onScroll={handleScroll}
        >
          {subscriptions.map((sub, index) => (
            <Link 
              key={sub.id} 
              href={`/client/subscriptions/${sub.id}`}
              className={`${styles.membershipCard} ${styles[`cardGradient${index % 3}`]}`}
            >
              <div className={styles.cardChip}>
                <svg width="36" height="28" viewBox="0 0 36 28" fill="none">
                  <rect x="0" y="0" width="36" height="28" rx="4" fill="rgba(255,255,255,0.3)"/>
                  <rect x="4" y="8" width="28" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
                  <rect x="4" y="16" width="28" height="4" rx="1" fill="rgba(255,255,255,0.5)"/>
                </svg>
              </div>
              
              <div className={styles.cardGymName}>{sub.gym.name}</div>
              
              <div className={styles.cardUserName}>
                {user?.firstName} {user?.lastName}
              </div>
              
              <div className={styles.cardDetails}>
                <div className={styles.cardPlan}>
                  <span className={styles.cardLabel}>PLAN</span>
                  <span className={styles.cardValue}>{sub.plan?.name || 'Sin plan'}</span>
                </div>
                <div className={styles.cardExpiry}>
                  <span className={styles.cardLabel}>VENCE</span>
                  <span className={styles.cardValue}>{formatDate(sub.endDate)}</span>
                </div>
              </div>
              
              <div className={`${styles.cardStatus} ${getStatusClass(sub.status)}`}>
                {getStatusLabel(sub.status)}
                {sub.status === 'ACTIVE' && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {subscriptions.length > 1 && (
          <div className={styles.carouselDots}>
            {subscriptions.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${activeCardIndex === index ? styles.dotActive : ''}`}
                onClick={() => scrollToCard(index)}
                aria-label={`Ir a membresía ${index + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Beneficios exclusivos</h3>
          {benefits.length > 0 && (
            <Link href="/client/benefits" className={styles.seeAllLink}>Ver todas</Link>
          )}
        </div>
        <div className={styles.benefitsCarousel}>
          {benefits.length > 0 ? (
            benefits.slice(0, 4).map((benefit) => (
              <Link 
                key={benefit.id} 
                href={`/client/benefits/${benefit.id}`}
                className={styles.benefitCard}
              >
                <div className={styles.benefitImageContainer}>
                  {benefit.imageUrl ? (
                    <img src={benefit.imageUrl} alt={benefit.name} className={styles.benefitImg} />
                  ) : (
                    <div className={styles.benefitPlaceholder}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  )}
                  <span className={styles.benefitDiscount}>{benefit.discount}</span>
                </div>
                <span className={styles.benefitName}>{benefit.name}</span>
              </Link>
            ))
          ) : (
            <p className={styles.emptyText}>No hay beneficios disponibles</p>
          )}
        </div>
      </section>

      {/* Locations Section */}
      {branches.length > 0 && (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Tus sedes</h3>
          <Link href="/client/branches" className={styles.seeAllLink}>Ver todas</Link>
        </div>
        <Link href="/client/branches" className={styles.branchesSummaryCard}>
          <div className={styles.branchesSummaryIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className={styles.branchesSummaryInfo}>
            <span className={styles.branchesSummaryCount}>{branches.length} sucursales disponibles</span>
            <span className={styles.branchesSummaryText}>
              en {subscriptions.length} {subscriptions.length === 1 ? 'gimnasio' : 'gimnasios'}
            </span>
          </div>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.branchesSummaryArrow}>
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </Link>
      </section>
      )}
    </div>
  );
}
