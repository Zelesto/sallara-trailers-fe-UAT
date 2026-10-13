// src/utils/fuelSlipRules.js
//
// Pure helpers for the fuel module (no React, no API) so the rules can be unit-tested
// and are the same on every fuel screen.

/* ============================================================
   Dates
   The backend stores transactionDate as a local date-time (no timezone), the same
   format used by tripService ("YYYY-MM-DDTHH:mm:ss"). The form previously sent
   toISOString() (UTC + "Z"), so every save moved a South African slip 2 hours earlier
   - and a slip near midnight on the 1st could land in the PREVIOUS fuel month.
   ============================================================ */

const pad = (n) => String(n).padStart(2, '0');

const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  // Date-only strings: treat as LOCAL midnight (new Date('2026-10-01') would be UTC midnight)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Value for <input type="datetime-local">: "YYYY-MM-DDTHH:mm" in local time. */
export const toLocalDateTimeInput = (value) => {
  const d = parseDate(value);
  if (!d) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "now" for the datetime-local input (was toISOString().slice(0,16) = UTC, 2 hours behind in SA). */
export const nowLocalInput = (now = new Date()) => toLocalDateTimeInput(now);

/** Local date-time for the backend, without timezone: "YYYY-MM-DDTHH:mm:ss". */
export const toBackendLocalDateTime = (value) => {
  const d = parseDate(value);
  if (!d) return null;
  return `${toLocalDateTimeInput(d)}:${pad(d.getSeconds())}`;
};

/* ============================================================
   Slip numbers / registrations / names
   ============================================================ */

/**
 * FS-YYYYMMDD-HHMMSS-RRR. The old FS-YYYYMMDD-RRR (3 random digits per DAY) had a
 * ~50% chance of a duplicate once about 37 slips were captured on the same day.
 */
export const generateSlipNumber = (now = new Date(), random = Math.random) =>
  `FS-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
  `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-` +
  `${String(Math.floor(random() * 1000)).padStart(3, '0')}`;

/**
 * Registration from what was typed/selected. The old version kept only the FIRST word,
 * so "ABC 123 GP" was saved as "ABC". Now: everything before " - " (the
 * "REG - Make Model" display format), trimmed, upper-case, inner spaces kept.
 */
export const extractRegistrationNumber = (input) => {
  if (!input) return '';
  return String(input).split(' - ')[0].replace(/\s+/g, ' ').trim().toUpperCase();
};

/** For exact matching: case-, space- and dash-insensitive. */
export const normalizeKey = (s) => String(s ?? '').toUpperCase().replace(/[\s-]+/g, '');

/** Exact (normalized) match - the old "includes" match linked "ABC1" to "ABC123GP". */
export const sameKey = (a, b) => {
  const ka = normalizeKey(a);
  return ka !== '' && ka === normalizeKey(b);
};

export const personName = (p) =>
  p?.fullName || [p?.firstName, p?.lastName].filter(Boolean).join(' ').trim() || p?.name || '';

/* ============================================================
   Numbers / validation
   ============================================================ */

/** Strict number: "12abc" and "12,5" are NOT numbers (parseFloat silently made them 12). */
export const strictNumber = (v) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
};

/** Errors for one wizard step (0 = basic, 1 = fuel, 2 = location & payment). */
export const validateFuelStep = (step, f) => {
  const errors = [];
  if (step === 0) {
    if (!f.vehicleManual && !f.vehicleId) errors.push('Vehicle registration is required');
    if (!f.driverManual && !f.driverId) errors.push('Driver name is required');
    if (!f.transactionDate) errors.push('Date is required');
    else {
      const d = parseDate(f.transactionDate);
      if (!d) errors.push('Date is not valid');
      else if (d.getTime() > Date.now() + 5 * 60 * 1000) errors.push('Date cannot be in the future');
    }
  }
  if (step === 1) {
    const q = strictNumber(f.quantity);
    const p = strictNumber(f.unitPrice);
    const o = strictNumber(f.odometerReading);
    if (q === null) errors.push('Quantity is required');
    else if (Number.isNaN(q) || q <= 0) errors.push('Quantity must be a number greater than 0 (use a dot for decimals)');
    if (p === null) errors.push('Unit price is required');
    else if (Number.isNaN(p) || p <= 0) errors.push('Unit price must be a number greater than 0 (use a dot for decimals)');
    if (o === null) errors.push('Odometer reading is required');
    else if (Number.isNaN(o) || o < 0) errors.push('Odometer reading must be a number of 0 or more');
  }
  if (step === 2) {
    if (!String(f.stationName || '').trim()) errors.push('Station name is required');
    if (!String(f.location || '').trim()) errors.push('Location is required');
  }
  return errors;
};

/** All steps at once (used on submit, so a skipped/changed step can't slip through). */
export const validateFuelSlip = (f) => [0, 1, 2].flatMap((s) => validateFuelStep(s, f));

/** Total in Rand, rounded to cents. */
export const fuelTotal = (quantity, unitPrice) => {
  const q = strictNumber(quantity);
  const p = strictNumber(unitPrice);
  if (q === null || p === null || Number.isNaN(q) || Number.isNaN(p)) return 0;
  return Math.round(q * p * 100) / 100;
};

/* ============================================================
   Status / locking
   ============================================================ */

export const fuelSlipStatus = (slip) => {
  if (slip?.verifiedBy) return 'VERIFIED';
  if (slip?.finalized) return 'FINALIZED';
  return 'PENDING';
};

/** Verified or finalized slips are part of the month close and must not be edited or deleted. */
export const isFuelSlipLocked = (slip) => fuelSlipStatus(slip) !== 'PENDING';

export const slipRegistration = (slip) => slip?.vehicleRegNumber || slip?.vehicleRegistration || '';

/* ============================================================
   Category (Trip / Truck / Van)
   Previously decided by HARD-CODED vehicle IDs (VEHICLE_TYPE_OVERRIDES), checked BEFORE
   the vehicle's real type - wrong as soon as IDs differ between UAT and live. Unknown
   vehicles were also assumed to be vans. Now: trip -> TRIP, otherwise the vehicle's real
   type, otherwise UNKNOWN (shown, not guessed).
   ============================================================ */

export const fuelCategory = (slip, vehicleTypes = {}) => {
  if (slip?.tripId) return 'TRIP';
  const raw = (slip?.vehicleId != null && vehicleTypes[slip.vehicleId]) ||
    slip?.vehicleType || slip?.vehicle?.vehicleType || slip?.vehicle?.type || '';
  const t = String(raw).toUpperCase();
  if (t.includes('TRUCK') || t.includes('TRAILER') || t.includes('HORSE') || t.includes('RIGID')) return 'TRUCK';
  if (t.includes('VAN') || t.includes('BAKKIE') || t.includes('CAR') || t.includes('LDV')) return 'VAN';
  return 'UNKNOWN';
};

/* ============================================================
   Period filter
   ============================================================ */

/**
 * { start, end } (Date objects, inclusive) for the period selector.
 * 'custom' end date now includes the WHOLE end day (was midnight UTC -> the last day was lost),
 * and a custom range with only one side set is honoured.
 */
export const periodRange = (period, customStart, customEnd, now = new Date()) => {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  switch (period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case 'week': {
      const s = startOfDay(now);
      s.setDate(s.getDate() - s.getDay());
      return { start: s, end: endOfDay(now) };
    }
    case 'month':
      return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: endOfDay(now) };
    case 'quarter':
      return { start: new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1), end: endOfDay(now) };
    case 'year':
      return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    case 'custom': {
      const s = parseDate(customStart);
      const e = parseDate(customEnd);
      return { start: s ? startOfDay(s) : null, end: e ? endOfDay(e) : null };
    }
    default:
      return { start: null, end: null };
  }
};

export const inPeriod = (slip, range) => {
  if (!range || (!range.start && !range.end)) return true;
  const d = parseDate(slip?.transactionDate || slip?.createdAt);
  if (!d) return false;
  if (range.start && d < range.start) return false;
  if (range.end && d > range.end) return false;
  return true;
};

/* ============================================================
   Export columns (CSV / Excel / PDF)
   ============================================================ */

const num = (v) => {
  const n = strictNumber(v);
  return n === null || Number.isNaN(n) ? null : n;
};

export const buildFuelSlipColumns = ({ tripNumbers = {}, vehicleTypes = {} } = {}) => [
  { header: 'Slip #', value: (s) => s.slipNumber, width: 22 },
  { header: 'Date', value: (s) => (toBackendLocalDateTime(s.transactionDate || s.createdAt) || '').replace('T', ' ').slice(0, 16), width: 16 },
  { header: 'Driver', value: (s) => s.driverName, width: 20 },
  { header: 'Vehicle', value: (s) => slipRegistration(s), width: 14 },
  { header: 'Trip', value: (s) => (s.tripId ? tripNumbers[s.tripId] || `#${s.tripId}` : ''), width: 14 },
  { header: 'Category', value: (s) => fuelCategory(s, vehicleTypes), width: 10 },
  { header: 'Fuel Type', value: (s) => s.fuelType, width: 16 },
  { header: 'Litres', value: (s) => num(s.quantity), type: 'number', decimals: 2 },
  { header: 'Price / L (R)', value: (s) => num(s.unitPrice), type: 'number', decimals: 2 },
  { header: 'Total (R)', value: (s) => num(s.totalAmount), type: 'number', decimals: 2 },
  { header: 'Odometer', value: (s) => num(s.odometerReading), type: 'number', decimals: 0 },
  { header: 'Station', value: (s) => s.stationName, width: 20 },
  { header: 'Location', value: (s) => s.location, width: 20 },
  { header: 'Payment', value: (s) => s.paymentMethod, width: 16 },
  { header: 'Receipt #', value: (s) => s.receiptNumber, width: 14 },
  { header: 'Status', value: (s) => fuelSlipStatus(s), width: 11 },
  { header: 'Verified By', value: (s) => s.verifiedBy, width: 16 },
];
