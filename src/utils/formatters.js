// Date formatting
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Currency formatting
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0);
};

// Number formatting
export const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US').format(number || 0);
};

// Distance formatting
export const formatDistance = (distanceInKm) => {
  return `${formatNumber(distanceInKm)} km`;
};

// Fuel efficiency formatting
export const formatFuelEfficiency = (efficiency) => {
  return `${efficiency?.toFixed(1) || '0.0'} km/L`;
};

// Time duration formatting
export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};