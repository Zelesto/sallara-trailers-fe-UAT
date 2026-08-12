// src/pages/TripForm.jsx
import React, { useState, useEffect, useMemo } from 'react';
import BaseForm from '../components/base/BaseForm';
import { tripService } from '../services/tripService';
import { enumService } from '../services/enumService';

function TripForm({ open, onClose, mode, initialData, onSuccess, fetchTrips }) {
  const [loadingEnums, setLoadingEnums] = useState(true);
  const [tripStatuses, setTripStatuses] = useState([]);
  const [tripTypes, setTripTypes] = useState([]);
  const [approvalStatuses, setApprovalStatuses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  // Load enums when form opens
  useEffect(() => {
    if (open) {
      loadEnums();
    }
  }, [open]);

  const loadEnums = async () => {
    setLoadingEnums(true);
    try {
      // Load all enums in parallel
      const [
        statuses,
        types,
        approvals,
        vehicleData,
        driverData,
        supervisorData
      ] = await Promise.all([
        enumService.getEnums('trip', 'status'),
        enumService.getEnums('trip', 'type'),
        enumService.getEnums('trip', 'approval'),
        // These would come from their respective services
        // For now, we'll use empty arrays or fetch from vehicle/driver services
        Promise.resolve([]), // Replace with vehicleService.getVehicles()
        Promise.resolve([]), // Replace with driverService.getDrivers()
        Promise.resolve([]), // Replace with userService.getSupervisors()
      ]);

      setTripStatuses(statuses);
      setTripTypes(types);
      setApprovalStatuses(approvals);
      setVehicles(vehicleData);
      setDrivers(driverData);
      setSupervisors(supervisorData);
    } catch (error) {
      console.error('Failed to load enums:', error);
      // Set empty arrays as fallback
      setTripStatuses([]);
      setTripTypes([]);
      setApprovalStatuses([]);
      setVehicles([]);
      setDrivers([]);
      setSupervisors([]);
    } finally {
      setLoadingEnums(false);
    }
  };

  // Helper function to map enum data to options
  const mapToOptions = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      value: item.code || item.id,
      label: item.displayName || item.name || item.code,
      ...item
    }));
  };

  // Helper function to map entity data to options (for vehicles, drivers, etc.)
  const mapEntityToOptions = (items, labelKey = 'name', valueKey = 'id') => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      value: item[valueKey],
      label: item[labelKey] || item.name || item.id,
      ...item
    }));
  };

  // Build form sections with dynamic enum data
  const sections = useMemo(() => {
    const statusOptions = mapToOptions(tripStatuses);
    const typeOptions = mapToOptions(tripTypes);
    const approvalOptions = mapToOptions(approvalStatuses);
    const vehicleOptions = mapEntityToOptions(vehicles, 'registrationNumber', 'id');
    const driverOptions = mapEntityToOptions(drivers, 'fullName', 'id');
    const supervisorOptions = mapEntityToOptions(supervisors, 'fullName', 'id');

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
            loading: loadingEnums
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
            size: 4,
            options: vehicleOptions,
            loading: loadingEnums
          },
          {
            name: 'driverId',
            label: 'Driver',
            type: 'select',
            required: true,
            size: 4,
            options: driverOptions,
            loading: loadingEnums
          },
          {
            name: 'supervisorId',
            label: 'Supervisor',
            type: 'select',
            size: 4,
            options: supervisorOptions,
            loading: loadingEnums
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
            loading: loadingEnums
          },
          {
            name: 'approvalStatus',
            label: 'Approval Status',
            type: 'select',
            required: true,
            size: 6,
            options: approvalOptions,
            loading: loadingEnums
          }
        ]
      }
    ];
  }, [
    tripStatuses,
    tripTypes,
    approvalStatuses,
    vehicles,
    drivers,
    supervisors,
    loadingEnums
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
      loading={loadingEnums}
    />
  );
}

export default TripForm;
