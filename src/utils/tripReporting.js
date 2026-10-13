// src/utils/tripReporting.js
//
// Pure (no React / no API) helpers shared by TripReports and TripAnalytics:
//   - reading trip fields consistently (distance, driver, vehicle, dates)
//   - date-range filtering
//   - analytics calculation
//   - report columns (also used for CSV / Excel export)
//   - building an HTML report for the ReportViewer (all values HTML-escaped)

/* ============================================================
   Field readers
   ============================================================ */

const num = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Actual distance travelled (km). 0 if unknown. */
export const tripActualKm = (trip) => {
  if (!trip) return 0;
  const direct = num(trip.totalDistanceKm ?? trip.totalDistance ?? trip.distanceTraveled ?? trip.actualDistanceKm);
  if (direct !== null && direct > 0) return direct;
  const s = num(trip.actualStartOdometer);
  const e = num(trip.actualEndOdometer);
  if (s !== null && e !== null && e > s) return e - s;
  return 0;
};

export const tripPlannedKm = (trip) => {
  const n = num(trip?.plannedDistanceKm);
  return n !== null && n > 0 ? n : 0;
};

export const tripDriverName = (trip) => {
  const d = trip?.driver;
  if (d && typeof d === 'object') {
    const full = [d.firstName, d.lastName].filter(Boolean).join(' ').trim();
    if (full) return full;
    if (d.fullName) return d.fullName;
    if (d.name) return d.name;
  }
  if (typeof d === 'string' && d.trim()) return d;
  return trip?.driverName || trip?.driver_name || '';
};

export const tripVehicleReg = (trip) =>
  trip?.vehicle?.registrationNumber || trip?.vehicleRegistration || trip?.vehicleRegNumber || '';

export const tripCustomerName = (trip) => trip?.customer?.name || trip?.customerName || '';

/** The date a trip is reported under: planned start, else actual start, else created. */
export const tripReportDate = (trip) => trip?.plannedStartDate || trip?.actualStartDate || trip?.createdAt || null;

const toDayKey = (value) => {
  if (!value) return null;
  // 'YYYY-MM-DD...' strings: take the date part directly (no timezone shifting)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Keep trips whose report date falls within [from, to] (inclusive, by calendar day).
 * from / to: 'YYYY-MM-DD' strings, Date, dayjs, or empty for open-ended.
 * When a range is given, trips without any date are excluded.
 */
export const filterTripsByDate = (trips, from, to) => {
  const f = from ? toDayKey(typeof from?.format === 'function' ? from.format('YYYY-MM-DD') : from) : null;
  const t = to ? toDayKey(typeof to?.format === 'function' ? to.format('YYYY-MM-DD') : to) : null;
  if (!f && !t) return [...(trips || [])];
  return (trips || []).filter((trip) => {
    const day = toDayKey(tripReportDate(trip));
    if (!day) return false;
    if (f && day < f) return false;
    if (t && day > t) return false;
    return true;
  });
};

/** Returns an error message if the range is invalid, else null. */
export const validateDateRange = (from, to) => {
  const f = from ? toDayKey(typeof from?.format === 'function' ? from.format('YYYY-MM-DD') : from) : null;
  const t = to ? toDayKey(typeof to?.format === 'function' ? to.format('YYYY-MM-DD') : to) : null;
  if ((from && !f) || (to && !t)) return 'Please enter valid dates.';
  if (f && t && f > t) return '"From" date must be on or before the "To" date.';
  return null;
};

/* ============================================================
   Analytics
   ============================================================ */

const COMPLETED = ['COMPLETED', 'FINALIZED'];
const ACTIVE = ['IN_PROGRESS', 'ACTIVE', 'ON_HOLD'];
const PLANNED = ['DRAFT', 'PLANNED', 'ASSIGNED', 'PENDING'];

// ISO-8601 week (weeks start Monday; week 1 contains the first Thursday)
const isoWeek = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return { year: d.getUTCFullYear(), week: Math.ceil(((d - yearStart) / 86400000 + 1) / 7) };
};

export const EMPTY_ANALYTICS = Object.freeze({
  totalTrips: 0,
  completedTrips: 0,
  cancelledTrips: 0,
  activeTrips: 0,
  plannedTrips: 0,
  totalDistance: 0,
  avgDistance: 0,
  avgDuration: 0,
  totalCost: 0,
  avgCost: 0,
  fuelEfficiency: 0,
  onTimeRate: 0,
  onTimeSample: 0,
  statusDistribution: [],
  weeklyTrends: [],
  topRoutes: [],
  topDrivers: [],
});

