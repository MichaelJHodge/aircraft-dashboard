import { AircraftPhase } from '../../../shared/types';

export const phaseTransitionPolicy: Record<
  AircraftPhase,
  {
    allowedNext: AircraftPhase[];
    minCertificationProgressForNext: number;
  }
> = {
  [AircraftPhase.MANUFACTURING]: {
    allowedNext: [AircraftPhase.MANUFACTURING, AircraftPhase.GROUND_TESTING],
    minCertificationProgressForNext: 40,
  },
  [AircraftPhase.GROUND_TESTING]: {
    allowedNext: [AircraftPhase.GROUND_TESTING, AircraftPhase.FLIGHT_TESTING],
    minCertificationProgressForNext: 55,
  },
  [AircraftPhase.FLIGHT_TESTING]: {
    allowedNext: [AircraftPhase.FLIGHT_TESTING, AircraftPhase.CERTIFICATION],
    minCertificationProgressForNext: 70,
  },
  [AircraftPhase.CERTIFICATION]: {
    allowedNext: [AircraftPhase.CERTIFICATION, AircraftPhase.READY],
    minCertificationProgressForNext: 90,
  },
  [AircraftPhase.READY]: {
    allowedNext: [AircraftPhase.READY, AircraftPhase.DELIVERED],
    minCertificationProgressForNext: 98,
  },
  [AircraftPhase.DELIVERED]: {
    allowedNext: [AircraftPhase.DELIVERED],
    minCertificationProgressForNext: 100,
  },
};

export function isValidPhaseTransition(from: AircraftPhase, to: AircraftPhase): boolean {
  return phaseTransitionPolicy[from].allowedNext.includes(to);
}

export function requiredProgressForTransition(from: AircraftPhase): number {
  return phaseTransitionPolicy[from].minCertificationProgressForNext;
}
