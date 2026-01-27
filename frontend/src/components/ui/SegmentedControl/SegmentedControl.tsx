'use client';

import styles from './SegmentedControl.module.css';

interface SegmentedControlProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function SegmentedControl({ 
  options, 
  value, 
  onChange,
  className = ''
}: SegmentedControlProps) {
  return (
    <div className={`${styles.container} ${className}`}>
      {options.map((option) => (
        <button
          key={option}
          type="button"
          className={`${styles.option} ${value === option ? styles.active : ''}`}
          onClick={() => onChange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
