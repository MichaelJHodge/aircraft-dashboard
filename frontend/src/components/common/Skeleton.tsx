import React from 'react';
import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, className = '' }) => {
  return (
    <div
      className={`${styles.skeleton} ${className}`.trim()}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};
