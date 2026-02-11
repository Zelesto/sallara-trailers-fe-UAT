// src/services/analyticsService.js
import api from './api';

// Helper to build query strings safely
const buildQuery = (paramsObj = {}) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(paramsObj)) {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, value);
    }
  }
  return params.toString();
};

export const analyticsService = {
  getDashboardKPIs: async (startDate, endDate) => {
    try {
      const queryString = buildQuery({ startDate, endDate });
      const url = queryString ? `/api/analytics/dashboard?${queryString}` : '/api/analytics/dashboard';
      
      const response = await api.get(url);
      
      // Ensure we return a consistent structure even if backend returns differently
      return {
        success: true,
        ...response.data,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      
      // Return fallback data if backend fails
      return getFallbackDashboardData(startDate, endDate);
    }
  },

  getVehicleAnalytics: (from, to, sortBy, order) => {
    const params = { from, to, sortBy, order };
    const queryString = buildQuery(params);
    const url = queryString ? `/api/analytics/vehicles?${queryString}` : '/api/analytics/vehicles';
    return api.get(url).then(response => response.data);
  },

  getDriverAnalytics: (from, to, sortBy, order) => {
    const params = { from, to, sortBy, order };
    const queryString = buildQuery(params);
    const url = queryString ? `/api/analytics/drivers?${queryString}` : '/api/analytics/drivers';
    return api.get(url).then(response => response.data);
  },
};

// Fallback data for development/testing
const getFallbackDashboardData = (startDate, endDate) => {
  console.log('Using fallback dashboard data');
  
  const activeVehicles = Math.floor(Math.random() * 20) + 5;
  const activeDrivers = Math.floor(Math.random() * 15) + 3;
  const avgFuelEfficiency = (Math.random() * 4) + 6; // 6-10 km/L
  
  return {
    success: true,
    summary: {
      activeVehicles,
      activeDrivers,
      totalVehicles: activeVehicles + Math.floor(Math.random() * 5),
      totalDrivers: activeDrivers + Math.floor(Math.random() * 3),
      avgFuelEfficiency,
      totalFuelCost: (Math.random() * 50000) + 10000,
      totalKm: (Math.random() * 100000) + 50000,
      totalFuelLiters: (Math.random() * 20000) + 5000,
      costPerKm: (Math.random() * 2) + 1,
      avgTripDistance: (Math.random() * 300) + 50
    },
    period: {
      startDate,
      endDate,
      vehicleTrend: (Math.random() * 20) - 10,
      driverTrend: (Math.random() * 15) - 7,
      efficiencyTrend: (Math.random() * 15) - 5,
      costTrend: (Math.random() * 25) - 12
    },
    topDrivers: [
      { name: 'John Smith', efficiency: 9.2, tripCount: 14, costPerKm: 1.8, rating: 4.8 },
      { name: 'Sarah Johnson', efficiency: 8.9, tripCount: 12, costPerKm: 1.9, rating: 4.7 },
      { name: 'Mike Brown', efficiency: 8.5, tripCount: 16, costPerKm: 2.1, rating: 4.5 },
      { name: 'Lisa Williams', efficiency: 8.3, tripCount: 11, costPerKm: 2.2, rating: 4.4 },
      { name: 'David Miller', efficiency: 8.0, tripCount: 13, costPerKm: 2.3, rating: 4.3 }
    ],
    topVehicles: [
      { registrationNumber: 'ABC-123', kmPerLiter: 9.5, totalKm: 4500, fuelLiters: 474, costPerKm: 1.7 },
      { registrationNumber: 'XYZ-789', kmPerLiter: 9.2, totalKm: 5200, fuelLiters: 565, costPerKm: 1.8 },
      { registrationNumber: 'DEF-456', kmPerLiter: 8.9, totalKm: 3800, fuelLiters: 427, costPerKm: 1.9 },
      { registrationNumber: 'GHI-012', kmPerLiter: 8.5, totalKm: 4200, fuelLiters: 494, costPerKm: 2.0 }
    ],
    recentActivities: [
      { type: 'fuel', message: 'Fuel refill completed', vehicle: 'ABC-123', time: '2 hours ago', status: 'success' },
      { type: 'maintenance', message: 'Maintenance scheduled', vehicle: 'XYZ-789', time: '5 hours ago', status: 'warning' },
      { type: 'trip', message: 'New trip completed', vehicle: 'DEF-456', time: '1 day ago', status: 'info' },
      { type: 'driver', message: 'Driver assigned', vehicle: 'GHI-789', time: '2 days ago', status: 'success' },
      { type: 'inspection', message: 'Vehicle inspection passed', vehicle: 'JKL-012', time: '3 days ago', status: 'success' }
    ],
    timestamp: new Date().toISOString()
  };
};
