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
      // Fetch all enum data in parallel
      const [
        tripStatuses,
        tripTypes,
        approvalStatuses,
        driverStatuses,
        vehicleStatuses,
        vehicleTypes,
        fuelTypes,
        loadStatuses,
        podStatuses,
        drivers,
        vehicles,
        supervisors
      ] = await Promise.all([
        enumService.getEnums('trip', 'status').catch(() => []),
        enumService.getEnums('trip', 'type').catch(() => []),
        enumService.getEnums('trip', 'approval').catch(() => []),
        enumService.getEnums('driver', 'status').catch(() => []),
        enumService.getEnums('vehicle', 'status').catch(() => []),
        enumService.getEnums('vehicle', 'type').catch(() => []),
        enumService.getEnums('fuel', 'type').catch(() => []),
        enumService.getEnums('load', 'status').catch(() => []),
        enumService.getEnums('pod', 'status').catch(() => []),
        driverService.getAllDrivers({ status: 'AVAILABLE' }).catch(() => []),
        vehicleService.getAllVehicles({ status: 'AVAILABLE' }).catch(() => []),
        Promise.resolve([]), // Replace with userService.getSupervisors() when available
      ]);

      setEnums({
        tripStatuses: tripStatuses || [],
        tripTypes: tripTypes || [],
        approvalStatuses: approvalStatuses || [],
        driverStatuses: driverStatuses || [],
        vehicleStatuses: vehicleStatuses || [],
        vehicleTypes: vehicleTypes || [],
        fuelTypes: fuelTypes || [],
        loadStatuses: loadStatuses || [],
        podStatuses: podStatuses || [],
        drivers: Array.isArray(drivers) ? drivers : [],
        vehicles: Array.isArray(vehicles) ? vehicles : [],
        supervisors: Array.isArray(supervisors) ? supervisors : [],
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
  }, [isAuthenticated, token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Helper function to map enum data to options for select inputs
  const mapToOptions = useCallback((items, valueKey = 'code', labelKey = 'displayName') => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      value: item[valueKey] || item.id || item.code,
      label: item[labelKey] || item.displayName || item.name || item.code,
      ...item
    }));
  }, []);

  // Helper function to map entity data to options
  const mapEntityToOptions = useCallback((items, labelKey = 'name', valueKey = 'id') => {
    if (!items || !Array.isArray(items)) return [];
    return items.map(item => ({
      value: item[valueKey],
      label: item[labelKey] || item.name || item.fullName || item.registrationNumber || item.id,
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
    // Convenience getters for options
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
