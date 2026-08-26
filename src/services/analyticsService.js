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

// Helper to format relative time
const formatRelativeTime = (dateString) => {
  if (!dateString) return 'Recently';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)} days ago`;
    return date.toLocaleDateString('en-ZA');
  } catch (e) {
    return 'Recently';
  }
};

// Helper function to calculate days between two dates
const calculateDaysBetween = (startDate, endDate) => {
  if (!startDate || !endDate) return 30;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays || 30;
};

export const analyticsService = {

  checkAuth: async () => {
    try {
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Auth token exists:', !!token);
      console.log('🔑 Token preview:', token?.substring(0, 20) + '...');
      
      const response = await api.get('/analytics/test-simple');
      console.log('✅ Auth test response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Auth test failed:', error.response?.status, error.message);
      throw error;
    }
  },

  /**
   * Get comprehensive dashboard KPIs
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   */
  getDashboardKPIs: async (startDate, endDate) => {
    try {
      const queryString = buildQuery({ startDate, endDate });
      const url = `/analytics/dashboard${queryString ? `?${queryString}` : ''}`;
      
      console.log('📊 Fetching dashboard KPIs:', url);
      const response = await api.get(url);
      
      // Handle both response.data and direct response
      const data = response.data || response;
      
      if (!data) {
        throw new Error('No data received from server');
      }
      
      console.log('✅ Dashboard data received:', data);
      
      // ============================================================
      // EXTRACT DATA FROM BACKEND RESPONSE
      // ============================================================
      
      // Summary data
      const summary = data.summary || {};
      
      // Vehicle stats - these come directly from the backend
      const vehicleStats = data.vehicleStats || {
        activeVehicles: 0,
        vehiclesInTrip: 0,
        vehiclesNotAvailable: 0,
        totalVehicles: 0,
        plannedKm: 0,
        travelledKm: 0,
      };
      
      // Driver stats - these come directly from the backend
      const driverStats = data.driverStats || {
        activeDrivers: 0,
        driversInTrip: 0,
        driversNotAvailable: 0,
        plannedDrivers: 0,
        totalDrivers: 0,
        totalTrips: 0,
      };
      
      // Fuel stats - these come directly from the backend
      const fuelStats = data.fuelStats || {
        totalKm: 0,
        totalFuel: 0,
        totalFuelCost: 0,
        avgEfficiency: 0,
        avgCostPerKm: 0,
        vehicleEfficiency: {},
        driverEfficiency: {},
      };
      
      // Distance stats - these come directly from the backend
      const distanceStats = data.distanceStats || {
        totalKm: 0,
        totalTrips: 0,
        completedTrips: 0,
        avgKmPerTrip: 0,
      };
      
      // Vehicle KPIs
      const vehicleKpis = Array.isArray(data.vehicleKpis) ? data.vehicleKpis : [];
      
      // Driver KPIs
      const driverKpis = Array.isArray(data.driverKpis) ? data.driverKpis : [];
      
      // Top drivers
      const topDrivers = Array.isArray(data.topDrivers) ? data.topDrivers : [];
      
      // Most efficient vehicle
      const mostEfficientVehicle = data.mostEfficientVehicle || {
        registration: 'N/A',
        efficiency: 0,
      };
      
      // Top driver
      const topDriver = data.topDriver || {
        name: 'N/A',
        profit: 0,
        tripsCompleted: 0,
      };
      
      // Recent activities - generate from available data if not provided
      let recentActivities = data.recentActivities || [];
      if (recentActivities.length === 0) {
        recentActivities = generateRecentActivities(vehicleStats, driverStats, fuelStats, topDrivers);
      }
      
      // ============================================================
      // BUILD THE RESPONSE
      // ============================================================
      
      return {
        success: true,
        timestamp: data.timestamp || new Date().toISOString(),
        period: data.period || {
          startDate: startDate || 'N/A',
          endDate: endDate || 'N/A',
          days: calculateDaysBetween(startDate, endDate),
        },
        
        // Summary data
        summary: {
          totalVehicles: summary.totalVehicles || 0,
          totalDrivers: summary.totalDrivers || 0,
          totalTrips: summary.totalTrips || 0,
          completedTrips: summary.completedTrips || 0,
          totalKm: summary.totalKm || 0,
          totalFuelLiters: summary.totalFuelLiters || 0,
          totalFuelCost: summary.totalFuelCost || 0,
          totalRevenue: summary.totalRevenue || 0,
          totalProfit: summary.totalProfit || 0,
          avgFuelEfficiency: summary.avgFuelEfficiency || 0,
          avgCostPerKm: summary.avgCostPerKm || 0,
        },
        
        // Vehicle stats - directly from backend
        vehicleStats: vehicleStats,
        
        // Driver stats - directly from backend
        driverStats: driverStats,
        
        // Fuel stats - directly from backend
        fuelStats: fuelStats,
        
        // Distance stats - directly from backend
        distanceStats: distanceStats,
        
        // Vehicle KPIs
        vehicleKpis: vehicleKpis,
        
        // Driver KPIs
        driverKpis: driverKpis,
        
        // Top drivers
        topDrivers: topDrivers,
        
        // Most efficient vehicle
        mostEfficientVehicle: mostEfficientVehicle,
        
        // Top driver
        topDriver: topDriver,
        
        // Recent activities
        recentActivities: recentActivities,
      };
      
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      if (error.response) {
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        throw new Error('No response from server. Please check your connection.');
      } else {
        throw new Error(error.message || 'Failed to fetch dashboard data');
      }
    }
  },

  /**
   * Get vehicle analytics
   * @param {string} from - YYYY-MM-DD
   * @param {string} to - YYYY-MM-DD
   * @param {string} sortBy - Sort field
   * @param {string} order - asc/desc
   */
  getVehicleAnalytics: async (from, to, sortBy = 'efficiency', order = 'desc') => {
    try {
      const params = { from, to, sortBy, order };
      const queryString = buildQuery(params);
      const url = `/analytics/vehicles${queryString ? `?${queryString}` : ''}`;
      
      console.log('🚛 Fetching vehicle analytics:', url);
      const response = await api.get(url);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching vehicle analytics:', error);
      throw error;
    }
  },

  /**
   * Get driver analytics
   * @param {string} from - YYYY-MM-DD
   * @param {string} to - YYYY-MM-DD
   * @param {string} sortBy - Sort field
   * @param {string} order - asc/desc
   */
  getDriverAnalytics: async (from, to, sortBy = 'profit', order = 'desc') => {
    try {
      const params = { from, to, sortBy, order };
      const queryString = buildQuery(params);
      const url = `/analytics/drivers${queryString ? `?${queryString}` : ''}`;
      
      console.log('👤 Fetching driver analytics:', url);
      const response = await api.get(url);
      
      if (!response.data) {
        throw new Error('No data received from server');
      }
      
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching driver analytics:', error);
      throw error;
    }
  },

  /**
   * Get system status
   */
  getStatus: async () => {
    try {
      const response = await api.get('/analytics/status');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching analytics status:', error);
      throw error;
    }
  },

  /**
   * Debug authentication
   */
  debugAuth: async () => {
    try {
      const response = await api.get('/analytics/debug/auth');
      return response.data;
    } catch (error) {
      console.error('❌ Auth debug failed:', error);
      throw error;
    }
  },

  /**
   * Simple test endpoint
   */
  testSimple: async () => {
    try {
      const response = await api.get('/analytics/test-simple');
      return response.data;
    } catch (error) {
      console.error('❌ Test endpoint failed:', error);
      throw error;
    }
  }
};

// ============================================================
// HELPER: Generate recent activities
// ============================================================
function generateRecentActivities(vehicleStats, driverStats, fuelStats, topDrivers) {
  const activities = [];
  
  // Vehicle activity
  if (vehicleStats.activeVehicles > 0) {
    activities.push({
      type: 'vehicle',
      message: `${vehicleStats.activeVehicles} active vehicles, ${vehicleStats.vehiclesInTrip || 0} in trip`,
      vehicle: 'Fleet',
      time: 'Today',
      status: 'info',
    });
  }
  
  // Driver activity
  if (driverStats.activeDrivers > 0) {
    activities.push({
      type: 'driver',
      message: `${driverStats.activeDrivers} active drivers, ${driverStats.driversInTrip || 0} in trip`,
      vehicle: 'Fleet',
      time: 'Today',
      status: 'info',
    });
  }
  
  // Fuel activity
  if (fuelStats.totalFuelCost > 0) {
    activities.push({
      type: 'fuel',
      message: `Total fuel cost: ${formatCurrency(fuelStats.totalFuelCost)}`,
      vehicle: 'All Vehicles',
      time: 'This period',
      status: 'info',
    });
  }
  
  // Top driver activity
  if (topDrivers && topDrivers.length > 0) {
    const top = topDrivers[0];
    activities.push({
      type: 'driver',
      message: `${top.name || 'Top driver'} has completed ${top.tripsCompleted || 0} trips`,
      vehicle: 'Fleet',
      time: 'This period',
      status: 'success',
    });
  }
  
  // Default activity if nothing else
  if (activities.length === 0) {
    activities.push({
      type: 'info',
      message: 'System is operational',
      vehicle: 'Fleet',
      time: 'Just now',
      status: 'info',
    });
  }
  
  return activities;
}

// Helper function for currency formatting
function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'R 0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount);
}