/**
 * Calculates dashboard analytics from a list of trips.
 * Rules (documented so the numbers can be checked):
 *  - distance: actual km when known, otherwise planned km
 *  - duration: actualEnd - actualStart, only trips with both and a positive duration
 *  - on-time: actual start no more than 2 hours after planned start (trips with both dates)
 *  - fuel efficiency: litres per 100 km over trips that have BOTH fuel and actual km
 *  - average cost: total cost / number of trips that HAVE a cost (not all trips)
 */
export const computeTripAnalytics = (trips) => {
  const list = Array.isArray(trips) ? trips : [];
  if (list.length === 0) return { ...EMPTY_ANALYTICS };

  const total = list.length;
  const count = (codes) => list.filter((t) => codes.includes(t.status)).length;
  const completed = count(COMPLETED);
  const cancelled = count(['CANCELLED']);
  const active = count(ACTIVE);
  const planned = count(PLANNED);

  let totalDistance = 0;
  let distanceCount = 0;
  let totalDuration = 0;
  let durationCount = 0;
  let onTime = 0;
  let onTimeSample = 0;
  let totalCost = 0;
  let costCount = 0;
  let totalFuel = 0;
  let fuelKm = 0;

  for (const t of list) {
    const actual = tripActualKm(t);
    const dist = actual > 0 ? actual : tripPlannedKm(t);
    if (dist > 0) {
      totalDistance += dist;
      distanceCount += 1;
    }

    if (t.actualStartDate && t.actualEndDate) {
      const hours = (new Date(t.actualEndDate) - new Date(t.actualStartDate)) / 3600000;
      if (Number.isFinite(hours) && hours > 0) {
        totalDuration += hours;
        durationCount += 1;
      }
    }

    if (t.plannedStartDate && t.actualStartDate) {
      const delay = (new Date(t.actualStartDate) - new Date(t.plannedStartDate)) / 3600000;
      if (Number.isFinite(delay)) {
        onTimeSample += 1;
        if (delay <= 2) onTime += 1;
      }
    }

    const cost = num(t.totalCost ?? t.costAmount ?? t.cost);
    if (cost !== null && cost > 0) {
      totalCost += cost;
      costCount += 1;
    }

    const fuel = num(t.fuelUsedLiters ?? t.fuelConsumed);
    if (fuel !== null && fuel > 0 && actual > 0) {
      totalFuel += fuel;
      fuelKm += actual;
    }
  }

  const other = total - completed - active - planned - cancelled;
  const statusDistribution = [
    { label: 'Completed', value: completed },
    { label: 'Active', value: active },
    { label: 'Planned', value: planned },
    { label: 'Cancelled', value: cancelled },
    { label: 'Other', value: other },
  ].filter((x) => x.value > 0);

  // Weekly trend - keyed by ISO year + week so different years do not merge
  const weeks = new Map();
  for (const t of list) {
    const raw = tripReportDate(t);
    if (!raw) continue;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) continue;
    const { year, week } = isoWeek(d);
    const key = `${year}-W${String(week).padStart(2, '0')}`;
    weeks.set(key, (weeks.get(key) || 0) + 1);
  }
  const weeklyTrends = [...weeks.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-8)
    .map(([label, value]) => ({ label, value }));

  const routes = new Map();
  for (const t of list) {
    const key = `${t.originCity || 'Unknown'} → ${t.destinationCity || 'Unknown'}`;
    routes.set(key, (routes.get(key) || 0) + 1);
  }
  const topRoutes = [...routes.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));

  // Drivers - grouped by id when available so two drivers with the same name stay separate
  const drivers = new Map();
  for (const t of list) {
    const name = tripDriverName(t);
    if (!name) continue;
    const id = t.driver?.id ?? t.driverId ?? name;
    const entry = drivers.get(id) || { name, trips: 0, completed: 0, km: 0 };
    entry.trips += 1;
    if (COMPLETED.includes(t.status)) entry.completed += 1;
    entry.km += tripActualKm(t);
    drivers.set(id, entry);
  }
  const topDrivers = [...drivers.values()]
    .sort((a, b) => b.trips - a.trips || b.km - a.km || (a.name < b.name ? -1 : 1))
    .slice(0, 5);

  return {
    totalTrips: total,
    completedTrips: completed,
    cancelledTrips: cancelled,
    activeTrips: active,
    plannedTrips: planned,
    totalDistance,
    avgDistance: distanceCount ? totalDistance / distanceCount : 0,
    avgDuration: durationCount ? totalDuration / durationCount : 0,
    totalCost,
    avgCost: costCount ? totalCost / costCount : 0,
    fuelEfficiency: fuelKm > 0 ? (totalFuel / fuelKm) * 100 : 0,
    onTimeRate: onTimeSample ? (onTime / onTimeSample) * 100 : 0,
    onTimeSample,
    statusDistribution,
    weeklyTrends,
    topRoutes,
    topDrivers,
  };
};

