import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Aircraft, AircraftQuery, PaginatedResponse } from '../types';

export function useAircraftList(query: AircraftQuery) {
  return useQuery({
    queryKey: ['aircraft-list', query],
    queryFn: () => api.aircraft.getAll(query),
    placeholderData: keepPreviousData,
  });
}

export function useAircraftDetail(id: string) {
  return useQuery({
    queryKey: ['aircraft-detail', id],
    queryFn: () => api.aircraft.getById(id),
    enabled: Boolean(id),
  });
}

export function useUpdateAircraftStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      currentPhase: Aircraft['currentPhase'];
      estimatedDeliveryDate?: string;
      customerName?: string | null;
    }) => api.aircraft.updateStatus(id, payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(['aircraft-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['aircraft-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useToggleMilestone(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ milestoneId, completed }: { milestoneId: string; completed: boolean }) =>
      api.aircraft.updateMilestone(id, milestoneId, { completed }),
    onMutate: async ({ milestoneId, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['aircraft-detail', id] });
      const previous = queryClient.getQueryData<Aircraft>(['aircraft-detail', id]);

      if (previous) {
        const updatedMilestones = previous.certificationMilestones.map((m) =>
          m.id === milestoneId
            ? {
                ...m,
                completed,
                completedDate: completed ? new Date().toISOString().split('T')[0] : undefined,
              }
            : m
        );

        const completedCount = updatedMilestones.filter((m) => m.completed).length;

        queryClient.setQueryData<Aircraft>(['aircraft-detail', id], {
          ...previous,
          certificationMilestones: updatedMilestones,
          certificationProgress: Math.round(
            (completedCount / Math.max(updatedMilestones.length, 1)) * 100
          ),
        });
      }

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['aircraft-detail', id], context.previous);
      }
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['aircraft-detail', id], updated);
      queryClient.invalidateQueries({ queryKey: ['aircraft-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useCreateAircraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      tailNumber: string;
      model: Aircraft['model'];
      currentPhase: Aircraft['currentPhase'];
      estimatedDeliveryDate: string;
      customerName?: string | null;
    }) => api.aircraft.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function useImportAircraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      aircraft: Array<{
        tailNumber: string;
        model: Aircraft['model'];
        currentPhase: Aircraft['currentPhase'];
        estimatedDeliveryDate: string;
        customerName?: string | null;
      }>;
    }) => api.aircraft.importBatch(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aircraft-list'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });
}

export function updateAircraftInListCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updated: Aircraft
): void {
  const cacheEntries = queryClient.getQueriesData<PaginatedResponse<Aircraft>>({
    queryKey: ['aircraft-list'],
  });

  cacheEntries.forEach(([key, value]) => {
    if (!value) return;

    const next = {
      ...value,
      data: value.data.map((aircraft) => (aircraft.id === updated.id ? updated : aircraft)),
    };

    queryClient.setQueryData(key, next);
  });
}
