// src/pages/TripForm.jsx
import React from 'react';
import BaseForm from '../components/base/BaseForm';
import { tripService } from '../services/tripService';
import { enumService } from '../services/enumService';
import { useFormSections } from '../hooks/useFormSections';

function TripForm({ open, onClose, mode, initialData, onSuccess, fetchTrips }) {
  // Define form sections using the hook
  const sections = useFormSections();
  
  // Ensure sections is always an array
  const safeSections = Array.isArray(sections) ? sections : [];

  // Handle submit
  const handleSubmit = async (data) => {
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
      sections={safeSections}
      title={mode === 'create' ? 'Create Trip' : 'Edit Trip'}
      submitLabel={mode === 'create' ? 'Create Trip' : 'Update Trip'}
      maxWidth="lg"
      loading={false}
    />
  );
}

export default TripForm;
