import { Router } from 'express';
import { aircraftController } from '../controllers/aircraftController';
import { authenticate } from '../middleware/auth';
import { authorizePermission } from '../middleware/rbac';
import { validate } from '../middleware/validate';
import {
  aircraftIdParamSchema,
  aircraftListSchema,
  bulkImportAircraftSchema,
  createAircraftSchema,
  milestoneParamSchema,
  updateAircraftStatusSchema,
} from '../schemas/aircraftSchemas';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

router.use(authenticate);

router.get(
  '/dashboard',
  authorizePermission('dashboard:read'),
  asyncHandler((req, res) => aircraftController.getDashboard(req, res))
);

router.get(
  '/aircraft',
  authorizePermission('aircraft:list'),
  validate(aircraftListSchema),
  asyncHandler((req, res) => aircraftController.getAllAircraft(req, res))
);

router.post(
  '/aircraft',
  authorizePermission('aircraft:create'),
  validate(createAircraftSchema),
  asyncHandler((req, res) => aircraftController.createAircraft(req, res))
);

router.post(
  '/aircraft/import',
  authorizePermission('aircraft:create'),
  validate(bulkImportAircraftSchema),
  asyncHandler((req, res) => aircraftController.importAircraft(req, res))
);

router.get(
  '/aircraft/:id',
  authorizePermission('aircraft:read'),
  validate(aircraftIdParamSchema),
  asyncHandler((req, res) => aircraftController.getAircraftById(req, res))
);

router.get(
  '/aircraft/:id/timeline',
  authorizePermission('aircraft:read'),
  validate(aircraftIdParamSchema),
  asyncHandler((req, res) => aircraftController.getAircraftTimeline(req, res))
);

router.get(
  '/aircraft/:id/certifications',
  authorizePermission('aircraft:read'),
  validate(aircraftIdParamSchema),
  asyncHandler((req, res) => aircraftController.getAircraftCertifications(req, res))
);

router.patch(
  '/aircraft/:id/status',
  authorizePermission('aircraft:updateStatus'),
  validate(updateAircraftStatusSchema),
  asyncHandler((req, res) => aircraftController.updateAircraftStatus(req, res))
);

router.patch(
  '/aircraft/:id/milestones/:milestoneId',
  authorizePermission('aircraft:updateMilestone'),
  validate(milestoneParamSchema),
  asyncHandler((req, res) => aircraftController.updateMilestone(req, res))
);

export default router;
