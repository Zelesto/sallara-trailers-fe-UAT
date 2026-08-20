// src/contexts/EnumContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  // Helper function to safely extract data from API response
  const safeExtractData = (result, defaultValue = []) => {
    if (!result) return defaultValue;
    
    // If result is already an array
    if (Array.isArray(result)) return result;
    
    // If result has a data property that's an array
    if (result.data && Array.isArray(result.data)) return result.data;
    
    // If result has a content property that's an array
    if (result.content && Array.isArray(result.content)) return result.content;
    
    // If result has an items property that's an array
    if (result.items && Array.isArray(result.items)) return result.items;
    
    // If result has a results property that's an array
    if (result.results && Array.isArray(result.results)) return result.results;
    
    // Try to find any array property
    if (typeof result === 'object') {
      const values = Object.values(result);
      const arrayValue = values.find(v => Array.isArray(v));
      if (arrayValue) return arrayValue;
    }
    
    return defaultValue;
  };

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
      const results = await Promise.allSettled([
        enumService.getEnums('trip', 'status'),
        enumService.getEnums('trip', 'type'),
        enumService.getEnums('trip', 'approval'),
        enumService.getEnums('driver', 'status'),
        enumService.getEnums('vehicle', 'status'),
        enumService.getEnums('vehicle', 'type'),
        enumService.getEnums('fuel', 'type'),
        enumService.getEnums('load', 'status'),
        enumService.getEnums('pod', 'status'),
        driverService.getAllDrivers({ status: 'AVAILABLE' }).catch(() => []),
        vehicleService.getAllVehicles({ status: 'AVAILABLE' }).catch(() => []),
        Promise.resolve([]), // Replace with userService.getSupervisors() when available
      ]);

      // Safely extract data from each result
      const extractData = (result, index, name) => {
        if (result.status === 'fulfilled') {
          const data = safeExtractData(result.value);
          if (!Array.isArray(data)) {
            console.warn(`⚠️ ${name} returned non-array data:`, data);
            return [];
          }
          return data;
        } else {
          console.warn(`⚠️ Failed to fetch ${name}:`, result.reason);
          return [];
        }
      };

      setEnums({
        tripStatuses: extractData(results[0], 0, 'tripStatuses'),
        tripTypes: extractData(results[1], 1, 'tripTypes'),
        approvalStatuses: extractData(results[2], 2, 'approvalStatuses'),
        driverStatuses: extractData(results[3], 3, 'driverStatuses'),
        vehicleStatuses: extractData(results[4], 4, 'vehicleStatuses'),
        vehicleTypes: extractData(results[5], 5, 'vehicleTypes'),
        fuelTypes: extractData(results[6], 6, 'fuelTypes'),
        loadStatuses: extractData(results[7], 7, 'loadStatuses'),
        podStatuses: extractData(results[8], 8, 'podStatuses'),
        drivers: extractData(results[9], 9, 'drivers'),
        vehicles: extractData(results[10], 10, 'vehicles'),
        supervisors: extractData(results[11], 11, 'supervisors'),
      });
      
      setLastFetched(Date.now());
      setInitialLoadDone(true);
      console.log('✅ EnumProvider: Enums loaded successfully');
    } catch (err) {
      console.error('❌ EnumProvider: Failed to load enums:', err);
      setError(err.message || 'Failed to load enums');
      // Don't clear enums on error, keep existing data
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

  // Safe mapper functions
  const mapToOptions = useCallback((items, valueKey = 'code', labelKey = 'displayName') => {
    // Ensure items is an array
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    return items
      .filter(item => item && typeof item === 'object')
      .map(item => {
        // Safely extract value and label
        const value = item[valueKey] ?? item.id ?? item.code ?? '';
        const label = item[labelKey] ?? item.displayName ?? item.name ?? item.code ?? 'Unknown';
        
        return {
          value: value,
          label: label,
          ...item
        };
      });
  }, []);

  const mapEntityToOptions = useCallback((items, labelKey = 'name', valueKey = 'id') => {
    // Ensure items is an array
    if (!items || !Array.isArray(items)) {
      return [];
    }
    
    return items
      .filter(item => item && typeof item === 'object')
      .map(item => {
        // Safely extract value and label
        const value = item[valueKey] ?? item.id;
        const label = item[labelKey] ?? item.name ?? item.fullName ?? item.registrationNumber ?? String(item.id ?? '');
        
        return {
          value: value,
          label: label,
          ...item
        };
      });
  }, []);

  // Refresh enums
  const refreshEnums = useCallback(() => {
    return loadEnums(true);
  }, [loadEnums]);

  // Memoized options to prevent unnecessary recalculations
  const tripStatusOptions = useMemo(() => mapToOptions(enums.tripStatuses), [enums.tripStatuses, mapToOptions]);
  const tripTypeOptions = useMemo(() => mapToOptions(enums.tripTypes), [enums.tripTypes, mapToOptions]);
  const approvalStatusOptions = useMemo(() => mapToOptions(enums.approvalStatuses), [enums.approvalStatuses, mapToOptions]);
  const driverStatusOptions = useMemo(() => mapToOptions(enums.driverStatuses), [enums.driverStatuses, mapToOptions]);
  const vehicleStatusOptions = useMemo(() => mapToOptions(enums.vehicleStatuses), [enums.vehicleStatuses, mapToOptions]);
  const vehicleTypeOptions = useMemo(() => mapToOptions(enums.vehicleTypes), [enums.vehicleTypes, mapToOptions]);
  const fuelTypeOptions = useMemo(() => mapToOptions(enums.fuelTypes), [enums.fuelTypes, mapToOptions]);
  const loadStatusOptions = useMemo(() => mapToOptions(enums.loadStatuses), [enums.loadStatuses, mapToOptions]);
  const podStatusOptions = useMemo(() => mapToOptions(enums.podStatuses), [enums.podStatuses, mapToOptions]);
  const driverOptions = useMemo(() => mapEntityToOptions(enums.drivers, 'fullName', 'id'), [enums.drivers, mapEntityToOptions]);
  const vehicleOptions = useMemo(() => mapEntityToOptions(enums.vehicles, 'registrationNumber', 'id'), [enums.vehicles, mapEntityToOptions]);
  const supervisorOptions = useMemo(() => mapEntityToOptions(enums.supervisors, 'fullName', 'id'), [enums.supervisors, mapEntityToOptions]);

  const value = {
    enums,
    loading,
    error,
    refreshEnums,
    isReady: initialLoadDone && !loading,
    
    // Helper functions
    mapToOptions,
    mapEntityToOptions,
    
    // Convenience getters for options (return memoized values)
    getTripStatusOptions: useCallback(() => tripStatusOptions, [tripStatusOptions]),
    getTripTypeOptions: useCallback(() => tripTypeOptions, [tripTypeOptions]),
    getApprovalStatusOptions: useCallback(() => approvalStatusOptions, [approvalStatusOptions]),
    getDriverStatusOptions: useCallback(() => driverStatusOptions, [driverStatusOptions]),
    getVehicleStatusOptions: useCallback(() => vehicleStatusOptions, [vehicleStatusOptions]),
    getVehicleTypeOptions: useCallback(() => vehicleTypeOptions, [vehicleTypeOptions]),
    getFuelTypeOptions: useCallback(() => fuelTypeOptions, [fuelTypeOptions]),
    getLoadStatusOptions: useCallback(() => loadStatusOptions, [loadStatusOptions]),
    getPodStatusOptions: useCallback(() => podStatusOptions, [podStatusOptions]),
    getDriverOptions: useCallback(() => driverOptions, [driverOptions]),
    getVehicleOptions: useCallback(() => vehicleOptions, [vehicleOptions]),
    getSupervisorOptions: useCallback(() => supervisorOptions, [supervisorOptions]),
  };

  return (
    <EnumContext.Provider value={value}>
      {children}
    </EnumContext.Provider>
  );
};

export default EnumProvider;
