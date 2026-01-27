'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './ExerciseList.module.css';

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string | null;
  category: string;
  difficulty: number;
  description: string | null;
  videoUrl: string | null;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdBy?: {
    id?: string;
    firstName: string;
    lastName: string;
  };
  createdById?: string;
  isGlobal?: boolean;
}

interface ExerciseListProps {
  exercises: Exercise[];
  userRole: 'admin' | 'professional' | 'client';
  currentUserId?: string;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: string) => void;
  showStatus?: boolean;
  detailBasePath?: string;
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

export function ExerciseList({
  exercises,
  userRole,
  currentUserId,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  showStatus = true,
  detailBasePath,
}: ExerciseListProps) {
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  const toggleExpand = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  const canEdit = (exercise: Exercise) => {
    if (userRole === 'admin') return true;
    if (userRole === 'professional') {
      const creatorId = exercise.createdById || exercise.createdBy?.id;
      return creatorId === currentUserId;
    }
    return false;
  };

  const canDelete = (exercise: Exercise) => {
    if (userRole === 'admin') return true;
    if (userRole === 'professional') {
      const creatorId = exercise.createdById || exercise.createdBy?.id;
      return creatorId === currentUserId;
    }
    return false;
  };

  if (exercises.length === 0) {
    return (
      <div className={styles.emptyState}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <p>No hay ejercicios disponibles</p>
      </div>
    );
  }

  return (
    <div className={styles.exercisesList}>
      {exercises.map((exercise) => {
        const isExpanded = expandedExercise === exercise.id;
        const embedUrl = exercise.videoUrl ? getYouTubeEmbedUrl(exercise.videoUrl) : null;
        
        return (
          <div 
            key={exercise.id} 
            className={`${styles.exerciseCard} ${isExpanded ? styles.expanded : ''}`}
          >
            {/* Card Header - Clickable */}
            <div 
              className={styles.cardHeader}
              onClick={() => toggleExpand(exercise.id)}
            >
              <div className={styles.cardHeaderLeft}>
                <div className={styles.exerciseIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6.5 6.5h11v11h-11z"/>
                    <path d="M6.5 6.5L4 4"/>
                    <path d="M17.5 6.5L20 4"/>
                    <path d="M6.5 17.5L4 20"/>
                    <path d="M17.5 17.5L20 20"/>
                  </svg>
                </div>
                <div className={styles.cardHeaderInfo}>
                  <h3 className={styles.exerciseName}>{exercise.name}</h3>
                  <div className={styles.cardMeta}>
                    {exercise.muscleGroup && (
                      <span className={styles.muscleTag}>{exercise.muscleGroup}</span>
                    )}
                    <span className={`${styles.categoryBadge} ${styles[exercise.category.toLowerCase()]}`}>
                      {categoryLabels[exercise.category]}
                    </span>
                    {showStatus && exercise.status && (
                      <span 
                        className={styles.statusBadge}
                        data-status={exercise.status.toLowerCase()}
                      >
                        {statusLabels[exercise.status]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className={styles.cardHeaderRight}>
                <div className={styles.difficulty}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <span 
                      key={level} 
                      className={`${styles.dot} ${level <= exercise.difficulty ? styles.filled : ''}`}
                    />
                  ))}
                </div>
                <div className={`${styles.expandIcon} ${isExpanded ? styles.rotated : ''}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Expanded Content - Compact */}
            {isExpanded && (
              <div className={styles.cardContent}>
                {/* Video Embed - Smaller */}
                {embedUrl && (
                  <div className={styles.videoContainerSmall}>
                    <iframe
                      src={embedUrl}
                      title={exercise.name}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.videoEmbed}
                    />
                  </div>
                )}

                {/* Actions */}
                <div className={styles.cardActions}>
                  {detailBasePath && (
                    <Link href={`${detailBasePath}/${exercise.id}`} className={`${styles.actionBtn} ${styles.primary}`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                      Ver detalle
                    </Link>
                  )}

                  {!embedUrl && exercise.videoUrl && (
                    <a 
                      href={exercise.videoUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.actionBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                      Ver video
                    </a>
                  )}

                  {userRole === 'admin' && exercise.status === 'PENDING' && onApprove && onReject && (
                    <>
                      <button 
                        className={`${styles.actionBtn} ${styles.approve}`}
                        onClick={(e) => { e.stopPropagation(); onApprove(exercise.id); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Aprobar
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.reject}`}
                        onClick={(e) => { e.stopPropagation(); onReject(exercise.id); }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18"/>
                          <line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                        Rechazar
                      </button>
                    </>
                  )}

                  {canEdit(exercise) && onEdit && (
                    <button 
                      className={styles.actionBtn}
                      onClick={(e) => { e.stopPropagation(); onEdit(exercise); }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Editar
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
