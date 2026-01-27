'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';
import { GlassCard } from '@/components/ui';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  googleMapsUrl: string | null;
  googleMapsEmbed: string | null;
  openTime: string | null;
  closeTime: string | null;
  is24Hours: boolean;
  hasParking: boolean;
  hasShowers: boolean;
  hasLockers: boolean;
  hasWifi: boolean;
  gymId: string;
  gymName: string;
  gymLogo: string | null;
}

interface Gym {
  id: string;
  name: string;
  logo: string | null;
  branches: Branch[];
}

export default function BranchesPage() {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedGymId, setSelectedGymId] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await apiFetch('/client/branches');
        const data = await res.json();
        setBranches(data.branches || []);
        setGyms(data.gyms || []);
        
        // Seleccionar el primer gym por defecto
        if (data.gyms?.length > 0) {
          setSelectedGymId(data.gyms[0].id);
          // Seleccionar la primera sucursal del primer gym
          if (data.gyms[0].branches?.length > 0) {
            setSelectedBranch(data.gyms[0].branches[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching branches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const filteredBranches = selectedGymId 
    ? branches.filter(b => b.gymId === selectedGymId)
    : branches;

  const selectedGym = gyms.find(g => g.id === selectedGymId);

  const formatSchedule = (branch: Branch) => {
    if (branch.is24Hours) return '24 horas';
    if (branch.openTime && branch.closeTime) {
      return `${branch.openTime} - ${branch.closeTime}`;
    }
    return 'Consultar horarios';
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner} />
      </div>
    );
  }

  if (gyms.length === 0) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Mis Sucursales</h1>
        <GlassCard className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h3>No tenés suscripciones activas</h3>
          <p>Suscribite a un gimnasio para ver sus sucursales</p>
          <Link href="/client/plan" className={styles.exploreBtn}>
            Explorar gimnasios
          </Link>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Mis Sucursales</h1>

      {/* Gym Selector */}
      <div className={styles.gymSelector}>
        {gyms.map(gym => (
          <button
            key={gym.id}
            className={`${styles.gymTab} ${selectedGymId === gym.id ? styles.gymTabActive : ''}`}
            onClick={() => {
              setSelectedGymId(gym.id);
              const firstBranch = gym.branches?.[0];
              if (firstBranch) setSelectedBranch(firstBranch);
            }}
          >
            {gym.logo ? (
              <img src={gym.logo} alt={gym.name} className={styles.gymTabLogo} />
            ) : (
              <div className={styles.gymTabInitial}>{gym.name.charAt(0)}</div>
            )}
            <span className={styles.gymTabName}>{gym.name}</span>
            <span className={styles.gymTabCount}>{gym.branches?.length || 0}</span>
          </button>
        ))}
      </div>

      {/* Map Section */}
      <div className={styles.mapSection}>
        {selectedBranch?.googleMapsEmbed ? (
          <iframe
            src={selectedBranch.googleMapsEmbed}
            className={styles.map}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`Mapa de ${selectedBranch.name}`}
          />
        ) : (
          <div className={styles.mapPlaceholder}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <p>Selecciona una sucursal para ver el mapa</p>
          </div>
        )}
      </div>

      {/* Branches List */}
      <div className={styles.branchesList}>
        <div className={styles.listHeader}>
          <h2 className={styles.listTitle}>
            Sucursales de {selectedGym?.name}
          </h2>
          <span className={styles.branchCount}>{filteredBranches.length} sedes</span>
        </div>
        
        {filteredBranches.length === 0 ? (
          <GlassCard className={styles.emptyState}>
            <p>Este gimnasio no tiene sucursales registradas</p>
          </GlassCard>
        ) : (
          <div className={styles.branchesGrid}>
            {filteredBranches.map(branch => (
              <GlassCard
                key={branch.id}
                className={`${styles.branchCard} ${selectedBranch?.id === branch.id ? styles.selected : ''}`}
                onClick={() => setSelectedBranch(branch)}
              >
                <div className={styles.branchHeader}>
                  <div className={styles.branchIcon}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                  <div className={styles.branchMain}>
                    <h3 className={styles.branchName}>{branch.name}</h3>
                    <p className={styles.branchAddress}>{branch.address}</p>
                  </div>
                </div>

                <div className={styles.branchMeta}>
                  <div className={styles.branchSchedule}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    <span>{formatSchedule(branch)}</span>
                  </div>
                  {branch.phone && (
                    <div className={styles.branchPhone}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                      </svg>
                      <span>{branch.phone}</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                <div className={styles.branchAmenities}>
                  {branch.is24Hours && <span className={styles.amenity} title="24 horas">🕐</span>}
                  {branch.hasParking && <span className={styles.amenity} title="Estacionamiento">🅿️</span>}
                  {branch.hasShowers && <span className={styles.amenity} title="Duchas">🚿</span>}
                  {branch.hasLockers && <span className={styles.amenity} title="Lockers">🔐</span>}
                  {branch.hasWifi && <span className={styles.amenity} title="WiFi">📶</span>}
                </div>

                {branch.googleMapsUrl && (
                  <a
                    href={branch.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.mapsLink}
                    onClick={e => e.stopPropagation()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                    Abrir en Maps
                  </a>
                )}
              </GlassCard>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
