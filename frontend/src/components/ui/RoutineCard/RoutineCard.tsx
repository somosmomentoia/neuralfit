import { ReactNode } from 'react';
import styles from './RoutineCard.module.css';

interface Badge {
  label: string;
  variant?: 'default' | 'primary' | 'sport';
}

interface RoutineCardProps {
  title: string;
  imageUrl: string;
  badges?: Badge[];
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  size?: 'default' | 'large';
}

export function RoutineCard({ 
  title, 
  imageUrl, 
  badges = [], 
  subtitle,
  onClick,
  className = '',
  size = 'default'
}: RoutineCardProps) {
  return (
    <div 
      className={`${styles.card} ${styles[size]} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.imageWrapper}>
        <img src={imageUrl} alt={title} className={styles.image} />
        <div className={styles.overlay} />
      </div>
      
      <div className={styles.content}>
        {badges.length > 0 && (
          <div className={styles.badges}>
            {badges.map((badge, index) => (
              <span 
                key={index} 
                className={`${styles.badge} ${styles[badge.variant || 'default']}`}
              >
                {badge.label}
              </span>
            ))}
          </div>
        )}
        
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
