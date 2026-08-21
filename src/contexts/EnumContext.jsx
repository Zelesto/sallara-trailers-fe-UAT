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

// ALWAYS returns an array
const safeArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.content && Array.isArray(data.content)) return data.content;
  if (data?.items && Array.isArray(data.items)) return data.items;
  if (data?.results && Array.isArray(data.results)) return data.results;
  
  if (typeof data === 'object') {
    const values = Object.values(data);
    const arrayValue = values.find(v => Array.isArray(v));
    if (arrayValue) return arrayValue;
  }
  return [];
};

// ALWAYS returns an array - safe mapper
const safeMapToOptions = (items) => {
  const arr = safeArray(items);
  if (arr.length === 0) return [];
  
  return arr
    .filter(item => item && typeof item === 'object')
    .map(item => ({
      value: item.code || item.id || item.value || '',
      label: item.displayName || item.name || item.label || item.code || 'Unknown',
      ...item
    }));
};

export const EnumProvider = ({ children }) => {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
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
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load all enums - ONLY when auth is fully ready
  const loadEnums = useCallback(async () => {
    // CRITICAL: Only proceed if auth is fully loaded AND user is authenticated
    if (authLoading) {
      console.log('⏳ EnumProvider: Auth still loading, waiting...');
      return;
    }

    if (!isAuthenticated || !user) {
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
      setHasLoaded(false);
      return;
    }

    // Don't reload if already loaded
    if (hasLoaded) {
      console.log('📦 EnumProvider: Using cached enums');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 EnumProvider: Loading enums for user:', user?.email || user?.username);
      
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
      setHasLoaded(true);
      setIsReady(true);
      console.log('✅ EnumProvider: Enums loaded successfully');
    } catch (err) {
      console.error('❌ EnumProvider: Failed to load enums:', err);
      setError(err.message || 'Failed to load enums');
      setIsReady(true);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, user, hasLoaded]);

  // ONLY run when auth state changes AND auth is not loading
  useEffect(() => {
    // Only proceed if auth is not loading
    if (!authLoading) {
      if (isAuthenticated && user && !hasLoaded) {
        console.log('🔐 EnumProvider: Auth ready, loading enums...');
        loadEnums();
      } else if (!isAuthenticated || !user) {
        console.log('🚫 EnumProvider: Clearing enums (not authenticated)');
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
        setHasLoaded(false);
      }
    }
  }, [isAuthenticated, authLoading, user, hasLoaded, loadEnums]);

  // Memoized options - ALWAYS return arrays
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

  // Entity options - ALWAYS return arrays
  const driverOptions = useMemo(() => {
    const arr = safeArray(enums.drivers);
    return arr.map(d => ({
      value: d.id,
      label: d.fullName || d.name || `Driver ${d.id}`,
      ...d
    }));
  }, [enums.drivers]);

  const vehicleOptions = useMemo(() => {
    const arr = safeArray(enums.vehicles);
    return arr.map(v => ({
      value: v.id,
      label: v.registrationNumber || v.name || `Vehicle ${v.id}`,
      ...v
    }));
  }, [enums.vehicles]);

  const supervisorOptions = useMemo(() => {
    const arr = safeArray(enums.supervisors);
    return arr.map(s => ({
      value: s.id,
      label: s.fullName || s.name || `Supervisor ${s.id}`,
      ...s
    }));
  }, [enums.supervisors]);

  // Refresh enums
  const refreshEnums = useCallback(() => {
    setHasLoaded(false);
    return loadEnums();
  }, [loadEnums]);

  // ALWAYS return arrays - these are the getter functions
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
    loading: loading || authLoading,
    error,
    isReady: isReady && !authLoading && !loading && hasLoaded,
    refreshEnums,
    // Option getters - ALWAYS return arrays
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
