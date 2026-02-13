/**
 * StatusDistribution Component
 * Shows breakdown of aircraft by phase
 */

import React from 'react';
import { Card } from '../common';
import { StatusDistribution as StatusDistributionType } from '../../types';
import { getPhaseColor } from '../../utils/format';
import styles from './StatusDistribution.module.css';

interface StatusDistributionProps {
  distribution: StatusDistributionType[];
}

export const StatusDistribution: React.FC<StatusDistributionProps> = ({
  distribution,
}) => {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <h3 className={styles.title}>Aircraft by Phase</h3>

      <div className={styles.list}>
        {distribution.map((item) => {
          const percentage = total > 0 ? (item.count / total) * 100 : 0;
          const color = getPhaseColor(item.phase);

          return (
            <div key={item.phase} className={styles.item}>
              <div className={styles.itemHeader}>
                <div className={styles.label}>
                  <div
                    className={styles.dot}
                    style={{ backgroundColor: color }}
                  />
                  <span className={styles.phaseName}>{item.phase}</span>
                </div>
                <span className={styles.count}>{item.count}</span>
              </div>
              <div className={styles.bar}>
                <div
                  className={styles.barFill}
                  style={{
                    width: `${percentage}%`,
                    color,
                    backgroundImage: `linear-gradient(90deg, ${color}, ${color})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
