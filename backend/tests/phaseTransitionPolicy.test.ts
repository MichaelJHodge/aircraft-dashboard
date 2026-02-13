import { AircraftPhase } from '../../shared/types';
import {
  isValidPhaseTransition,
  requiredProgressForTransition,
} from '../src/domain/phaseTransitionPolicy';

describe('phase transition policy', () => {
  it('allows only same-phase or next-phase transitions', () => {
    expect(
      isValidPhaseTransition(AircraftPhase.MANUFACTURING, AircraftPhase.GROUND_TESTING)
    ).toBe(true);
    expect(
      isValidPhaseTransition(AircraftPhase.MANUFACTURING, AircraftPhase.CERTIFICATION)
    ).toBe(false);
    expect(
      isValidPhaseTransition(AircraftPhase.CERTIFICATION, AircraftPhase.FLIGHT_TESTING)
    ).toBe(false);
  });

  it('defines progress thresholds for advancing', () => {
    expect(requiredProgressForTransition(AircraftPhase.MANUFACTURING)).toBe(40);
    expect(requiredProgressForTransition(AircraftPhase.READY)).toBe(98);
  });
});
