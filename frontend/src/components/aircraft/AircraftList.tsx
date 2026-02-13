import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAircraftList, useCreateAircraft, useImportAircraft } from '../../hooks/useAircraft';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { AircraftModel, AircraftPhase, AircraftQuery, CreateAircraftInput, UserRole } from '../../types';
import { Card, StatusBadge, ProgressBar, Button, Skeleton } from '../common';
import { formatDate } from '../../utils/format';
import { parseAircraftCsv } from '../../utils/csvImport';
import { useAuth } from '../../context/useAuth';
import { useToast } from '../../context/useToast';
import styles from './AircraftList.module.css';

const DEFAULT_QUERY: AircraftQuery = {
  page: 1,
  pageSize: 10,
  sortBy: 'estimatedDeliveryDate',
  sortOrder: 'asc',
};

const TABLE_SKELETON_ROWS = DEFAULT_QUERY.pageSize;

interface CreateFormState {
  tailNumber: string;
  model: AircraftModel;
  currentPhase: AircraftPhase;
  estimatedDeliveryDate: string;
  customerName: string;
}

const INITIAL_CREATE_FORM: CreateFormState = {
  tailNumber: '',
  model: AircraftModel.ALIA_250,
  currentPhase: AircraftPhase.MANUFACTURING,
  estimatedDeliveryDate: '',
  customerName: '',
};

