// src/pages/TripForm.jsx
import React, { useMemo, useEffect, useState } from 'react';
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

  // Province options (static, could also come from enums)
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

  // Build form sections with dynamic enum data - only when open
  const sections = useMemo(() => {
    // Don't build sections if form is closed
    if (!open) return [];

    const typeOptions = getTripTypeOptions();
    const statusOptions = getTripStatusOptions();
    const approvalOptions = getApprovalStatusOptions();
    const driverOptions = getDriverOptions();
    const vehicleOptions = getVehicleOptions();
    const supervisorOptions = getSupervisorOptions();

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
        title: 'Schedule',
        fields: [
          {
            name: 'plannedStartDate',
            label: 'Start Date',
            type: 'datetime',
            required: true,
            size: 6,
            // Set a default value for new trips
            defaultValue: null
          },
          {
            name: 'plannedEndDate',
            label: 'End Date',
            type: 'datetime',
            size: 6,
            defaultValue: null
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
    enumsLoading,
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
    if (!data.plannedStartDate) errors.plannedStartDate = 'Start date is required';
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
