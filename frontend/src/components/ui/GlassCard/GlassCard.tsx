import { ReactNode, MouseEvent } from 'react';
import styles from './GlassCard.module.css';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'highlight';
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
}

export function GlassCard({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default',
  onClick
}: GlassCardProps) {
  return (
    <div 
      className={`${styles.card} ${styles[padding]} ${styles[variant]} ${className}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {children}
    </div>
  );
}
