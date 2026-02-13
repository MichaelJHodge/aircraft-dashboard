import { AircraftModel, AircraftPhase } from '../src/types';
import {
  normalizeModel,
  normalizePhase,
  parseAircraftCsv,
  parseCsvLine,
} from '../src/utils/csvImport';

describe('csvImport utilities', () => {
  it('parses quoted csv cells correctly', () => {
    const result = parseCsvLine('N100BA,"ALIA-250, Rev A",Manufacturing,2026-07-01');
    expect(result).toEqual(['N100BA', 'ALIA-250, Rev A', 'Manufacturing', '2026-07-01']);
  });

  it('normalizes model and phase aliases', () => {
    expect(normalizeModel('alia_250')).toBe(AircraftModel.ALIA_250);
    expect(normalizeModel('ALIA-250C')).toBe(AircraftModel.ALIA_250C);
    expect(normalizePhase('ground_testing')).toBe(AircraftPhase.GROUND_TESTING);
    expect(normalizePhase('Ready for Delivery')).toBe(AircraftPhase.READY);
  });

  it('returns rows for a valid CSV payload', () => {
    const csv = [
      'tailNumber,model,currentPhase,estimatedDeliveryDate,customerName',
      'N100BA,ALIA-250,Manufacturing,2026-07-01,Bristow',
      'N101BA,ALIA_250C,Flight Testing,2026-08-15,',
    ].join('\n');

    const result = parseAircraftCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({
      tailNumber: 'N100BA',
      model: AircraftModel.ALIA_250,
      currentPhase: AircraftPhase.MANUFACTURING,
      customerName: 'Bristow',
    });
    expect(result.rows[1]).toMatchObject({
      model: AircraftModel.ALIA_250C,
      currentPhase: AircraftPhase.FLIGHT_TESTING,
      customerName: null,
    });
  });

  it('fails on invalid rows with clear message', () => {
    const csv = [
      'tailNumber,model,currentPhase,estimatedDeliveryDate',
      'N200BA,INVALID,Manufacturing,2026-07-01',
    ].join('\n');

    const result = parseAircraftCsv(csv);
    expect(result.ok).toBe(false);
    if (result.ok) return;

    expect(result.error.message).toContain('Invalid row 2');
  });
});
