import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAircraftDetail, useToggleMilestone, useUpdateAircraftStatus } from '../../hooks/useAircraft';
import { AircraftPhase, CertificationMilestone, UserRole } from '../../types';
import { Card, StatusBadge, ProgressBar, Button, Skeleton } from '../common';
import { Timeline } from './Timeline';
import { CertificationChecklist } from './CertificationChecklist';
import { SustainabilityMetrics } from './SustainabilityMetrics';
import { formatDate, formatDateTime } from '../../utils/format';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import styles from './AircraftDetail.module.css';

const DetailSkeleton: React.FC<{ isInternal: boolean }> = ({ isInternal }) => {
  return (
    <div className={styles.container} aria-hidden="true">
      <div className={styles.header}>
        <Skeleton width={170} height={34} />
      </div>

      <Card className={styles.overview}>
        <div className={styles.overviewHeader}>
          <div>
            <Skeleton height={38} width={220} />
            <Skeleton height={18} width={120} className={styles.skeletonSpacingSm} />
          </div>
          <Skeleton height={28} width={140} />
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <Skeleton height={12} width={130} />
            <Skeleton height={12} width="100%" className={styles.skeletonSpacingSm} />
          </div>
          <div className={styles.metaItem}>
            <Skeleton height={12} width={120} />
            <Skeleton height={18} width={150} className={styles.skeletonSpacingSm} />
          </div>
          <div className={styles.metaItem}>
            <Skeleton height={12} width={80} />
            <Skeleton height={18} width={140} className={styles.skeletonSpacingSm} />
          </div>
        </div>
      </Card>

      {isInternal ? (
        <Card className={styles.statusCardSkeleton}>
          <Skeleton height={22} width="min(260px, 100%)" />
          <Skeleton height={14} width="min(520px, 100%)" className={styles.skeletonSpacingSm} />
          <div className={styles.statusFormSkeletonGrid}>
            <Skeleton height={40} width="100%" />
            <Skeleton height={40} width="100%" />
            <Skeleton height={40} width="100%" />
          </div>
          <Skeleton height={38} width={170} className={styles.skeletonSpacingSm} />
        </Card>
      ) : null}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lifecycle Timeline</h2>
        <Timeline stages={[]} loading />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>FAA Certification Milestones</h2>
        <Card>
          <div className={styles.milestoneSkeletonList}>
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className={styles.milestoneSkeletonItem}>
                <Skeleton width={22} height={22} />
                <div className={styles.milestoneSkeletonContent}>
                  <Skeleton width="min(260px, 100%)" height={14} />
                  <Skeleton width="100%" height={12} className={styles.skeletonSpacingXs} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sustainability Impact</h2>
        <Card className={styles.sustainabilitySkeletonCard}>
          <Skeleton height={14} width="min(620px, 100%)" />
          <div className={styles.sustainabilitySkeletonGrid}>
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className={styles.sustainabilitySkeletonItem}>
                <Skeleton width={38} height={38} />
                <div className={styles.sustainabilitySkeletonContent}>
                  <Skeleton width={90} height={12} />
                  <Skeleton width={120} height={22} className={styles.skeletonSpacingXs} />
                  <Skeleton width={140} height={12} className={styles.skeletonSpacingXs} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export const AircraftDetail: React.FC = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { pushToast } = useToast();
  const isInternal = user?.role === UserRole.INTERNAL;

  const { data: aircraft, isLoading, isError, error, refetch } = useAircraftDetail(id);
  const updateStatus = useUpdateAircraftStatus(id);
  const toggleMilestone = useToggleMilestone(id);

  const [phase, setPhase] = useState<AircraftPhase | ''>('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [initialFormState, setInitialFormState] = useState<{
    phase: AircraftPhase;
    deliveryDate: string;
    customerName: string;
  } | null>(null);

  useEffect(() => {
    if (!aircraft) return;
    setPhase(aircraft.currentPhase);
    setDeliveryDate(aircraft.estimatedDeliveryDate);
    const nextCustomerName = aircraft.customerName ?? '';
    setCustomerName(nextCustomerName);
    setInitialFormState({
      phase: aircraft.currentPhase,
      deliveryDate: aircraft.estimatedDeliveryDate,
      customerName: nextCustomerName,
    });
  }, [aircraft]);

  const isDirty = Boolean(
    initialFormState &&
      (phase !== initialFormState.phase ||
        deliveryDate !== initialFormState.deliveryDate ||
        customerName !== initialFormState.customerName)
  );

  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (!isDirty) return;
      event.preventDefault();
      event.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => {
      window.removeEventListener('beforeunload', handler);
    };
  }, [isDirty]);

  const navigateBack = () => {
    if (isDirty) {
      const shouldLeave = window.confirm(
        'You have unsaved lifecycle changes. Leave this page without saving?'
      );
      if (!shouldLeave) return;
    }

    navigate('/aircraft');
  };

  const onToggleMilestone = (milestone: CertificationMilestone) => {
    void toggleMilestone.mutate(
      {
        milestoneId: milestone.id,
        completed: !milestone.completed,
      },
      {
        onSuccess: () => {
          pushToast('success', `Milestone "${milestone.name}" updated.`);
        },
        onError: (err) => {
          pushToast(
            'error',
            err instanceof Error ? err.message : 'Failed to update milestone.'
          );
        },
      }
    );
  };

  const onSubmitStatusUpdate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!phase) return;

    void updateStatus.mutate(
      {
        currentPhase: phase,
        estimatedDeliveryDate: deliveryDate,
        customerName: customerName.trim().length ? customerName.trim() : null,
      },
      {
        onSuccess: (updated) => {
          setInitialFormState({
            phase: updated.currentPhase,
            deliveryDate: updated.estimatedDeliveryDate,
            customerName: updated.customerName ?? '',
          });
          pushToast('success', 'Lifecycle update saved.');
        },
        onError: (err) => {
          pushToast(
            'error',
            err instanceof Error ? err.message : 'Failed to save lifecycle update.'
          );
        },
      }
    );
  };

  if (isLoading && !aircraft) {
    return <DetailSkeleton isInternal={isInternal} />;
  }

  if (isError || !aircraft) {
    return (
      <div className={styles.error} role="alert">
        <p>{error instanceof Error ? error.message : 'Aircraft not found'}</p>
        <div className={styles.errorActions}>
          <Button onClick={() => navigate('/aircraft')}>Back to Aircraft List</Button>
          <Button variant="secondary" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Button variant="ghost" onClick={navigateBack}>
          Back to Aircraft List
        </Button>
      </div>

      <Card className={styles.overview}>
        <div className={styles.overviewHeader}>
          <div>
            <h1 className={styles.tailNumber}>{aircraft.tailNumber}</h1>
            <p className={styles.model}>{aircraft.model}</p>
          </div>
          <StatusBadge status={aircraft.currentPhase} />
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Certification Progress</span>
            <div className={styles.progressWrapper}>
              <ProgressBar
                progress={aircraft.certificationProgress}
                tone="auto"
              />
            </div>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Estimated Delivery</span>
            <span className={styles.metaValue}>{formatDate(aircraft.estimatedDeliveryDate)}</span>
          </div>
          {aircraft.customerName ? (
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Customer</span>
              <span className={styles.metaValue}>{aircraft.customerName}</span>
            </div>
          ) : null}
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Last updated</span>
            <span className={styles.metaValue}>
              {formatDateTime(aircraft.updatedAt)} by {aircraft.lastUpdatedByEmail ?? 'system'}
            </span>
          </div>
        </div>
      </Card>

      {isInternal ? (
        <Card>
          <form className={styles.statusForm} onSubmit={onSubmitStatusUpdate}>
            <h2 className={styles.sectionTitle}>Update Lifecycle State</h2>
            <p className={styles.formDescription}>
              Set the current active phase. Completed phases remain locked with recorded completion dates.
            </p>
            <label>
              Active phase
              <select
                value={phase}
                onChange={(event) => setPhase(event.target.value as AircraftPhase)}
                aria-label="Active phase"
                required
              >
                <option value="">Select phase</option>
                {Object.values(AircraftPhase).map((phaseOption) => (
                  <option key={phaseOption} value={phaseOption}>
                    {phaseOption}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Program target delivery date
              <input
                type="date"
                value={deliveryDate}
                onChange={(event) => setDeliveryDate(event.target.value)}
                aria-label="Program target delivery date"
              />
            </label>

            <label>
              Assigned customer
              <input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                aria-label="Assigned customer"
                placeholder="Optional"
              />
            </label>

            <Button type="submit" disabled={updateStatus.isPending}>
              {updateStatus.isPending ? 'Saving...' : 'Save lifecycle update'}
            </Button>
            {isDirty ? <p className={styles.unsavedHint}>You have unsaved changes.</p> : null}
          </form>
        </Card>
      ) : null}

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Lifecycle Timeline</h2>
        <Timeline stages={aircraft.lifecycleStages} estimatedDeliveryDate={aircraft.estimatedDeliveryDate} />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>FAA Certification Milestones</h2>
        <CertificationChecklist
          milestones={aircraft.certificationMilestones}
          progress={aircraft.certificationProgress}
          canEdit={isInternal}
          isSaving={toggleMilestone.isPending}
          onToggleMilestone={onToggleMilestone}
        />
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sustainability Impact</h2>
        <SustainabilityMetrics metrics={aircraft.sustainabilityMetrics} />
      </div>
    </div>
  );
};
