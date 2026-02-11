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

export const analyticsService = {
  /**
   * Get comprehensive dashboard KPIs
   * @param {string} startDate - YYYY-MM-DD
   * @param {string} endDate - YYYY-MM-DD
   */
  getDashboardKPIs: async (startDate, endDate) => {
    try {
      const queryString = buildQuery({ startDate, endDate });
      const url = `/api/analytics/dashboard${queryString ? `?${queryString}` : ''}`;
      
      console.log('📊 Fetching dashboard KPIs:', url);
      const response = await api.get(url);
      const data = response.data;
      
      if (!data || !data.success) {
        throw new Error(data?.message || 'Invalid response from server');
      }

      console.log('✅ Dashboard data received:', data);

      // Transform backend response to match frontend expectations
      const summary = data.summary || {};
      const vehicleKpis = data.vehicleKpis || [];
      const driverKpis = data.driverKpis || [];
      
      // Calculate derived metrics
      const totalKm = summary.totalKm || 0;
      const totalFuelLiters = summary.totalFuelLiters || 0;
      const totalFuelCost = summary.totalFuelCost || 0;
      const avgFuelEfficiency = totalFuelLiters > 0 ? totalKm / totalFuelLiters : 0;
      const avgTripDistance = driverKpis.length > 0 
        ? driverKpis.reduce((sum, d) => sum + (d.totalKm || 0), 0) / driverKpis.length 
        : 0;
      const costPerKm = totalKm > 0 ? totalFuelCost / totalKm : 0;

      // Process top drivers
      const topDrivers = driverKpis
        .sort((a, b) => (b.profit || 0) - (a.profit || 0))
        .slice(0, 5)
        .map(d => ({
          name: d.driverName || d.driver || 'Unknown Driver',
          efficiency: d.efficiencyScore || 0,
          tripCount: d.tripsCompleted || 0,
          costPerKm: d.costPerKm || 0,
          rating: Math.min(5, Math.floor(((d.efficiencyScore || 0) / 2) + 1)),
          profit: d.profit || 0,
          revenue: d.totalRevenue || 0,
          totalKm: d.totalKm || 0,
          fuelCost: d.fuelCost || 0
        }));

      // Process top vehicles
      const topVehicles = vehicleKpis
        .sort((a, b) => (b.kmPerLiter || 0) - (a.kmPerLiter || 0))
        .slice(0, 5)
        .map(v => ({
          registrationNumber: v.registrationNumber || 'Unknown',
          kmPerLiter: v.kmPerLiter || 0,
          totalKm: v.totalKm || 0,
          fuelLiters: v.fuelLiters || 0,
          costPerKm: v.costPerKm || 0,
          efficiency: v.kmPerLiter || 0,
          fuelCost: v.fuelCost || 0
        }));

      // Generate recent activities from real data
      const recentActivities = [];
      
      // Add vehicle activities
      vehicleKpis.slice(0, 3).forEach(vehicle => {
        if (vehicle.registrationNumber && vehicle.totalKm > 0) {
          recentActivities.push({
            type: 'vehicle',
            message: `${vehicle.registrationNumber} - ${vehicle.kmPerLiter?.toFixed(1) || 0} km/L efficiency`,
            vehicle: vehicle.registrationNumber,
            time: 'Today',
            status: vehicle.kmPerLiter > 8 ? 'success' : 'warning'
          });
        }
      });
      
      // Add driver activities
      driverKpis.slice(0, 3).forEach(driver => {
        if ((driver.driverName || driver.driver) && driver.tripsCompleted > 0) {
          recentActivities.push({
            type: 'driver',
            message: `${driver.driverName || driver.driver} completed ${driver.tripsCompleted} trips`,
            vehicle: 'Fleet',
            time: 'Today',
            status: 'success'
          });
        }
      });

      // Add fuel activity
      if (totalFuelCost > 0) {
        recentActivities.push({
          type: 'fuel',
          message: `Total fuel expenditure: R ${totalFuelCost.toFixed(2)}`,
          vehicle: 'All Vehicles',
          time: 'This period',
          status: 'info'
        });
      }

      return {
        success: true,
        timestamp: new Date().toISOString(),
        period: {
          startDate: data.period?.startDate || startDate,
          endDate: data.period?.endDate || endDate,
          days: data.period?.days || calculateDaysBetween(startDate, endDate),
          vehicleTrend: data.period?.vehicleTrend || 0,
          driverTrend: data.period?.driverTrend || 0,
          efficiencyTrend: data.period?.efficiencyTrend || 0,
          costTrend: data.period?.costTrend || 0
        },
        summary: {
          activeVehicles: summary.activeVehicles || 0,
          activeDrivers: summary.activeDrivers || 0,
          totalVehicles: summary.activeVehicles || 0,
          totalDrivers: summary.activeDrivers || 0,
          avgFuelEfficiency,
          fuelEfficiency: avgFuelEfficiency,
          totalFuelCost,
          fuelCost: totalFuelCost,
          totalFuelLiters,
          totalKm,
          totalRevenue: summary.totalRevenue || 0,
          totalProfit: summary.totalProfit || 0,
          avgTripDistance,
          costPerKm,
          vehicleTrend: summary.vehicleTrend || 0,
          driverTrend: summary.driverTrend || 0,
          efficiencyTrend: summary.efficiencyTrend || 0,
          costTrend: summary.costTrend || 0
        },
        topDrivers,
        topVehicles,
        vehicleKpis: topVehicles,
        driverKpis: driverKpis.slice(0, 5),
        recentActivities: recentActivities.slice(0, 5),
        periodStats: {
          startDate: data.period?.startDate || startDate,
          endDate: data.period?.endDate || endDate,
          vehicleTrend: data.period?.vehicleTrend || 0,
          driverTrend: data.period?.driverTrend || 0,
          efficiencyTrend: data.period?.efficiencyTrend || 0,
          costTrend: data.period?.costTrend || 0
        },
        mostEfficientVehicle: data.mostEfficientVehicle || {
          registration: topVehicles[0]?.registrationNumber || 'N/A',
          efficiency: topVehicles[0]?.kmPerLiter || 0
        },
        topDriver: data.topDriver || {
          name: topDrivers[0]?.name || 'N/A',
          profit: topDrivers[0]?.profit || 0,
          tripsCompleted: topDrivers[0]?.tripCount || 0
        }
      };
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      
      // Rethrow the error with details
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(`Server error: ${error.response.status} - ${error.response.data?.message || 'Unknown error'}`);
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
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
      const url = `/api/analytics/vehicles${queryString ? `?${queryString}` : ''}`;
      
      console.log('🚛 Fetching vehicle analytics:', url);
      const response = await api.get(url);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
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
      const url = `/api/analytics/drivers${queryString ? `?${queryString}` : ''}`;
      
      console.log('👤 Fetching driver analytics:', url);
      const response = await api.get(url);
      
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || 'Invalid response from server');
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
      const response = await api.get('/api/analytics/status');
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
      const response = await api.get('/api/analytics/debug/auth');
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
      const response = await api.get('/api/analytics/test-simple');
      return response.data;
    } catch (error) {
      console.error('❌ Test endpoint failed:', error);
      throw error;
    }
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
