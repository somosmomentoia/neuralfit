import { ReactNode } from 'react';
import styles from './StatCard.module.css';
import { GlassCard } from '../GlassCard';

interface StatCardProps {
  value: string | number;
  label: string;
  metadata?: ReactNode;
  icon?: ReactNode;
  variant?: 'default' | 'highlight';
  className?: string;
}

export function StatCard({ 
  value, 
  label, 
  metadata, 
  icon,
  variant = 'default',
  className = ''
}: StatCardProps) {
  return (
    <GlassCard variant={variant} className={`${styles.statCard} ${className}`}>
      {icon && <div className={styles.icon}>{icon}</div>}
      <div className={styles.content}>
        <span className={styles.value}>{value}</span>
        <span className={styles.label}>{label}</span>
        {metadata && <div className={styles.metadata}>{metadata}</div>}
      </div>
    </GlassCard>
  );
}
