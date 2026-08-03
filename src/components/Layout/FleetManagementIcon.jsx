// src/components/icons/FleetManagementIcon.jsx
import React from 'react';
import { SvgIcon } from '@mui/material';

const FleetManagementIcon = (props) => (
  <SvgIcon {...props} viewBox="0 0 24 24">
    {/* Steering wheel background */}
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    
    {/* Steering wheel inner ring */}
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    
    {/* Steering wheel spokes */}
    <line x1="12" y1="2" x2="12" y2="9" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="12" y1="15" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="2" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.5"/>
    <line x1="15" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5"/>
    
    {/* Driver silhouette */}
    <circle cx="12" cy="10" r="2" fill="currentColor"/>
    <path d="M9 14c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    
    {/* Dashboard/management icon */}
    <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none"/>
    <circle cx="18" cy="18" r="1" fill="currentColor"/>
  </SvgIcon>
);

export default FleetManagementIcon;
