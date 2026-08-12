// src/pages/TripForm.jsx
import React, { useMemo } from 'react';
import BaseForm from '../components/base/BaseForm';
import { tripService } from '../services/tripService';
import { useEnums } from '../contexts/EnumContext';

function TripForm({ open, onClose, mode, initialData, onSuccess, fetchTrips }) {
  const { 
    enums, 
    loading: enumsLoading,
    getTripTypeOptions,
    getTripStatusOptions,
    getApprovalStatusOptions,
    getDriverOptions,
    getVehicleOptions,
    getSupervisorOptions,
  } = useEnums();

  // Province options
  const provinceOptions = [
    { value: 'Eastern Cape', label: 'Eastern Cape' },
    { value: 'Free State', label: 'Free State' },
    { value: 'Gauteng', label: 'Gauteng' },
    { value: 'KwaZulu-Natal', label: 'KwaZulu-Natal' },
    { value: 'Limpopo', label: 'Limpopo' },
    { value: 'Mpumalanga', label: 'Mpumalanga' },
    { value: 'Northern Cape', label: 'Northern Cape' },
    { value: 'North West', label: 'North West' },
    { value: 'Western Cape', label: 'Western Cape' }
  ];

  const priorityOptions = [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ];

  // Get default planned dates
  const getDefaultPlannedDates = useMemo(() => {
    const now = new Date();
    // Round to nearest hour
    const startDate = new Date(now);
    startDate.setMinutes(0, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setHours(endDate.getHours() + 8);
    
    return {
      plannedStartDate: startDate.toISOString(),
      plannedEndDate: endDate.toISOString()
    };
  }, []);

  // Build form sections with dynamic enum data
  const sections = useMemo(() => {
    if (!open) return [];

    const typeOptions = getTripTypeOptions();
    const statusOptions = getTripStatusOptions();
    const approvalOptions = getApprovalStatusOptions();
    const driverOptions = getDriverOptions();
    const vehicleOptions = getVehicleOptions();
    const supervisorOptions = getSupervisorOptions();

    const isCreate = mode === 'create';

    return [
      {
        title: 'Trip Details',
        fields: [
          {
            name: 'tripType',
            label: 'Trip Type',
            type: 'select',
            required: true,
            size: 6,
            options: typeOptions,
            loading: enumsLoading
          },
          {
            name: 'priority',
            label: 'Priority',
            type: 'select',
            required: true,
            size: 6,
            options: priorityOptions
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
            options: provinceOptions
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
            options: provinceOptions
          }
        ]
      },
      {
        title: 'Planned Schedule',
        subtitle: 'These are the planned/scheduled dates for the trip',
        fields: [
          {
            name: 'plannedStartDate',
            label: 'Planned Start Date',
            type: 'datetime',
            required: true,
            size: 6,
            defaultValue: isCreate ? getDefaultPlannedDates.plannedStartDate : null,
            helperText: 'Scheduled start date & time'
          },
          {
            name: 'plannedEndDate',
            label: 'Planned End Date',
            type: 'datetime',
            size: 6,
            defaultValue: isCreate ? getDefaultPlannedDates.plannedEndDate : null,
            helperText: 'Scheduled end date & time (8 hours after start)'
          }
        ]
      },
      {
        title: 'Actual Schedule',
        subtitle: 'These will be updated when the trip actually starts and ends',
        fields: [
          {
            name: 'actualStartDate',
            label: 'Actual Start Date',
            type: 'datetime',
            size: 6,
            defaultValue: null,
            helperText: 'Will be set when trip starts',
            disabled: mode === 'create' // Disabled on create, can be updated later
          },
          {
            name: 'actualEndDate',
            label: 'Actual End Date',
            type: 'datetime',
            size: 6,
            defaultValue: null,
            helperText: 'Will be set when trip ends',
            disabled: mode === 'create' // Disabled on create, can be updated later
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
            size: 4,
            options: vehicleOptions,
            loading: enumsLoading
          },
          {
            name: 'driverId',
            label: 'Driver',
            type: 'select',
            required: true,
            size: 4,
            options: driverOptions,
            loading: enumsLoading
          },
          {
            name: 'supervisorId',
            label: 'Supervisor',
            type: 'select',
            size: 4,
            options: supervisorOptions,
            loading: enumsLoading
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
            size: 6,
            options: statusOptions,
            loading: enumsLoading
          },
          {
            name: 'approvalStatus',
            label: 'Approval Status',
            type: 'select',
            required: true,
            size: 6,
            options: approvalOptions,
            loading: enumsLoading
          }
        ]
      }
    ];
  }, [
    open,
    mode,
    enumsLoading,
    getDefaultPlannedDates,
    getTripTypeOptions,
    getTripStatusOptions,
    getApprovalStatusOptions,
    getDriverOptions,
    getVehicleOptions,
    getSupervisorOptions
  ]);

  // Handle submit
  const handleSubmit = async (data) => {
    console.log('📤 TripForm - Submitting data:', data);
    if (mode === 'edit') {
      return await tripService.updateTrip(initialData.id, data);
    }
    return await tripService.createTrip(data);
  };

  // Validate form
  const validate = (data) => {
    const errors = {};
    if (!data.originCity) errors.originCity = 'Origin city is required';
    if (!data.destinationCity) errors.destinationCity = 'Destination city is required';
    if (!data.plannedStartDate) errors.plannedStartDate = 'Planned start date is required';
    if (!data.vehicleId) errors.vehicleId = 'Vehicle is required';
    if (!data.driverId) errors.driverId = 'Driver is required';
    if (!data.tripType) errors.tripType = 'Trip type is required';
    if (!data.status) errors.status = 'Status is required';
    if (!data.approvalStatus) errors.approvalStatus = 'Approval status is required';
    return errors;
  };

  // Don't render anything if form is closed
  if (!open) return null;

  return (
    <BaseForm
      open={open}
      onClose={onClose}
      mode={mode}
      initialData={initialData}
      onSubmit={handleSubmit}
      onSuccess={onSuccess}
      validate={validate}
      sections={sections}
      title={mode === 'create' ? 'Create Trip' : 'Edit Trip'}
      submitLabel={mode === 'create' ? 'Create Trip' : 'Update Trip'}
      maxWidth="lg"
      loading={enumsLoading}
    />
  );
}

export default TripForm;
