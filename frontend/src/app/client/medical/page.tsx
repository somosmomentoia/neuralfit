'use client';

import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface HealthData {
  medicalClearanceUrl: string | null;
}

export default function ClientMedicalPage() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const res = await apiFetch('/client/profile/health');
        if (res.ok) {
          const data = await res.json();
          setHealthData(data.health);
        }
      } catch (error) {
        console.error('Error fetching health data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHealthData();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/upload/medical-clearance`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        // Update client profile with new URL
        await apiFetch('/client/profile', {
          method: 'PUT',
          body: JSON.stringify({ medicalClearanceUrl: data.imageUrl }),
        });
        setHealthData(prev => ({ ...prev, medicalClearanceUrl: data.imageUrl }));
        alert('Apto médico subido correctamente');
      } else {
        alert('Error al subir el archivo');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir el archivo');
    } finally {
      setUploading(false);
    }
  };

  const hasDocument = !!healthData?.medicalClearanceUrl;

  if (loading) {
    return <div className={styles.container}><p>Cargando...</p></div>;
  }

  return (
    <div className={styles.container}>
      {/* Status Card */}
      <div className={styles.statusCard}>
        <div className={`${styles.statusIcon} ${hasDocument ? styles.valid : styles.invalid}`}>
          {hasDocument ? (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          )}
        </div>
        
        <h2 className={styles.statusTitle}>
          {hasDocument ? 'Apto médico vigente' : 'Apto médico requerido'}
        </h2>
        
        <p className={styles.statusDescription}>
          {hasDocument 
            ? 'Tu certificado médico está al día y es válido para entrenar.'
            : 'Necesitás subir tu certificado médico para poder entrenar.'}
        </p>

        {hasDocument && (
          <div className={styles.documentInfo}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Fecha de carga:</span>
              <span className={styles.infoValue}>15/01/2026</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Vencimiento:</span>
              <span className={styles.infoValue}>15/01/2027</span>
            </div>
          </div>
        )}
      </div>

      {/* Document Preview */}
      {hasDocument && healthData?.medicalClearanceUrl && (
        <div className={styles.documentCard}>
          <div className={styles.documentPreview}>
            {healthData.medicalClearanceUrl.endsWith('.pdf') ? (
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            ) : (
              <img 
                src={`${API_URL.replace('/api', '')}${healthData.medicalClearanceUrl}`}
                alt="Apto médico"
                className={styles.documentImage}
              />
            )}
            <span>Apto médico</span>
          </div>
          <button 
            className={styles.viewBtn}
            onClick={() => window.open(`${API_URL.replace('/api', '')}${healthData.medicalClearanceUrl}`, '_blank')}
          >
            Ver documento
          </button>
        </div>
      )}

      {/* Upload Section */}
      <div className={styles.uploadCard}>
        <h3 className={styles.uploadTitle}>
          {hasDocument ? 'Actualizar certificado' : 'Subir certificado'}
        </h3>
        
        <div 
          className={styles.uploadArea}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className={styles.uploadIcon}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
          <p className={styles.uploadText}>
            Arrastrá tu archivo aquí o hacé click para seleccionar
          </p>
          <span className={styles.uploadHint}>JPG o PNG (máx. 10MB)</span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          style={{ display: 'none' }}
        />

        <button 
          className={styles.uploadBtn} 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Subiendo...' : 'Seleccionar archivo'}
        </button>
      </div>

      {/* Requirements */}
      <div className={styles.requirementsCard}>
        <h3 className={styles.requirementsTitle}>Requisitos del certificado</h3>
        <ul className={styles.requirementsList}>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Debe ser emitido por un médico matriculado
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Indicar que estás apto para actividad física
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Fecha de emisión no mayor a 1 año
          </li>
          <li>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
            Debe ser legible y sin tachaduras
          </li>
        </ul>
      </div>
    </div>
  );
}
