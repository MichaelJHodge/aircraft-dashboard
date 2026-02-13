/**
 * StatusBadge Component
 * Displays aircraft phase or status with appropriate styling
 */

import React from 'react';
import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  status: string;
  size?: 'small' | 'medium';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'medium' }) => {
  const normalized = status.toLowerCase();
  const tone =
    normalized.includes('ready') || normalized.includes('delivered') || normalized.includes('completed')
      ? 'nominal'
      : normalized.includes('certification') || normalized.includes('in-progress')
        ? 'warning'
        : normalized.includes('blocked')
          ? 'blocked'
          : 'delayed';

  return (
    <span className={`${styles.badge} ${styles[size]} ${styles[tone]}`}>
      <span className={styles.dot} aria-hidden="true" />
      {status}
    </span>
  );
};
