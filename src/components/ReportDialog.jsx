// src/components/ReportDialog.jsx
//
// Shows a generated HTML report FULL SCREEN (instead of a side panel).
// The report is rendered inside a sandboxed iframe:
//   - its CSS cannot leak into / break the app layout
//   - scripts inside the report HTML do not run (no "allow-scripts")
// Toolbar: Print / Save as PDF, Download (.html), Close.
import React, { useRef } from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  IconButton,
  Toolbar,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import {
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { downloadBlob, timestampedFileName } from '../utils/exportTable';

export default function ReportDialog({ open, onClose, title = 'Report', html = '', warning = null, reportType = 'report' }) {
  const frameRef = useRef(null);

  const handlePrint = () => {
    const win = frameRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print(); // user can choose "Save as PDF"
  };

  const handleDownload = () => {
    downloadBlob(new Blob([html || ''], { type: 'text/html;charset=utf-8' }), timestampedFileName(title || reportType, 'html'));
  };

  return (
    <Dialog
      open={Boolean(open)}
      onClose={onClose}
      fullScreen
      PaperProps={{ sx: { bgcolor: '#F7F7FC' } }}
    >
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: '#FFFFFF', color: '#111827', borderBottom: '1px solid #ECECEC' }}
      >
        <Toolbar sx={{ minHeight: { xs: 48, sm: 56 }, gap: 1 }}>
          <Typography variant="h6" noWrap sx={{ flex: 1, fontSize: { xs: '0.9rem', sm: '1rem' }, fontWeight: 600 }}>
            {title}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            disabled={!html}
            sx={{ textTransform: 'none', borderRadius: '10px' }}
          >
            Print / PDF
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            disabled={!html}
            sx={{ textTransform: 'none', borderRadius: '10px', display: { xs: 'none', sm: 'inline-flex' } }}
          >
            Download
          </Button>
          <Tooltip title="Close">
            <IconButton onClick={onClose} edge="end" aria-label="Close report">
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

      {warning && (
        <Alert severity="warning" sx={{ m: 2, mb: 0, borderRadius: '10px', fontSize: '0.8rem' }}>
          {warning}
        </Alert>
      )}

      <Box sx={{ flex: 1, p: { xs: 1, sm: 2 }, display: 'flex' }}>
        <Box
          component="iframe"
          ref={frameRef}
          title={title}
          srcDoc={html || '<p style="font-family:Arial;padding:16px">No report content.</p>'}
          // same-origin lets the toolbar call print(); scripts in the report stay disabled
          sandbox="allow-same-origin allow-modals"
          sx={{
            flex: 1,
            width: '100%',
            minHeight: 'calc(100vh - 100px)',
            border: '1px solid #ECECEC',
            borderRadius: '12px',
            bgcolor: '#FFFFFF',
          }}
        />
      </Box>
    </Dialog>
  );
}
