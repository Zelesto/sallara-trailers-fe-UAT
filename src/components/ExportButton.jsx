// src/components/ExportButton.jsx
//
// Reusable "Export" menu (CSV / Excel / PDF) for any table.
//
// Usage:
//   <ExportButton
//     title="Trips"                         // report title + file name base
//     columns={exportColumns}               // see src/utils/exportTable.js
//     fetchRows={async () => rows}          // return ALL rows to export (e.g. all filtered pages)
//     subtitle="Status: In progress"        // optional, shown on the PDF
//     onError={(msg) => showNotification(msg, 'error')}
//     onSuccess={(msg) => showNotification(msg, 'success')}
//   />
import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import {
  FileDownload as ExportIcon,
  Description as CsvIcon,
  GridOn as ExcelIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { exportCsv, exportXlsx, printToPdf } from '../utils/exportTable';

const FORMATS = {
  csv: { label: 'CSV (.csv)', icon: CsvIcon },
  xlsx: { label: 'Excel (.xlsx)', icon: ExcelIcon },
  pdf: { label: 'PDF (print / save)', icon: PdfIcon },
};

export default function ExportButton({
  title = 'Export',
  columns,
  fetchRows,
  subtitle = '',
  formats = ['csv', 'xlsx', 'pdf'],
  onError,
  onSuccess,
  disabled = false,
  size = 'small',
  sx,
}) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [busy, setBusy] = useState(false);

  const reportError = (msg) => {
    if (onError) onError(msg);
    else console.error(msg);
  };

  const handleExport = async (format) => {
    setAnchorEl(null);

    // Open the print window synchronously inside the click, before any await,
    // otherwise browsers block it as a popup.
    let printWin = null;
    if (format === 'pdf') {
      printWin = window.open('', '_blank');
      if (!printWin) {
        reportError('Your browser blocked the PDF window. Allow pop-ups for this site and try again.');
        return;
      }
      printWin.document.write('<p style="font-family:Arial;padding:16px">Preparing export…</p>');
    }

    setBusy(true);
    try {
      const rows = (await fetchRows()) || [];
      if (rows.length === 0) {
        if (printWin) printWin.close();
        reportError('There is nothing to export for the current filters.');
        return;
      }

      if (format === 'csv') exportCsv(title, columns, rows);
      else if (format === 'xlsx') exportXlsx(title, columns, rows, title);
      else if (format === 'pdf') printToPdf(printWin, title, columns, rows, subtitle);

      if (onSuccess) onSuccess(`Exported ${rows.length} row${rows.length === 1 ? '' : 's'}`);
    } catch (err) {
      if (printWin) printWin.close();
      reportError(err?.userMessage || err?.message || 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button
        variant="outlined"
        size={size}
        disabled={disabled || busy}
        onClick={(e) => setAnchorEl(e.currentTarget)}
        startIcon={busy ? <CircularProgress size={14} /> : <ExportIcon sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' } }} />}
        sx={{
          borderRadius: '10px',
          fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.8rem' },
          textTransform: 'none',
          py: { xs: 0.5, sm: 0.75 },
          px: { xs: 1.5, sm: 2 },
          ...sx,
        }}
      >
        {busy ? 'Exporting…' : 'Export'}
      </Button>
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
        {formats.filter((f) => FORMATS[f]).map((f) => {
          const Icon = FORMATS[f].icon;
          return (
            <MenuItem key={f} onClick={() => handleExport(f)} dense>
              <ListItemIcon>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontSize: '0.8rem' }}>{FORMATS[f].label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
