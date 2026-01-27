'use client';

import { useEffect, useState } from 'react';
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
  createdBy?: {
    firstName: string;
    lastName: string;
  };
  isGlobal?: boolean;
}

const categoryLabels: Record<string, string> = {
  MUSCULACION: 'Musculación',
  AEROBICA: 'Aeróbica',
  DEPORTISTA: 'Deportista',
};

// Función para convertir URL de YouTube a embed
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  // Patrones de YouTube
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
  
  // Si ya es una URL de embed, devolverla
  if (url.includes('youtube.com/embed/')) {
    return url;
  }
  
  return null;
};

export default function ClientExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const response = await apiFetch('/client/exercises');
        const data = await response.json();
        setExercises(data.exercises || []);
      } catch (error) {
        console.error('Error fetching exercises:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const filteredExercises = exercises.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.muscleGroup?.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = selectedCategory === 'ALL' || e.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['ALL', 'MUSCULACION', 'AEROBICA', 'DEPORTISTA'];

  const toggleExpand = (exerciseId: string) => {
    setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Search Bar */}
      <div className={styles.searchBar}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          placeholder="Buscar ejercicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Category Filters */}
      <div className={styles.filters}>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`${styles.filterBtn} ${selectedCategory === cat ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'ALL' ? 'Todos' : categoryLabels[cat]}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className={styles.resultsCount}>
        {filteredExercises.length} ejercicio{filteredExercises.length !== 1 ? 's' : ''} encontrado{filteredExercises.length !== 1 ? 's' : ''}
      </div>

      {/* Exercises List */}
      {filteredExercises.length === 0 ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>No hay ejercicios disponibles</p>
          <span>Los ejercicios aparecerán cuando te asignen rutinas</span>
        </div>
      ) : (
        <div className={styles.exercisesList}>
          {filteredExercises.map((exercise) => {
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

                {/* Expandable Content with smooth transition */}
                <div className={`${styles.cardContentWrapper} ${isExpanded ? styles.expanded : ''}`}>
                  <div className={styles.cardContentInner}>
                    <div className={styles.cardContent}>
                      {/* Video Embed */}
                      {isExpanded && embedUrl ? (
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
                      ) : exercise.videoUrl ? (
                        <a 
                          href={exercise.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.videoLink}
                        >
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="5 3 19 12 5 21 5 3"/>
                          </svg>
                          Ver video en nueva pestaña
                        </a>
                      ) : null}

                      {/* Exercise Details */}
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

                        {exercise.muscleGroup && (
                          <div className={styles.detailItem}>
                            <span className={styles.detailLabel}>Grupo muscular</span>
                            <span className={styles.detailValue}>{exercise.muscleGroup}</span>
                          </div>
                        )}

                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Categoría</span>
                          <span className={styles.detailValue}>{categoryLabels[exercise.category]}</span>
                        </div>

                        <div className={styles.detailItem}>
                          <span className={styles.detailLabel}>Creado por</span>
                          <span className={styles.detailValue}>
                            {exercise.isGlobal 
                              ? 'Ejercicio Global' 
                              : exercise.createdBy 
                                ? `${exercise.createdBy.firstName} ${exercise.createdBy.lastName}`
                                : 'Desconocido'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      {exercise.description && (
                        <div className={styles.descriptionSection}>
                          <span className={styles.detailLabel}>Descripción</span>
                          <p className={styles.description}>{exercise.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
