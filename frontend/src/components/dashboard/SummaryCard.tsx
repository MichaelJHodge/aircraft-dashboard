/**
 * SummaryCard Component
 * Displays key metrics on the dashboard overview
 */

import React from 'react';
import { Card } from '../common';
import styles from './SummaryCard.module.css';

interface SummaryCardProps {
  title: string;
  value: number;
  subtitle?: string;
  tone?: 'neutral' | 'nominal' | 'warning' | 'info';
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  tone = 'neutral',
}) => {
  return (
    <Card className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
      </div>
      <div className={`${styles.value} ${styles[tone]}`}>
        {value}
      </div>
      {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
    </Card>
  );
};
