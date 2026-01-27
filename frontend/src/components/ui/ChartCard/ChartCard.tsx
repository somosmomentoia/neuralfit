'use client';

import { ReactNode, useState } from 'react';
import styles from './ChartCard.module.css';
import { GlassCard } from '../GlassCard';
import { SegmentedControl } from '../SegmentedControl';

interface ChartCardProps {
  title?: string;
  children: ReactNode;
  timeRanges?: string[];
  defaultRange?: string;
  onRangeChange?: (range: string) => void;
  className?: string;
}

export function ChartCard({ 
  title,
  children, 
  timeRanges = ['1d', '1w', '1m', '1y', 'All'],
  defaultRange = '1m',
  onRangeChange,
  className = ''
}: ChartCardProps) {
  const [selectedRange, setSelectedRange] = useState(defaultRange);

  const handleRangeChange = (range: string) => {
    setSelectedRange(range);
    onRangeChange?.(range);
  };

  return (
    <GlassCard className={`${styles.chartCard} ${className}`}>
      <div className={styles.header}>
        {title && <h3 className={styles.title}>{title}</h3>}
        <SegmentedControl 
          options={timeRanges}
          value={selectedRange}
          onChange={handleRangeChange}
        />
      </div>
      <div className={styles.chartContainer}>
        {children}
      </div>
    </GlassCard>
  );
}
