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
    tripPriorities: [],
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
  const [isReady, setIsReady] = useState(false);

  // Helper to safely extract data
  const safeExtractData = (result, defaultValue = []) => {
    if (!result) return defaultValue;
    if (Array.isArray(result)) return result;
    if (result.data && Array.isArray(result.data)) return result.data;
    if (result.content && Array.isArray(result.content)) return result.content;
    if (result.items && Array.isArray(result.items)) return result.items;
    if (result.results && Array.isArray(result.results)) return result.results;
    
    // Try to find any array property
    if (typeof result === 'object') {
      const values = Object.values(result);
      const arrayValue = values.find(v => Array.isArray(v));
      if (arrayValue) return arrayValue;
    }
    return defaultValue;
  };

  // Load all enums after authentication
  const loadEnums = useCallback(async () => {
    // Only load if authenticated
    if (!isAuthenticated || !token) {
      console.log('⏳ EnumProvider: Not authenticated, skipping load');
      setIsReady(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 EnumProvider: Loading enums after authentication...');
      
      // Fetch all enum data in parallel
      const results = await Promise.allSettled([
        enumService.getEnums('trip', 'status'),
        enumService.getEnums('trip', 'type'),
        enumService.getEnums('trip', 'approval'),
        enumService.getEnums('trip', 'priority'),
        enumService.getEnums('driver', 'status'),
        enumService.getEnums('vehicle', 'status'),
        enumService.getEnums('vehicle', 'type'),
        enumService.getEnums('fuel', 'type'),
        enumService.getEnums('load', 'status'),
        enumService.getEnums('pod', 'status'),
        // These might fail if not available, but we handle it
        driverService.getAllDrivers({ status: 'AVAILABLE' }).catch(() => []),
        vehicleService.getAllVehicles({ status: 'AVAILABLE' }).catch(() => []),
        Promise.resolve([]), // supervisors placeholder
      ]);

      // Extract data safely
      const extractData = (result, name) => {
        if (result.status === 'fulfilled') {
          const data = safeExtractData(result.value);
          if (!Array.isArray(data)) {
            console.warn(`⚠️ ${name} returned non-array:`, data);
            return [];
          }
          return data;
        }
        console.warn(`⚠️ Failed to fetch ${name}:`, result.reason);
        return [];
      };

      const newEnums = {
        tripStatuses: extractData(results[0], 'tripStatuses'),
        tripTypes: extractData(results[1], 'tripTypes'),
        approvalStatuses: extractData(results[2], 'approvalStatuses'),
        tripPriorities: extractData(results[3], 'tripPriorities'),
        driverStatuses: extractData(results[4], 'driverStatuses'),
        vehicleStatuses: extractData(results[5], 'vehicleStatuses'),
        vehicleTypes: extractData(results[6], 'vehicleTypes'),
        fuelTypes: extractData(results[7], 'fuelTypes'),
        loadStatuses: extractData(results[8], 'loadStatuses'),
        podStatuses: extractData(results[9], 'podStatuses'),
        drivers: extractData(results[10], 'drivers'),
        vehicles: extractData(results[11], 'vehicles'),
        supervisors: extractData(results[12], 'supervisors'),
      };

      setEnums(newEnums);
      setIsReady(true);
      console.log('✅ EnumProvider: Enums loaded successfully');
    } catch (err) {
      console.error('❌ EnumProvider: Failed to load enums:', err);
      setError(err.message || 'Failed to load enums');
      // Still mark as ready so UI doesn't hang
      setIsReady(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token]);

  // Load enums when authentication state changes
  useEffect(() => {
    if (isAuthenticated && token) {
      console.log('🔐 EnumProvider: User authenticated, loading enums...');
      loadEnums();
    } else {
      console.log('🚫 EnumProvider: User not authenticated, clearing enums');
      setEnums({
        tripStatuses: [],
        tripTypes: [],
        approvalStatuses: [],
        tripPriorities: [],
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
      setIsReady(false);
    }
  }, [isAuthenticated, token, loadEnums]);

  // SAFE mapper functions - always return arrays
  const mapToOptions = useCallback((items, valueKey = 'code', labelKey = 'displayName') => {
    // Ensure we always have an array
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        value: item[valueKey] ?? item.id ?? item.code ?? '',
        label: item[labelKey] ?? item.displayName ?? item.name ?? item.code ?? 'Unknown',
        ...item
      }));
  }, []);

  const mapEntityToOptions = useCallback((items, labelKey = 'name', valueKey = 'id') => {
    if (!items || !Array.isArray(items)) {
      return [];
    }
    return items
      .filter(item => item && typeof item === 'object')
      .map(item => ({
        value: item[valueKey] ?? item.id,
        label: item[labelKey] ?? item.name ?? item.fullName ?? item.registrationNumber ?? String(item.id ?? ''),
        ...item
      }));
  }, []);

  // Memoized options - always return arrays
  const tripStatusOptions = useMemo(() => mapToOptions(enums.tripStatuses), [enums.tripStatuses, mapToOptions]);
  const tripTypeOptions = useMemo(() => mapToOptions(enums.tripTypes), [enums.tripTypes, mapToOptions]);
  const approvalStatusOptions = useMemo(() => mapToOptions(enums.approvalStatuses), [enums.approvalStatuses, mapToOptions]);
  const tripPriorityOptions = useMemo(() => mapToOptions(enums.tripPriorities || []), [enums.tripPriorities, mapToOptions]);
  const driverStatusOptions = useMemo(() => mapToOptions(enums.driverStatuses), [enums.driverStatuses, mapToOptions]);
  const vehicleStatusOptions = useMemo(() => mapToOptions(enums.vehicleStatuses), [enums.vehicleStatuses, mapToOptions]);
  const vehicleTypeOptions = useMemo(() => mapToOptions(enums.vehicleTypes), [enums.vehicleTypes, mapToOptions]);
  const fuelTypeOptions = useMemo(() => mapToOptions(enums.fuelTypes), [enums.fuelTypes, mapToOptions]);
  const loadStatusOptions = useMemo(() => mapToOptions(enums.loadStatuses), [enums.loadStatuses, mapToOptions]);
  const podStatusOptions = useMemo(() => mapToOptions(enums.podStatuses), [enums.podStatuses, mapToOptions]);
  const driverOptions = useMemo(() => mapEntityToOptions(enums.drivers, 'fullName', 'id'), [enums.drivers, mapEntityToOptions]);
  const vehicleOptions = useMemo(() => mapEntityToOptions(enums.vehicles, 'registrationNumber', 'id'), [enums.vehicles, mapEntityToOptions]);
  const supervisorOptions = useMemo(() => mapEntityToOptions(enums.supervisors, 'fullName', 'id'), [enums.supervisors, mapEntityToOptions]);

  // Refresh enums
  const refreshEnums = useCallback(() => {
    return loadEnums();
  }, [loadEnums]);

  const value = {
    enums,
    loading,
    error,
    isReady,
    refreshEnums,
    mapToOptions,
    mapEntityToOptions,
    
    // These always return arrays, even if data isn't loaded yet
    getTripStatusOptions: useCallback(() => tripStatusOptions, [tripStatusOptions]),
    getTripTypeOptions: useCallback(() => tripTypeOptions, [tripTypeOptions]),
    getApprovalStatusOptions: useCallback(() => approvalStatusOptions, [approvalStatusOptions]),
    getPriorityOptions: useCallback(() => tripPriorityOptions, [tripPriorityOptions]),
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
