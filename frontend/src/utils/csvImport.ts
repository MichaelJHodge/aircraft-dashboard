import { AircraftModel, AircraftPhase, CreateAircraftInput } from '../types';

const PHASE_ALIASES: Record<string, AircraftPhase> = {
  MANUFACTURING: AircraftPhase.MANUFACTURING,
  GROUND_TESTING: AircraftPhase.GROUND_TESTING,
  FLIGHT_TESTING: AircraftPhase.FLIGHT_TESTING,
  CERTIFICATION: AircraftPhase.CERTIFICATION,
  READY: AircraftPhase.READY,
  DELIVERED: AircraftPhase.DELIVERED,
};

const MODEL_ALIASES: Record<string, AircraftModel> = {
  ALIA_250: AircraftModel.ALIA_250,
  ALIA_250C: AircraftModel.ALIA_250C,
};

export interface CsvParseError {
  message: string;
}

export type CsvParseResult =
  | {
      ok: true;
      rows: CreateAircraftInput[];
    }
  | {
      ok: false;
      error: CsvParseError;
    };

export function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

export function normalizeModel(value: string): AircraftModel | null {
  if (Object.values(AircraftModel).includes(value as AircraftModel)) {
    return value as AircraftModel;
  }

  const normalized = value.trim().toUpperCase().replace(/-/g, '_');
  return MODEL_ALIASES[normalized] ?? null;
}

export function normalizePhase(value: string): AircraftPhase | null {
  if (Object.values(AircraftPhase).includes(value as AircraftPhase)) {
    return value as AircraftPhase;
  }

  const normalized = value.trim().toUpperCase().replace(/ /g, '_');
  return PHASE_ALIASES[normalized] ?? null;
}

export function parseAircraftCsv(content: string): CsvParseResult {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return {
      ok: false,
      error: { message: 'CSV must include a header and at least one row.' },
    };
  }

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const idx = {
    tailNumber: headers.indexOf('tailnumber'),
    model: headers.indexOf('model'),
    currentPhase: headers.indexOf('currentphase'),
    estimatedDeliveryDate: headers.indexOf('estimateddeliverydate'),
    customerName: headers.indexOf('customername'),
  };

  if (
    idx.tailNumber < 0 ||
    idx.model < 0 ||
    idx.currentPhase < 0 ||
    idx.estimatedDeliveryDate < 0
  ) {
    return {
      ok: false,
      error: {
        message:
          'Missing required CSV headers: tailNumber, model, currentPhase, estimatedDeliveryDate.',
      },
    };
  }

  const rows: CreateAircraftInput[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const cells = parseCsvLine(lines[i]);
    const model = normalizeModel(cells[idx.model] ?? '');
    const phase = normalizePhase(cells[idx.currentPhase] ?? '');
    const tailNumber = (cells[idx.tailNumber] ?? '').trim().toUpperCase();
    const estimatedDeliveryDate = (cells[idx.estimatedDeliveryDate] ?? '').trim();

    if (!tailNumber || !model || !phase || !estimatedDeliveryDate) {
      return {
        ok: false,
        error: { message: `Invalid row ${i + 1}. Check model/phase/date/tailNumber.` },
      };
    }

    rows.push({
      tailNumber,
      model,
      currentPhase: phase,
      estimatedDeliveryDate,
      customerName: idx.customerName >= 0 ? (cells[idx.customerName] ?? '').trim() || null : null,
    });
  }

  return { ok: true, rows };
}
