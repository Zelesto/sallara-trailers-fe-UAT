// src/hooks/useFormSections.js
import { useMemo } from 'react';
import { enumService } from '../services/enumService';

export function useFormSections() {
  return useMemo(() => [
    {
      title: 'Trip Details',
      fields: [
        {
          name: 'tripType',
          label: 'Trip Type',
          type: 'select',
          required: true,
          options: [
            { value: 'FREIGHT', label: 'Freight' },
            { value: 'RETURN', label: 'Return' },
            { value: 'EMPTY', label: 'Empty' },
            { value: 'MAINTENANCE', label: 'Maintenance' }
          ]
        },
        {
          name: 'priority',
          label: 'Priority',
          type: 'select',
          required: true,
          options: [
            { value: 'LOW', label: 'Low' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'HIGH', label: 'High' },
            { value: 'URGENT', label: 'Urgent' }
          ]
        }
      ]
    },
    {
      title: 'Origin & Destination',
      fields: [
        {
          name: 'originCity',
          label: 'Origin City',
          type: 'text',
          required: true,
          size: 6
        },
        {
          name: 'originProvince',
          label: 'Origin Province',
          type: 'select',
          required: true,
          size: 6,
          options: [
            { value: 'Eastern Cape', label: 'Eastern Cape' },
            { value: 'Free State', label: 'Free State' },
            { value: 'Gauteng', label: 'Gauteng' },
            // ... more provinces
          ]
        },
        {
          name: 'destinationCity',
          label: 'Destination City',
          type: 'text',
          required: true,
          size: 6
        },
        {
          name: 'destinationProvince',
          label: 'Destination Province',
          type: 'select',
          required: true,
          size: 6,
          options: [
            { value: 'Eastern Cape', label: 'Eastern Cape' },
            { value: 'Free State', label: 'Free State' },
            { value: 'Gauteng', label: 'Gauteng' },
            // ... more provinces
          ]
        }
      ]
    },
    {
      title: 'Schedule',
      fields: [
        {
          name: 'plannedStartDate',
          label: 'Start Date',
          type: 'datetime',
          required: true,
          size: 6
        },
        {
          name: 'plannedEndDate',
          label: 'End Date',
          type: 'datetime',
          size: 6
        }
      ]
    },
    {
      title: 'Assignment',
      fields: [
        {
          name: 'vehicleId',
          label: 'Vehicle',
          type: 'select',
          required: true,
          size: 4
        },
        {
          name: 'driverId',
          label: 'Driver',
          type: 'select',
          required: true,
          size: 4
        },
        {
          name: 'supervisorId',
          label: 'Supervisor',
          type: 'select',
          size: 4
        }
      ]
    },
    {
      title: 'Status',
      fields: [
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          required: true,
          size: 6
        },
        {
          name: 'approvalStatus',
          label: 'Approval Status',
          type: 'select',
          required: true,
          size: 6
        }
      ]
    }
  ], []);
}
