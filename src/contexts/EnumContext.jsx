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

// SAFE HELPER - Always returns an array
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (data.content && Array.isArray(data.content)) return data.content;
  if (data.items && Array.isArray(data.items)) return data.items;
  if (data.results && Array.isArray(data.results)) return data.results;
  
  // Try to find any array property
  if (typeof data === 'object') {
    const values = Object.values(data);
    const arrayValue = values.find(v => Array.isArray(v));
    if (arrayValue) return arrayValue;
  }
  return [];
};

// SAFE MAPPER - Always returns an array
const safeMapToOptions = (items, valueKey = 'code', labelKey = 'displayName') => {
  const arr = safeArray(items);
  if (arr.length === 0) return [];
  
  return arr
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      value: item[valueKey] ?? item.id ?? item.code ?? '',
      label: item[labelKey] ?? item.displayName ?? item.name ?? item.code ?? 'Unknown',
      ...item
    }));
};

// SAFE ENTITY MAPPER - Always returns an array
const safeMapEntityToOptions = (items, labelKey = 'name', valueKey = 'id') => {
  const arr = safeArray(items);
  if (arr.length === 0) return [];
  
  return arr
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      value: item[valueKey] ?? item.id,
      label: item[labelKey] ?? item.name ?? item.fullName ?? item.registrationNumber ?? String(item.id ?? ''),
      ...item
    }));
};

export const EnumProvider = ({ children }) => {
  const { isAuthenticated: authStatus, user, token } = useAuth();
  const [enums, setEnums] = useState({ /* ... */ });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // Load all enums after authentication
  const loadEnums = useCallback(async () => {
    // Check authentication using the authStatus from context
    if (!authStatus) {
      console.log('⏳ EnumProvider: Not authenticated, skipping load');
      setIsReady(false);
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
      return;
    }

    // If already ready and not forcing refresh, skip
    if (isReady && !loading) {
      console.log('📦 EnumProvider: Using cached enums');
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
        driverService.getAllDrivers({ status: 'AVAILABLE' }).catch(() => []),
        vehicleService.getAllVehicles({ status: 'AVAILABLE' }).catch(() => []),
        Promise.resolve([]),
      ]);

      // Extract data safely
      const extractData = (result, name) => {
        if (result.status === 'fulfilled') {
          const data = safeArray(result.value);
          console.log(`✅ ${name}: ${data.length} items`);
          return data;
        }
        console.warn(`⚠️ Failed to fetch ${name}:`, result.reason);
        return [];
      };

      setEnums({
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
      });

      setIsReady(true);
      console.log('✅ EnumProvider: Enums loaded successfully');
    } catch (err) {
      console.error('❌ EnumProvider: Failed to load enums:', err);
      setError(err.message || 'Failed to load enums');
      setIsReady(true);
    } finally {
      setLoading(false);
    }
  }, [authStatus, isReady, loading]);

  // Load enums when authentication state changes
  useEffect(() => {
    if (authStatus) {
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
  }, [authStatus, loadEnums]);

  // ALWAYS return arrays - using safe mappers with useMemo
  const tripStatusOptions = useMemo(() => safeMapToOptions(enums.tripStatuses), [enums.tripStatuses]);
  const tripTypeOptions = useMemo(() => safeMapToOptions(enums.tripTypes), [enums.tripTypes]);
  const approvalStatusOptions = useMemo(() => safeMapToOptions(enums.approvalStatuses), [enums.approvalStatuses]);
  const tripPriorityOptions = useMemo(() => safeMapToOptions(enums.tripPriorities), [enums.tripPriorities]);
  const driverStatusOptions = useMemo(() => safeMapToOptions(enums.driverStatuses), [enums.driverStatuses]);
  const vehicleStatusOptions = useMemo(() => safeMapToOptions(enums.vehicleStatuses), [enums.vehicleStatuses]);
  const vehicleTypeOptions = useMemo(() => safeMapToOptions(enums.vehicleTypes), [enums.vehicleTypes]);
  const fuelTypeOptions = useMemo(() => safeMapToOptions(enums.fuelTypes), [enums.fuelTypes]);
  const loadStatusOptions = useMemo(() => safeMapToOptions(enums.loadStatuses), [enums.loadStatuses]);
  const podStatusOptions = useMemo(() => safeMapToOptions(enums.podStatuses), [enums.podStatuses]);
  const driverOptions = useMemo(() => safeMapEntityToOptions(enums.drivers, 'fullName', 'id'), [enums.drivers]);
  const vehicleOptions = useMemo(() => safeMapEntityToOptions(enums.vehicles, 'registrationNumber', 'id'), [enums.vehicles]);
  const supervisorOptions = useMemo(() => safeMapEntityToOptions(enums.supervisors, 'fullName', 'id'), [enums.supervisors]);

  // Refresh enums
  const refreshEnums = useCallback(() => {
    return loadEnums();
  }, [loadEnums]);

  // All getter functions ALWAYS return arrays
  const getTripStatusOptions = useCallback(() => tripStatusOptions, [tripStatusOptions]);
  const getTripTypeOptions = useCallback(() => tripTypeOptions, [tripTypeOptions]);
  const getApprovalStatusOptions = useCallback(() => approvalStatusOptions, [approvalStatusOptions]);
  const getPriorityOptions = useCallback(() => tripPriorityOptions, [tripPriorityOptions]);
  const getDriverStatusOptions = useCallback(() => driverStatusOptions, [driverStatusOptions]);
  const getVehicleStatusOptions = useCallback(() => vehicleStatusOptions, [vehicleStatusOptions]);
  const getVehicleTypeOptions = useCallback(() => vehicleTypeOptions, [vehicleTypeOptions]);
  const getFuelTypeOptions = useCallback(() => fuelTypeOptions, [fuelTypeOptions]);
  const getLoadStatusOptions = useCallback(() => loadStatusOptions, [loadStatusOptions]);
  const getPodStatusOptions = useCallback(() => podStatusOptions, [podStatusOptions]);
  const getDriverOptions = useCallback(() => driverOptions, [driverOptions]);
  const getVehicleOptions = useCallback(() => vehicleOptions, [vehicleOptions]);
  const getSupervisorOptions = useCallback(() => supervisorOptions, [supervisorOptions]);

  const value = {
    enums,
    loading,
    error,
    isReady,
    refreshEnums,
    // Direct mappers
    mapToOptions: safeMapToOptions,
    mapEntityToOptions: safeMapEntityToOptions,
    // Option getters
    getTripStatusOptions,
    getTripTypeOptions,
    getApprovalStatusOptions,
    getPriorityOptions,
    getDriverStatusOptions,
    getVehicleStatusOptions,
    getVehicleTypeOptions,
    getFuelTypeOptions,
    getLoadStatusOptions,
    getPodStatusOptions,
    getDriverOptions,
    getVehicleOptions,
    getSupervisorOptions,
  };

  return (
    <EnumContext.Provider value={value}>
      {children}
    </EnumContext.Provider>
  );
};

export default EnumProvider;
