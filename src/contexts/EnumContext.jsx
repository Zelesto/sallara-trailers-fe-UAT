// src/contexts/EnumContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { enumService } from '../services/enumService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import { useAuth } from './AuthContext';

const EnumContext = createContext();

export const useEnums = () => {
  const context = useContext(EnumContext);
  if (!context) {
    throw new Error('useEnums must be used within an EnumProvider');
  }
  return context;
};

export const EnumProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const [enums, setEnums] = useState({
    tripStatuses: [],
    tripTypes: [],
    approvalStatuses: [],
    driverStatuses: [],
    vehicleStatuses: [],
    vehicleTypes: [],
    fuelTypes: [],
    loadStatuses: [],
    podStatuses: [],
    drivers: [],
    vehicles: [],
    supervisors: [],
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetched, setLastFetched] = useState(null);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // Load all enums and entities
  const loadEnums = useCallback(async (forceRefresh = false) => {
    // Only load if authenticated
    if (!isAuthenticated) {
      console.log('⏳ EnumProvider: Not authenticated, skipping load');
      return;
    }

    // Check if we should use cached data
    if (!forceRefresh && lastFetched) {
      const now = Date.now();
      const cacheAge = now - lastFetched;
      if (cacheAge < 300000) { // 5 minutes cache
        console.log('📦 EnumProvider: Using cached enums');
        return;
      }
    }

    console.log('🔄 EnumProvider: Loading enums...');
    setLoading(true);
    setError(null);

    try {
      // Fetch all enum data in parallel with proper error handling
      const [
        tripStatusesResult,
        tripTypesResult,
        approvalStatusesResult,
        driverStatusesResult,
        vehicleStatusesResult,
        vehicleTypesResult,
        fuelTypesResult,
        loadStatusesResult,
        podStatusesResult,
        driversResult,
        vehiclesResult,
        supervisorsResult
      ] = await Promise.allSettled([
        enumService.getEnums('trip', 'status'),
        enumService.getEnums('trip', 'type'),
        enumService.getEnums('trip', 'approval'),
        enumService.getEnums('driver', 'status'),
        enumService.getEnums('vehicle', 'status'),
        enumService.getEnums('vehicle', 'type'),
        enumService.getEnums('fuel', 'type'),
        enumService.getEnums('load', 'status'),
        enumService.getEnums('pod', 'status'),
        driverService.getAllDrivers({ status: 'AVAILABLE' }),
        vehicleService.getAllVehicles({ status: 'AVAILABLE' }),
        Promise.resolve([]), // Replace with userService.getSupervisors() when available
      ]);

      // Extract values from settled promises, default to empty array on failure
      const getValue = (result) => {
        if (result.status === 'fulfilled') {
          // Handle different response structures
          const data = result.value;
          if (Array.isArray(data)) return data;
          if (data && data.data && Array.isArray(data.data)) return data.data;
          if (data && data.content && Array.isArray(data.content)) return data.content;
          return [];
        }
        console.warn('Failed to fetch enum data:', result.reason);
        return [];
      };

      setEnums({
        tripStatuses: getValue(tripStatusesResult),
        tripTypes: getValue(tripTypesResult),
        approvalStatuses: getValue(approvalStatusesResult),
        driverStatuses: getValue(driverStatusesResult),
        vehicleStatuses: getValue(vehicleStatusesResult),
        vehicleTypes: getValue(vehicleTypesResult),
        fuelTypes: getValue(fuelTypesResult),
        loadStatuses: getValue(loadStatusesResult),
        podStatuses: getValue(podStatusesResult),
        drivers: getValue(driversResult),
        vehicles: getValue(vehiclesResult),
        supervisors: getValue(supervisorsResult),
      });
      
      setLastFetched(Date.now());
      setInitialLoadDone(true);
      console.log('✅ EnumProvider: Enums loaded successfully');
    } catch (err) {
      console.error('❌ EnumProvider: Failed to load enums:', err);
      setError(err.message || 'Failed to load enums');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, lastFetched]);

  // Load enums when authentication state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔐 EnumProvider: User authenticated, loading enums...');
      loadEnums();
    } else {
      console.log('🚫 EnumProvider: User not authenticated, clearing enums');
      // Reset enums when logged out
      setEnums({
        tripStatuses: [],
        tripTypes: [],
        approvalStatuses: [],
        driverStatuses: [],
        vehicleStatuses: [],
        vehicleTypes: [],
        fuelTypes: [],
        loadStatuses: [],
        podStatuses: [],
        drivers: [],
        vehicles: [],
        supervisors: [],
      });
      setInitialLoadDone(false);
      setLastFetched(null);
    }
  }, [isAuthenticated, token, loadEnums]);

  // Helper function to map enum data to options for select inputs
  const mapToOptions = useCallback((items, valueKey = 'code', labelKey = 'displayName') => {
    // Safe check: ensure items is an array
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items
      .filter(item => item && typeof item === 'object') // Filter out invalid items
      .map(item => ({
        value: item[valueKey] || item.id || item.code || '',
        label: item[labelKey] || item.displayName || item.name || item.code || 'Unknown',
        ...item
      }));
  }, []);

  // Helper function to map entity data to options
  const mapEntityToOptions = useCallback((items, labelKey = 'name', valueKey = 'id') => {
    // Safe check: ensure items is an array
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items
      .filter(item => item && typeof item === 'object') // Filter out invalid items
      .map(item => ({
        value: item[valueKey] || item.id,
        label: item[labelKey] || item.name || item.fullName || item.registrationNumber || String(item.id),
        ...item
      }));
  }, []);

  // Refresh enums
  const refreshEnums = useCallback(() => {
    return loadEnums(true);
  }, [loadEnums]);

  const value = {
    enums,
    loading,
    error,
    refreshEnums,
    isReady: initialLoadDone && !loading,
    // Helper functions
    mapToOptions,
    mapEntityToOptions,
    // Convenience getters for options - ensure they always return arrays
    getTripStatusOptions: () => mapToOptions(enums.tripStatuses),
    getTripTypeOptions: () => mapToOptions(enums.tripTypes),
    getApprovalStatusOptions: () => mapToOptions(enums.approvalStatuses),
    getDriverStatusOptions: () => mapToOptions(enums.driverStatuses),
    getVehicleStatusOptions: () => mapToOptions(enums.vehicleStatuses),
    getVehicleTypeOptions: () => mapToOptions(enums.vehicleTypes),
    getFuelTypeOptions: () => mapToOptions(enums.fuelTypes),
    getLoadStatusOptions: () => mapToOptions(enums.loadStatuses),
    getPodStatusOptions: () => mapToOptions(enums.podStatuses),
    getDriverOptions: () => mapEntityToOptions(enums.drivers, 'fullName', 'id'),
    getVehicleOptions: () => mapEntityToOptions(enums.vehicles, 'registrationNumber', 'id'),
    getSupervisorOptions: () => mapEntityToOptions(enums.supervisors, 'fullName', 'id'),
  };

  return (
    <EnumContext.Provider value={value}>
      {children}
    </EnumContext.Provider>
  );
};

export default EnumProvider;
