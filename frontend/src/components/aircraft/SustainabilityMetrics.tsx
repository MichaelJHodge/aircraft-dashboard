/**
 * SustainabilityMetrics Component
 * Displays environmental impact metrics for electric aircraft
 */

import React from 'react';
import { Card } from '../common';
import { SustainabilityMetrics as SustainabilityMetricsType } from '../../types';
import { formatNumber } from '../../utils/format';
import styles from './SustainabilityMetrics.module.css';

interface SustainabilityMetricsProps {
  metrics: SustainabilityMetricsType;
}

export const SustainabilityMetrics: React.FC<SustainabilityMetricsProps> = ({
  metrics,
}) => {
  const metricItems = [
    {
      icon: 'CO2',
      label: 'CO₂ Avoided',
      value: formatNumber(metrics.estimatedCO2AvoidedKg),
      unit: 'kg',
      description: 'vs. conventional turbine aircraft',
    },
    {
      icon: 'TR',
      label: 'Equivalent Trees',
      value: formatNumber(metrics.equivalentTreesPlanted),
      unit: 'trees',
      description: 'carbon sequestration equivalent',
    },
    {
      icon: 'FUEL',
      label: 'Fuel Saved',
      value: formatNumber(metrics.conventionalFuelSavedGallons),
      unit: 'gallons',
      description: 'jet fuel not consumed',
    },
  ];

  return (
    <Card className={styles.container}>
      <p className={styles.description}>
        Estimated environmental impact based on typical mission profile compared to
        conventional turbine aircraft over expected service life.
      </p>

      <div className={styles.metrics}>
        {metricItems.map((item) => (
          <div key={item.label} className={styles.metric}>
            <div className={styles.icon}>{item.icon}</div>
            <div className={styles.content}>
              <span className={styles.label}>{item.label}</span>
              <div className={styles.valueRow}>
                <span className={styles.value}>{item.value}</span>
                <span className={styles.unit}>{item.unit}</span>
              </div>
              <span className={styles.metricDescription}>{item.description}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <p className={styles.disclaimer}>
          * Estimates based on industry-standard lifecycle analysis methodologies.
          Actual impact varies based on operational profile and energy sources.
        </p>
      </div>
    </Card>
  );
};
