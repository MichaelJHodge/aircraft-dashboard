import { getProgressBand } from '../src/utils/format';

describe('getProgressBand', () => {
  it('maps thresholds to expected bands', () => {
    expect(getProgressBand(0)).toBe('critical');
    expect(getProgressBand(24)).toBe('critical');
    expect(getProgressBand(25)).toBe('warning');
    expect(getProgressBand(50)).toBe('caution');
    expect(getProgressBand(75)).toBe('good');
    expect(getProgressBand(100)).toBe('complete');
  });

  it('clamps out-of-range values', () => {
    expect(getProgressBand(-10)).toBe('critical');
    expect(getProgressBand(200)).toBe('complete');
  });
});
