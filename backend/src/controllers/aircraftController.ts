import { Request, Response } from 'express';
import { AircraftQuery, BulkImportResult, CreateAircraftInput, UserRole } from '../../../shared/types';
import { aircraftService } from '../services/aircraftService';
import { AppError } from '../utils/AppError';

export class AircraftController {
  async getDashboard(req: Request, res: Response): Promise<void> {
    const summary = await aircraftService.getDashboardSummary({
      role: req.auth?.role ?? UserRole.INTERNAL,
      customerName: req.auth?.customerName,
    });
    res.json(summary);
  }

  async getAllAircraft(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as AircraftQuery;

    const aircraft = await aircraftService.getAllAircraft(query, {
      role: req.auth?.role ?? UserRole.INTERNAL,
      customerName: req.auth?.customerName,
    });

    res.json(aircraft);
  }

  async getAircraftById(req: Request, res: Response): Promise<void> {
    const aircraft = await aircraftService.getAircraftById(req.params.id, {
      role: req.auth?.role ?? UserRole.INTERNAL,
      customerName: req.auth?.customerName,
    });

    res.json(aircraft);
  }

  async getAircraftTimeline(req: Request, res: Response): Promise<void> {
    const timeline = await aircraftService.getAircraftTimeline(req.params.id, {
      role: req.auth?.role ?? UserRole.INTERNAL,
      customerName: req.auth?.customerName,
    });

    res.json(timeline);
  }

  async getAircraftCertifications(req: Request, res: Response): Promise<void> {
    const certifications = await aircraftService.getAircraftCertifications(req.params.id, {
      role: req.auth?.role ?? UserRole.INTERNAL,
      customerName: req.auth?.customerName,
    });

    res.json(certifications);
  }

  async updateAircraftStatus(req: Request, res: Response): Promise<void> {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401);
    }

    const updated = await aircraftService.updateAircraftStatus(req.params.id, req.body, {
      userId: req.auth.userId,
      email: req.auth.email,
      role: req.auth.role,
    });
    res.json(updated);
  }

  async updateMilestone(req: Request, res: Response): Promise<void> {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401);
    }

    const updated = await aircraftService.updateMilestoneCompletion(
      req.params.id,
      req.params.milestoneId,
      req.body.completed,
      {
        userId: req.auth.userId,
        email: req.auth.email,
        role: req.auth.role,
      }
    );

    res.json(updated);
  }

  async createAircraft(req: Request, res: Response): Promise<void> {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401);
    }

    const created = await aircraftService.createAircraft(req.body as CreateAircraftInput, {
      userId: req.auth.userId,
      email: req.auth.email,
      role: req.auth.role,
    });

    res.status(201).json(created);
  }

  async importAircraft(req: Request, res: Response): Promise<void> {
    if (!req.auth) {
      throw new AppError('Unauthorized', 401);
    }

    const result: BulkImportResult = await aircraftService.importAircraft(
      req.body.aircraft as CreateAircraftInput[],
      {
        userId: req.auth.userId,
        email: req.auth.email,
        role: req.auth.role,
      }
    );

    res.status(201).json(result);
  }
}

export const aircraftController = new AircraftController();