/* ============================================================
   Report columns (shared by the HTML report and CSV / Excel export)
   ============================================================ */

const day = (v) => toDayKey(v) || '';

export const TRIP_REPORT_COLUMNS = [
  { header: 'Trip #', value: (t) => t.tripNumber, width: 14 },
  { header: 'Status', value: (t) => t.status, width: 13 },
  { header: 'Planned Start', value: (t) => day(t.plannedStartDate), width: 12 },
  { header: 'Customer', value: tripCustomerName, width: 22 },
  { header: 'Vehicle', value: tripVehicleReg, width: 12 },
  { header: 'Driver', value: tripDriverName, width: 20 },
  { header: 'Origin', value: (t) => t.originCity || t.originLocation, width: 16 },
  { header: 'Destination', value: (t) => t.destinationCity || t.destinationLocation, width: 16 },
  { header: 'Planned km', value: (t) => tripPlannedKm(t) || null, type: 'number', decimals: 1 },
  { header: 'Actual km', value: (t) => tripActualKm(t) || null, type: 'number', decimals: 1 },
];

/** Summary lines shown at the top of a generated report. */
export const summarizeTrips = (trips) => {
  const a = computeTripAnalytics(trips);
  const actualKm = (trips || []).reduce((s, t) => s + tripActualKm(t), 0);
  return [
    ['Trips', String(a.totalTrips)],
    ['Completed / Finalized', String(a.completedTrips)],
    ['In progress', String(a.activeTrips)],
    ['Planned', String(a.plannedTrips)],
    ['Cancelled', String(a.cancelledTrips)],
    ['Actual distance (km)', actualKm.toFixed(1)],
    ['Average duration (h)', a.avgDuration.toFixed(1)],
    ['On-time starts', a.onTimeSample ? `${a.onTimeRate.toFixed(0)}% of ${a.onTimeSample}` : 'n/a'],
  ];
};

/* ============================================================
   HTML report (for ReportViewer). Every value is escaped.
   ============================================================ */

export const escapeHtml = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const cellText = (col, row) => {
  let v;
  try {
    v = col.value(row);
  } catch {
    v = null;
  }
  if (v === null || v === undefined || v === '') return '';
  if (col.type === 'number') {
    const n = num(v);
    return n === null ? String(v) : n.toFixed(col.decimals ?? 0);
  }
  return String(v);
};

export const buildTripReportHtml = ({ title, subtitle = '', summary = [], columns = TRIP_REPORT_COLUMNS, rows = [] }) => {
  const summaryHtml = summary.length
    ? `<table class="summary">${summary
        .map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`)
        .join('')}</table>`
    : '';
  const head = columns.map((c) => `<th>${escapeHtml(c.header)}</th>`).join('');
  const body = rows.length
    ? rows
        .map(
          (r) =>
            `<tr>${columns
              .map((c) => `<td${c.type === 'number' ? ' class="num"' : ''}>${escapeHtml(cellText(c, r))}</td>`)
              .join('')}</tr>`
        )
        .join('')
    : `<tr><td colspan="${columns.length}" class="empty">No trips match these parameters.</td></tr>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111827; margin: 16px; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  .sub { color: #6B7280; margin-bottom: 12px; }
  table { border-collapse: collapse; }
  table.summary { margin-bottom: 14px; }
  table.summary th { text-align: left; padding: 3px 12px 3px 0; color: #374151; font-weight: 600; }
  table.summary td { padding: 3px 0; }
  table.data { width: 100%; }
  table.data th, table.data td { border: 1px solid #D1D5DB; padding: 4px 6px; text-align: left; vertical-align: top; }
  table.data th { background: #F3F4F6; }
  td.num { text-align: right; white-space: nowrap; }
  td.empty { text-align: center; color: #6B7280; padding: 16px; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="sub">${escapeHtml(subtitle)}</div>
${summaryHtml}
<table class="data"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
};
