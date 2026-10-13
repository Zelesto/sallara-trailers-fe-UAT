// src/utils/exportTable.js
//
// Dependency-free table export: CSV, Excel (.xlsx) and PDF (browser print -> "Save as PDF").
// Reusable for any table: pass `columns` and `rows`.
//
// Column definition:
//   {
//     header: 'Trip #',                 // column title
//     value:  (row) => row.tripNumber,  // cell value
//     type:   'text' | 'number',        // default 'text'; numbers are real numeric cells in Excel
//     decimals: 2,                      // optional, number display in CSV/PDF and Excel format
//     width:  14,                       // optional Excel column width (characters)
//   }

/* ============================================================
   Value helpers
   ============================================================ */

const cellValue = (col, row) => {
  try {
    const v = col.value(row);
    return v === undefined ? null : v;
  } catch {
    return null;
  }
};

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = typeof v === 'number' ? v : Number(String(v).replace(/\s/g, ''));
  return Number.isFinite(n) ? n : null;
};

const formatNumber = (n, decimals) =>
  decimals === undefined || decimals === null ? String(n) : n.toFixed(decimals);

/** Plain-text representation used by CSV and PDF. */
const displayText = (col, row) => {
  const v = cellValue(col, row);
  if (v === null) return '';
  if (col.type === 'number') {
    const n = toNumber(v);
    return n === null ? String(v) : formatNumber(n, col.decimals);
  }
  return String(v);
};

/* ============================================================
   CSV
   ============================================================ */

// Cells starting with these characters can be executed as formulas by Excel (CSV injection).
const FORMULA_START = /^[=+\-@\t\r]/;

