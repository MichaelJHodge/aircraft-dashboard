import React from 'react';
import { Card, Button, ProgressBar } from '../common';
import { CertificationMilestone } from '../../types';
import { formatDate } from '../../utils/format';
import styles from './CertificationChecklist.module.css';

interface CertificationChecklistProps {
  milestones: CertificationMilestone[];
  progress: number;
  canEdit?: boolean;
  isSaving?: boolean;
  onToggleMilestone?: (milestone: CertificationMilestone) => void;
}

export const CertificationChecklist: React.FC<CertificationChecklistProps> = ({
  milestones,
  progress,
  canEdit = false,
  isSaving = false,
  onToggleMilestone,
}) => {
  const completed = milestones.filter((m) => m.completed).length;
  const total = milestones.length;

  return (
    <Card className={styles.container}>
      <div className={styles.header}>
        <div className={styles.progressSummary}>
          <span className={styles.progressText}>
            {completed} of {total} milestones completed
          </span>
          <span className={styles.progressPercent}>{progress}%</span>
        </div>
        <ProgressBar progress={progress} showLabel={false} height={10} />
      </div>

      <div className={styles.milestones}>
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={`${styles.milestone} ${milestone.completed ? styles.completed : styles.pending}`}
          >
            <div className={styles.checkboxWrapper} aria-hidden="true">
              <div className={styles.checkbox}>
                {milestone.completed && <span className={styles.checkmark}>✓</span>}
              </div>
            </div>

            <div className={styles.content}>
              <div className={styles.titleRow}>
                <h4 className={styles.name}>{milestone.name}</h4>
                {milestone.completedDate ? (
                  <span className={styles.date}>{formatDate(milestone.completedDate)}</span>
                ) : null}
              </div>
              <p className={styles.description}>{milestone.description}</p>
              <span className={styles.requiredFor}>Required for: {milestone.requiredFor}</span>
            </div>

            {canEdit && onToggleMilestone ? (
              <Button
                variant="secondary"
                size="small"
                disabled={isSaving}
                onClick={() => onToggleMilestone(milestone)}
                aria-label={`Mark milestone ${milestone.name} as ${
                  milestone.completed ? 'pending' : 'completed'
                }`}
              >
                {milestone.completed ? 'Mark Pending' : 'Mark Complete'}
              </Button>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
};
