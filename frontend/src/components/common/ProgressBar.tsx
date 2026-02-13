/**
 * ProgressBar Component
 * Visual indicator for certification progress percentage
 */

import React from 'react';
import { getProgressBand } from '../../utils/format';
import styles from './ProgressBar.module.css';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: number;
  tone?: 'auto' | 'default' | 'warning';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  showLabel = true,
  height = 10,
  tone = 'auto',
}) => {
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const band = getProgressBand(clampedProgress);

  const toneClass =
    tone === 'warning'
      ? styles.warning
      : tone === 'default'
        ? styles.default
        : band === 'complete'
          ? styles.complete
          : band === 'good'
            ? styles.good
            : band === 'caution'
              ? styles.caution
              : band === 'warning'
                ? styles.warning
                : styles.critical;

  return (
    <div className={styles.container}>
      <div className={styles.track} style={{ height: `${height}px` }}>
        <div
          className={`${styles.fill} ${toneClass}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && <span className={styles.label}>{clampedProgress}%</span>}
    </div>
  );
};
