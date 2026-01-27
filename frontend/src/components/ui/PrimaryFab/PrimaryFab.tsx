import { ReactNode } from 'react';
import styles from './PrimaryFab.module.css';

interface PrimaryFabProps {
  children: ReactNode;
  onClick?: () => void;
  ariaLabel: string;
  className?: string;
  size?: 'default' | 'large';
}

export function PrimaryFab({ 
  children, 
  onClick, 
  ariaLabel,
  className = '',
  size = 'default'
}: PrimaryFabProps) {
  return (
    <button
      type="button"
      className={`${styles.fab} ${styles[size]} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
