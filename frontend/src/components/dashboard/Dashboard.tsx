import React from 'react';
import { SummaryCard } from './SummaryCard';
import { StatusDistribution } from './StatusDistribution';
import styles from './Dashboard.module.css';
import { useDashboard } from '../../hooks/useDashboard';
import { Button, Card, Skeleton } from '../common';

const DashboardSkeleton: React.FC = () => {
  return (
    <div className={styles.dashboard} aria-hidden="true">
      <div className={styles.header}>
        <Skeleton height={36} width="min(360px, 100%)" />
        <Skeleton height={16} width="min(480px, 100%)" className={styles.headerSkeletonLine} />
      </div>

      <div className={styles.summaryGrid}>
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className={styles.summarySkeletonCard}>
            <Skeleton height={14} width={120} />
            <Skeleton height={46} width={90} className={styles.summarySkeletonValue} />
            <Skeleton height={12} width={140} />
          </Card>
        ))}
      </div>

      <div className={styles.distributionSection}>
        <Card>
          <Skeleton height={20} width={180} className={styles.distributionSkeletonTitle} />
          <div className={styles.distributionSkeletonList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={styles.distributionSkeletonRow}>
                <Skeleton height={14} width={160} />
                <Skeleton height={6} width="100%" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { data: summary, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading && !summary) {
    return <DashboardSkeleton />;
  }

  if (isError || !summary) {
    return (
      <div className={styles.error}>
        <p>{error instanceof Error ? error.message : 'Failed to load data'}</p>
        <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Aircraft Program Overview</h1>
        <p className={styles.subtitle}>
          Real-time tracking of aircraft development and certification status
        </p>
      </div>

      <div className={styles.summaryGrid}>
        <SummaryCard
          title="Total Aircraft"
          value={summary.totalAircraft}
          subtitle="Active in program"
          tone="neutral"
        />
        <SummaryCard
          title="Ready for Delivery"
          value={summary.readyForDelivery}
          subtitle="Certified and available"
          tone="nominal"
        />
        <SummaryCard
          title="In Certification"
          value={summary.inCertification}
          subtitle="Undergoing FAA review"
          tone="warning"
        />
        <SummaryCard
          title="In Testing"
          value={summary.inTesting}
          subtitle="Ground and flight testing"
          tone="info"
        />
      </div>

      <div className={styles.distributionSection}>
        <StatusDistribution distribution={summary.statusDistribution} />
      </div>
    </div>
  );
};
