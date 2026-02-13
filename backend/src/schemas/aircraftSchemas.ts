import { z } from 'zod';
import { AircraftModel, AircraftPhase, CreateAircraftInput } from '../../../shared/types';

const sortByValues = ['estimatedDeliveryDate', 'tailNumber', 'certificationProgress', 'currentPhase'] as const;

export const aircraftListSchema = z.object({
  body: z.object({}),
  params: z.object({}),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(10),
    phase: z.nativeEnum(AircraftPhase).optional(),
    model: z.nativeEnum(AircraftModel).optional(),
    search: z.string().trim().min(1).max(50).optional(),
    sortBy: z.enum(sortByValues).default('estimatedDeliveryDate'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const aircraftIdParamSchema = z.object({
  body: z.object({}),
  query: z.object({}),
  params: z.object({
    id: z.string().min(1),
  }),
});

export const milestoneParamSchema = z.object({
  query: z.object({}),
  body: z.object({
    completed: z.boolean(),
  }),
  params: z.object({
    id: z.string().min(1),
    milestoneId: z.string().min(1),
  }),
});

export const updateAircraftStatusSchema = z.object({
  query: z.object({}),
  params: z.object({
    id: z.string().min(1),
  }),
  body: z.object({
    currentPhase: z.nativeEnum(AircraftPhase),
    estimatedDeliveryDate: z.string().date().optional(),
    customerName: z.string().trim().min(1).max(100).optional().nullable(),
  }),
});

const createAircraftBodyShape = z.object({
  tailNumber: z.string().trim().min(2).max(20),
  model: z.nativeEnum(AircraftModel),
  currentPhase: z.nativeEnum(AircraftPhase),
  estimatedDeliveryDate: z.string().date(),
  customerName: z.string().trim().min(1).max(100).optional().nullable(),
}) satisfies z.ZodType<CreateAircraftInput>;

export const createAircraftSchema = z.object({
  query: z.object({}),
  params: z.object({}),
  body: createAircraftBodyShape,
});

export const bulkImportAircraftSchema = z.object({
  query: z.object({}),
  params: z.object({}),
  body: z.object({
    aircraft: z.array(createAircraftBodyShape).min(1).max(200),
  }),
});
