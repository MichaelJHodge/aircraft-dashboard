import React from 'react';
import { Card, Skeleton } from '../common';
import { LifecycleStage, MilestoneStatus } from '../../types';
import { formatDate, getStatusColor } from '../../utils/format';
import styles from './Timeline.module.css';

interface TimelineProps {
  stages: LifecycleStage[];
  estimatedDeliveryDate?: string;
  loading?: boolean;
}

export const Timeline: React.FC<TimelineProps> = ({
  stages,
  estimatedDeliveryDate,
  loading = false,
}) => {
  const getStatusIcon = (status: MilestoneStatus) => {
    switch (status) {
      case MilestoneStatus.COMPLETED:
        return '✓';
      case MilestoneStatus.IN_PROGRESS:
        return '◐';
      case MilestoneStatus.UPCOMING:
        return '○';
      default:
        return '○';
    }
  };

  if (loading) {
    return (
      <Card className={styles.card}>
        <div className={styles.summaryRow} aria-hidden="true">
          <Skeleton height={14} width={210} />
          <Skeleton height={14} width={160} />
        </div>
        <div className={styles.timeline} aria-hidden="true">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className={styles.stage}>
              <div className={styles.stageLeft}>
                <div className={styles.iconWrapper}>
                  <Skeleton width={32} height={32} className={styles.iconSkeleton} />
                  {idx < 5 ? <Skeleton width={3} height={44} className={styles.connectorSkeleton} /> : null}
                </div>
              </div>
              <div className={styles.stageRight}>
                <Skeleton height={16} width={180} />
                <Skeleton height={12} width={220} className={styles.skeletonLine} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      {estimatedDeliveryDate ? (
        <div className={styles.summaryRow}>
          <span className={styles.summaryLabel}>Program target delivery</span>
          <span className={styles.summaryValue}>{formatDate(estimatedDeliveryDate)}</span>
        </div>
      ) : null}

      <div className={styles.timeline}>
        {stages.map((stage, index) => {
          const color = getStatusColor(stage.status);
          const isLast = index === stages.length - 1;

          return (
            <div key={stage.phase} className={styles.stage}>
              <div className={styles.stageLeft}>
                <div className={styles.iconWrapper}>
                  <div
                    className={styles.icon}
                    style={{
                      backgroundColor: color,
                      color: stage.status === MilestoneStatus.COMPLETED ? '#06111e' : color,
                    }}
                  >
                    {getStatusIcon(stage.status)}
                  </div>
                  {!isLast ? (
                    <div
                      className={styles.connector}
                      style={{
                        backgroundColor:
                          stage.status === MilestoneStatus.COMPLETED ? color : 'var(--border-subtle)',
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div className={styles.stageRight}>
                <div className={styles.stageHeader}>
                  <h4 className={styles.phaseTitle}>{stage.phase}</h4>
                  <span className={styles.statusLabel} style={{ color }}>
                    {stage.status.charAt(0).toUpperCase() + stage.status.slice(1).replace('-', ' ')}
                  </span>
                </div>

                <div className={styles.stageDates}>
                  {stage.startDate ? <span className={styles.date}>Started: {formatDate(stage.startDate)}</span> : null}
                  {stage.completionDate ? (
                    <span className={styles.date}>Completed: {formatDate(stage.completionDate)}</span>
                  ) : null}
                  {stage.progressPercentage !== undefined && stage.status === MilestoneStatus.IN_PROGRESS ? (
                    <span className={styles.progress}>{stage.progressPercentage}% complete</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
