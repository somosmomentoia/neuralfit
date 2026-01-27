'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import styles from './page.module.css';

interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  category: string;
  difficulty: number;
  description: string | null;
  videoUrl: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  APPROVED: 'Aprobado',
  REJECTED: 'Rechazado',
};

const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }
  
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return null;
};

export default function ExerciseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchExercise = async () => {
      try {
        const res = await apiFetch(`/admin/exercises/${params.id}`);
        if (!res.ok) {
          throw new Error('Ejercicio no encontrado');
        }
        const data = await res.json();
        setExercise(data.exercise);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchExercise();
    }
  }, [params.id]);

  const handleApprove = async () => {
    if (!exercise) return;
    try {
      await apiFetch(`/admin/exercises/${exercise.id}/approve`, { method: 'POST' });
      setExercise({ ...exercise, status: 'APPROVED' });
    } catch (err) {
      console.error('Error approving:', err);
    }
  };

  const handleReject = async () => {
    if (!exercise) return;
    try {
      await apiFetch(`/admin/exercises/${exercise.id}/reject`, { method: 'POST' });
      setExercise({ ...exercise, status: 'REJECTED' });
    } catch (err) {
      console.error('Error rejecting:', err);
    }
  };

  const handleDelete = async () => {
    if (!exercise) return;
    if (!confirm('¿Estás seguro de eliminar este ejercicio? Esta acción no se puede deshacer.')) return;
    try {
      await apiFetch(`/admin/exercises/${exercise.id}`, { method: 'DELETE' });
      router.push('/admin/exercises');
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando ejercicio...</div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error || 'Ejercicio no encontrado'}</p>
          <button onClick={() => router.back()} className={styles.backBtn}>
            Volver
          </button>
        </div>
      </div>
    );
  }

  const embedUrl = exercise.videoUrl ? getYouTubeEmbedUrl(exercise.videoUrl) : null;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
          Volver
        </button>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        {/* Title Section */}
        <div className={styles.titleSection}>
          <div className={styles.titleRow}>
            <h1 className={styles.title}>{exercise.name}</h1>
            <span 
              className={styles.statusBadge}
              data-status={exercise.status.toLowerCase()}
            >
              {statusLabels[exercise.status]}
            </span>
          </div>
          <div className={styles.meta}>
            <span className={`${styles.categoryBadge} ${styles[exercise.category.toLowerCase()]}`}>
              {categoryLabels[exercise.category]}
            </span>
            {exercise.muscleGroup && (
              <span className={styles.muscleTag}>{exercise.muscleGroup}</span>
            )}
          </div>
        </div>

        {/* Video Section */}
        {embedUrl ? (
          <div className={styles.videoSection}>
            <div className={styles.videoContainer}>
              <iframe
                src={embedUrl}
                title={exercise.name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className={styles.videoEmbed}
              />
            </div>
          </div>
        ) : exercise.videoUrl ? (
          <a 
            href={exercise.videoUrl} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.videoLink}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            Ver video en nueva pestaña
          </a>
        ) : null}

        {/* Details Grid */}
        <div className={styles.detailsSection}>
          <h2 className={styles.sectionTitle}>Detalles</h2>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Dificultad</span>
              <div className={styles.difficultyLarge}>
                {[1, 2, 3, 4, 5].map((level) => (
                  <span 
                    key={level} 
                    className={`${styles.dotLarge} ${level <= exercise.difficulty ? styles.filled : ''}`}
                  />
                ))}
                <span className={styles.difficultyText}>
                  {exercise.difficulty === 1 ? 'Muy fácil' : 
                   exercise.difficulty === 2 ? 'Fácil' : 
                   exercise.difficulty === 3 ? 'Intermedio' : 
                   exercise.difficulty === 4 ? 'Difícil' : 'Muy difícil'}
                </span>
              </div>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Categoría</span>
              <span className={styles.detailValue}>{categoryLabels[exercise.category]}</span>
            </div>

            {exercise.muscleGroup && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Grupo muscular</span>
                <span className={styles.detailValue}>{exercise.muscleGroup}</span>
              </div>
            )}

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Creado por</span>
              <span className={styles.detailValue}>
                {exercise.createdBy 
                  ? `${exercise.createdBy.firstName} ${exercise.createdBy.lastName}`
                  : 'Gimnasio'
                }
              </span>
            </div>

            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha de creación</span>
              <span className={styles.detailValue}>
                {new Date(exercise.createdAt).toLocaleDateString('es-AR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {exercise.description && (
          <div className={styles.descriptionSection}>
            <h2 className={styles.sectionTitle}>Descripción</h2>
            <p className={styles.description}>{exercise.description}</p>
          </div>
        )}

        {/* Admin Actions */}
        <div className={styles.actionsSection}>
          <h2 className={styles.sectionTitle}>Acciones</h2>
          <div className={styles.actionButtons}>
            <button 
              className={`${styles.actionBtn} ${styles.edit}`} 
              onClick={() => router.push(`/admin/exercises?edit=${exercise.id}`)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              Editar ejercicio
            </button>
            {exercise.status === 'PENDING' && (
              <>
                <button className={`${styles.actionBtn} ${styles.approve}`} onClick={handleApprove}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  Aprobar
                </button>
                <button className={`${styles.actionBtn} ${styles.reject}`} onClick={handleReject}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  Rechazar
                </button>
              </>
            )}
            <button className={`${styles.actionBtn} ${styles.delete}`} onClick={handleDelete}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Eliminar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