const csvEscape = (text, isNumber) => {
  let s = text;
  if (!isNumber && FORMULA_START.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
};

export const buildCsv = (columns, rows) => {
  const lines = [columns.map((c) => csvEscape(String(c.header ?? ''), false)).join(',')];
  for (const row of rows) {
    lines.push(
      columns
        .map((c) => {
          const text = displayText(c, row);
          const isNumber = c.type === 'number' && toNumber(cellValue(c, row)) !== null;
          return csvEscape(text, isNumber);
        })
        .join(',')
    );
  }
  // BOM so Excel opens UTF-8 correctly; CRLF per RFC 4180
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
};

/* ============================================================
   XLSX (Office Open XML, stored ZIP - no dependencies)
   ============================================================ */

// XML 1.0 forbids most control characters
// eslint-disable-next-line no-control-regex
const INVALID_XML = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g;

const xmlEscape = (s) =>
  String(s)
    .replace(INVALID_XML, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const colLetter = (index) => {
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const safeSheetName = (name) =>
  (String(name || 'Sheet1').replace(/[[\]:*?/\\]/g, ' ').replace(/^'+|'+$/g, '').trim() || 'Sheet1').slice(0, 31);

// Style indexes defined in styles.xml below
const STYLE_HEADER = 1;
const STYLE_INT = 2; // #,##0
const STYLE_DEC = 3; // #,##0.00

const buildSheetXml = (columns, rows) => {
  const lastCol = colLetter(Math.max(columns.length - 1, 0));
  const lastRow = rows.length + 1;

  const cols = columns
    .map((c, i) => {
      const w = c.width || Math.min(Math.max(String(c.header ?? '').length + 2, 10), 50);
      return `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`;
    })
    .join('');

  const header =
    `<row r="1">` +
    columns
      .map((c, i) => `<c r="${colLetter(i)}1" t="inlineStr" s="${STYLE_HEADER}"><is><t>${xmlEscape(c.header ?? '')}</t></is></c>`)
      .join('') +
    `</row>`;

  const body = rows
    .map((row, r) => {
      const rowNum = r + 2;
      const cells = columns
        .map((c, i) => {
          const ref = `${colLetter(i)}${rowNum}`;
          const v = cellValue(c, row);
          if (v === null || v === '') return '';
          if (c.type === 'number') {
            const n = toNumber(v);
            if (n !== null) {
              const style = c.decimals && c.decimals > 0 ? STYLE_DEC : STYLE_INT;
              return `<c r="${ref}" s="${style}"><v>${n}</v></c>`;
            }
          }
          return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(v)}</t></is></c>`;
        })
        .join('');
      return `<row r="${rowNum}">${cells}</row>`;
    })
    .join('');

  return (
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
    `<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
    `<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>` +
    `<sheetFormatPr defaultRowHeight="15"/>` +
    (cols ? `<cols>${cols}</cols>` : '') +
    `<sheetData>${header}${body}</sheetData>` +
    (columns.length ? `<autoFilter ref="A1:${lastCol}${lastRow}"/>` : '') +
    `</worksheet>`
  );
};

const STYLES_XML =
  `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
  `<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">` +
  `<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>` +
  `<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>` +
  `<fill><patternFill patternType="solid"><fgColor rgb="FFE5E7EB"/><bgColor indexed="64"/></patternFill></fill></fills>` +
  `<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>` +
  `<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>` +
  `<cellXfs count="4">` +
  `<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>` +
  `<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>` +
  `<xf numFmtId="3" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>` +
  `</cellXfs>` +
  `<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>` +
  `</styleSheet>`;

// --- minimal ZIP (method 0 = stored) ---

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

const crc32 = (bytes) => {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const zipStore = (files) => {
  const enc = new TextEncoder();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | Math.floor(now.getSeconds() / 2);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  const chunks = [];
  const central = [];
  let offset = 0;

  for (const f of files) {
    const name = enc.encode(f.name);
    const data = typeof f.data === 'string' ? enc.encode(f.data) : f.data;
    const crc = crc32(data);

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true); // UTF-8 names
    lh.setUint16(8, 0, true); // stored
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, data.length, true);
    lh.setUint32(22, data.length, true);
    lh.setUint16(26, name.length, true);
    lh.setUint16(28, 0, true);
    chunks.push(new Uint8Array(lh.buffer), name, data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, data.length, true);
    ch.setUint32(24, data.length, true);
    ch.setUint16(28, name.length, true);
    ch.setUint16(30, 0, true);
    ch.setUint16(32, 0, true);
    ch.setUint16(34, 0, true);
    ch.setUint16(36, 0, true);
    ch.setUint32(38, 0, true);
    ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);

    offset += 30 + name.length + data.length;
  }

  const cdSize = central.reduce((s, c) => s + c.length, 0);
  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, files.length, true);
  eocd.setUint16(10, files.length, true);
  eocd.setUint32(12, cdSize, true);
  eocd.setUint32(16, offset, true);
  eocd.setUint16(20, 0, true);

  const all = [...chunks, ...central, new Uint8Array(eocd.buffer)];
  const out = new Uint8Array(all.reduce((s, c) => s + c.length, 0));
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
};

/** Returns the .xlsx file as bytes (Uint8Array). */
export const buildXlsx = (columns, rows, sheetName = 'Sheet1') => {
  const sheet = xmlEscape(safeSheetName(sheetName));
  return zipStore([
    {
      name: '[Content_Types].xml',
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
        `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
        `<Default Extension="xml" ContentType="application/xml"/>` +
        `<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>` +
        `<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>` +
        `<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>` +
        `</Types>`,
    },
    {
      name: '_rels/.rels',
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>` +
        `</Relationships>`,
    },
    {
      name: 'xl/workbook.xml',
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">` +
        `<sheets><sheet name="${sheet}" sheetId="1" r:id="rId1"/></sheets>` +
        `<definedNames><definedName name="_xlnm._FilterDatabase" localSheetId="0" hidden="1">'${sheet.replace(/'/g, "''")}'!$A$1:$${colLetter(Math.max(columns.length - 1, 0))}$${rows.length + 1}</definedName></definedNames>` +
        `</workbook>`,
    },
    {
      name: 'xl/_rels/workbook.xml.rels',
      data:
        `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
        `<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>` +
        `<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>` +
        `</Relationships>`,
    },
    { name: 'xl/worksheets/sheet1.xml', data: buildSheetXml(columns, rows) },
    { name: 'xl/styles.xml', data: STYLES_XML },
  ]);
};

/* ============================================================
   PDF (print view)
   ============================================================ */

const htmlEscape = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const buildPrintHtml = (title, columns, rows, subtitle = '') => {
  const head = columns.map((c) => `<th>${htmlEscape(c.header ?? '')}</th>`).join('');
  const body = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td class="${c.type === 'number' ? 'num' : ''}">${htmlEscape(displayText(c, row))}</td>`)
          .join('')}</tr>`
    )
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${htmlEscape(title)}</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #111; }
  h1 { font-size: 14px; margin: 0 0 2px; }
  .sub { color: #555; margin-bottom: 8px; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 3px 4px; text-align: left; vertical-align: top; }
  th { background: #e5e7eb; }
  td.num { text-align: right; white-space: nowrap; }
  thead { display: table-header-group; }
  tr { page-break-inside: avoid; }
</style></head><body>
<h1>${htmlEscape(title)}</h1><div class="sub">${htmlEscape(subtitle)}</div>
<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>
</body></html>`;
};

/* ============================================================
   Browser helpers
   ============================================================ */

export const timestampedFileName = (base, ext) => {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
  const safe = String(base || 'export').replace(/[^\w-]+/g, '_');
  return `${safe}_${stamp}.${ext}`;
};

export const downloadBlob = (blob, fileName) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportCsv = (fileBase, columns, rows) =>
  downloadBlob(new Blob([buildCsv(columns, rows)], { type: 'text/csv;charset=utf-8' }), timestampedFileName(fileBase, 'csv'));

export const exportXlsx = (fileBase, columns, rows, sheetName) =>
  downloadBlob(
    new Blob([buildXlsx(columns, rows, sheetName)], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    timestampedFileName(fileBase, 'xlsx')
  );

/**
 * Writes the print view into a window opened BEFORE any await (so popup blockers allow it)
 * and opens the print dialog; the user chooses "Save as PDF".
 */
export const printToPdf = (win, title, columns, rows, subtitle) => {
  win.document.open();
  win.document.write(buildPrintHtml(title, columns, rows, subtitle));
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
};