export const AircraftList: React.FC = () => {
  const [query, setQuery] = useState<AircraftQuery>(DEFAULT_QUERY);
  const [searchInput, setSearchInput] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [createForm, setCreateForm] = useState<CreateFormState>(INITIAL_CREATE_FORM);
  const debouncedSearch = useDebouncedValue(searchInput.trim(), 250);

  const { user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } = useAircraftList(query);
  const createAircraft = useCreateAircraft();
  const importAircraft = useImportAircraft();
  const canManageAircraft = user?.role === UserRole.INTERNAL;

  useEffect(() => {
    setQuery((prev) => {
      if ((prev.search ?? '') === debouncedSearch) {
        return prev;
      }

      return {
        ...prev,
        page: 1,
        search: debouncedSearch || undefined,
      };
    });
  }, [debouncedSearch]);

  const aircraft = data?.data ?? [];
  const pagination = data?.pagination;
  const isInitialLoad = isLoading && !data;
  const showResultsSkeleton = isInitialLoad || (isFetching && Boolean(data));

  const updateQuery = (partial: Partial<AircraftQuery>) => {
    setQuery((prev) => ({ ...prev, page: 1, ...partial }));
  };

  const pageCountLabel = useMemo(() => {
    if (!pagination) return '';
    return `Page ${pagination.page} of ${pagination.totalPages}`;
  }, [pagination]);

  const onCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!createForm.estimatedDeliveryDate) {
      pushToast('error', 'Estimated delivery date is required.');
      return;
    }

    const payload: CreateAircraftInput = {
      tailNumber: createForm.tailNumber.trim().toUpperCase(),
      model: createForm.model,
      currentPhase: createForm.currentPhase,
      estimatedDeliveryDate: createForm.estimatedDeliveryDate,
      customerName: createForm.customerName.trim() || null,
    };

    try {
      const created = await createAircraft.mutateAsync(payload);
      pushToast('success', `Aircraft ${created.tailNumber} added.`);
      setCreateForm(INITIAL_CREATE_FORM);
      setShowCreateForm(false);
      setQuery((prev) => ({ ...prev, page: 1 }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create aircraft';
      pushToast('error', message);
    }
  };

  const onCsvImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      const content = await file.text();
      const parsed = parseAircraftCsv(content);
      if (!parsed.ok) {
        pushToast('error', parsed.error.message);
        return;
      }

      const result = await importAircraft.mutateAsync({ aircraft: parsed.rows });
      if (result.failed > 0) {
        const firstError = result.errors[0]?.message ?? 'Unknown import error';
        pushToast(
          'error',
          `Imported ${result.created}/${result.total}. First error: ${firstError}`
        );
      } else {
        pushToast('success', `Imported ${result.created} aircraft from CSV.`);
      }
      setQuery((prev) => ({ ...prev, page: 1 }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import CSV';
      pushToast('error', message);
    }
  };

  if (isError) {
    return (
      <div className={styles.error} role="alert">
        <p>{error instanceof Error ? error.message : 'Failed to load aircraft data'}</p>
        <Button onClick={() => void refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Aircraft Registry</h1>
        <p className={styles.subtitle}>
          {pagination?.total ?? 0} aircraft in active development and production
        </p>
      </div>

      {canManageAircraft ? (
        <Card>
          <div className={styles.adminBar}>
            <div className={styles.adminActions}>
              <Button
                variant="primary"
                onClick={() => setShowCreateForm((prev) => !prev)}
              >
                {showCreateForm ? 'Hide Add Aircraft' : 'Add Aircraft'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => setShowImportPanel((prev) => !prev)}
              >
                {showImportPanel ? 'Hide CSV Import' : 'Import CSV'}
              </Button>
            </div>

            {showImportPanel ? (
              <div className={styles.importPanel}>
                <p className={styles.importHint}>
                  CSV headers: <code>tailNumber,model,currentPhase,estimatedDeliveryDate,customerName</code>
                </p>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => void onCsvImport(e)}
                  aria-label="Import aircraft CSV"
                  disabled={importAircraft.isPending}
                />
              </div>
            ) : null}

            {showCreateForm ? (
              <form className={styles.createForm} onSubmit={(e) => void onCreateSubmit(e)}>
                <label>
                  Tail Number
                  <input
                    required
                    value={createForm.tailNumber}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, tailNumber: e.target.value }))
                    }
                    placeholder="N300BA"
                  />
                </label>

                <label>
                  Model
                  <select
                    value={createForm.model}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        model: e.target.value as AircraftModel,
                      }))
                    }
                  >
                    {Object.values(AircraftModel).map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Current Phase
                  <select
                    value={createForm.currentPhase}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        currentPhase: e.target.value as AircraftPhase,
                      }))
                    }
                  >
                    {Object.values(AircraftPhase).map((phase) => (
                      <option key={phase} value={phase}>
                        {phase}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Est. Delivery Date
                  <input
                    required
                    type="date"
                    value={createForm.estimatedDeliveryDate}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        estimatedDeliveryDate: e.target.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Customer (Optional)
                  <input
                    value={createForm.customerName}
                    onChange={(e) =>
                      setCreateForm((prev) => ({ ...prev, customerName: e.target.value }))
                    }
                    placeholder="Air Methods"
                  />
                </label>

                <div className={styles.createActions}>
                  <Button
                    type="submit"
                    disabled={createAircraft.isPending}
                  >
                    {createAircraft.isPending ? 'Adding...' : 'Save Aircraft'}
                  </Button>
                </div>
              </form>
            ) : null}
          </div>
        </Card>
      ) : null}

      <Card>
        <form className={styles.filters} aria-label="Aircraft list filters" onSubmit={(e) => e.preventDefault()}>
          <label>
            Search
            <input
              type="search"
              value={searchInput}
              placeholder="Tail number or customer"
              onChange={(event) => setSearchInput(event.target.value)}
              aria-label="Search aircraft"
            />
          </label>

          <label>
            Phase
            <select
              value={query.phase ?? ''}
              onChange={(event) =>
                updateQuery({ phase: (event.target.value as AircraftPhase) || undefined })
              }
              aria-label="Filter by phase"
            >
              <option value="">All phases</option>
              {Object.values(AircraftPhase).map((phase) => (
                <option key={phase} value={phase}>
                  {phase}
                </option>
              ))}
            </select>
          </label>

          <label>
            Model
            <select
              value={query.model ?? ''}
              onChange={(event) =>
                updateQuery({ model: (event.target.value as AircraftModel) || undefined })
              }
              aria-label="Filter by model"
            >
              <option value="">All models</option>
              {Object.values(AircraftModel).map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </label>

          <label>
            Sort
            <select
              value={`${query.sortBy}:${query.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(':');
                updateQuery({
                  sortBy: sortBy as AircraftQuery['sortBy'],
                  sortOrder: sortOrder as AircraftQuery['sortOrder'],
                });
              }}
              aria-label="Sort aircraft"
            >
              <option value="estimatedDeliveryDate:asc">Delivery date (soonest)</option>
              <option value="estimatedDeliveryDate:desc">Delivery date (latest)</option>
              <option value="certificationProgress:desc">Certification (highest)</option>
              <option value="tailNumber:asc">Tail number (A-Z)</option>
            </select>
          </label>
        </form>
      </Card>

      <Card className={styles.tableCard}>
        <div className={styles.tableWrapper} aria-busy={isFetching}>
          <table className={styles.table}>
            <caption className={styles.tableCaption}>Aircraft and delivery status</caption>
            <thead>
              <tr>
                <th scope="col">Tail Number</th>
                <th scope="col">Model</th>
                <th scope="col">Current Phase</th>
                <th scope="col">Certification</th>
                <th scope="col">Est. Delivery</th>
                <th scope="col">Customer</th>
              </tr>
            </thead>
            <tbody>
              {showResultsSkeleton
                ? Array.from({ length: TABLE_SKELETON_ROWS }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className={styles.skeletonRow}>
                      <td><Skeleton height={14} width={80} /></td>
                      <td><Skeleton height={14} width={74} /></td>
                      <td><Skeleton height={24} width={130} /></td>
                      <td><Skeleton height={14} width={160} /></td>
                      <td><Skeleton height={14} width={100} /></td>
                      <td><Skeleton height={14} width={120} /></td>
                    </tr>
                  ))
                : aircraft.map((ac) => (
                    <tr
                      key={ac.id}
                      onClick={() => navigate(`/aircraft/${ac.id}`)}
                      className={styles.row}
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          navigate(`/aircraft/${ac.id}`);
                        }
                      }}
                      aria-label={`Open details for ${ac.tailNumber}`}
                    >
                      <td className={styles.tailNumber}>{ac.tailNumber}</td>
                      <td className={styles.model}>{ac.model}</td>
                      <td>
                        <StatusBadge status={ac.currentPhase} size="small" />
                      </td>
                      <td>
                        <div className={styles.progressCell}>
                          <ProgressBar
                            progress={ac.certificationProgress}
                            height={8}
                            showLabel={false}
                            tone="auto"
                          />
                          <span className={styles.progressLabel}>{ac.certificationProgress}%</span>
                        </div>
                      </td>
                      <td className={styles.date}>{formatDate(ac.estimatedDeliveryDate)}</td>
                      <td className={styles.customer}>{ac.customerName || '—'}</td>
                    </tr>
                  ))}
            </tbody>
          </table>

          {!showResultsSkeleton && aircraft.length === 0 ? (
            <p className={styles.empty}>No aircraft match current filters.</p>
          ) : null}
        </div>
      </Card>

      <div className={styles.pagination}>
        <Button
          variant="secondary"
          onClick={() => setQuery((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
          disabled={!pagination || pagination.page <= 1}
        >
          Previous
        </Button>

        <span aria-live="polite" className={styles.pageInfo}>
          {pageCountLabel}
        </span>

        <Button
          variant="secondary"
          onClick={() =>
            setQuery((prev) => ({
              ...prev,
              page: pagination ? Math.min(pagination.totalPages, prev.page + 1) : prev.page,
            }))
          }
          disabled={!pagination || pagination.page >= pagination.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
