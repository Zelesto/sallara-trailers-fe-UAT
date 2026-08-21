// src/contexts/EnumContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';

// Import all hardcoded enums from constants
import {
  // Trip enums
  TRIP_STATUS_OPTIONS,
  TRIP_TYPE_OPTIONS,
  APPROVAL_STATUS_OPTIONS,
  TRIP_PRIORITY_OPTIONS,
  DEPARTURE_TYPE_OPTIONS,
  DEPARTED_FROM_OPTIONS,
  TRIP_STATUS_CONFIG,
  
  // Load enums
  LOAD_STATUS_OPTIONS,
  LOAD_PRIORITY_OPTIONS,
  CUSTOMS_STATUS_OPTIONS,
  
  // Driver enums
  DRIVER_STATUS_OPTIONS,
  EMPLOYMENT_TYPE_OPTIONS,
  GENDER_OPTIONS,
  SHIFT_PATTERN_OPTIONS,
  DRIVER_STATUS_CONFIG,
  
  // Vehicle enums
  VEHICLE_STATUS_OPTIONS,
  VEHICLE_TYPE_OPTIONS,
  FUEL_TANK_TYPE_OPTIONS,
  MAINTENANCE_STATUS_OPTIONS,
  VEHICLE_STATUS_CONFIG,
  
  // POD enums
  POD_STATUS_OPTIONS,
  
  // Finance enums
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_STATUS_OPTIONS,
  ACCOUNT_TYPE_OPTIONS,
  
  // Fuel enums
  FUEL_TYPE_OPTIONS,
  
  // Customer enums
  PAYMENT_TERMS_OPTIONS,
  CURRENCY_OPTIONS,
  CUSTOMER_TYPE_OPTIONS,
  INDUSTRY_OPTIONS,
  
  // Helper functions
  getDisplayName,
  getColor,
  toOptions,
} from '../constants';

const EnumContext = createContext();

export const useEnums = () => {
  const context = useContext(EnumContext);
  if (!context) {
    throw new Error('useEnums must be used within an EnumProvider');
  }
  return context;
};

export const EnumProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(true); // Always ready with hardcoded enums

  // No need to fetch enums from API - using hardcoded values

  // All getters return hardcoded options immediately
  const getTripStatusOptions = useCallback(() => TRIP_STATUS_OPTIONS, []);
  const getTripTypeOptions = useCallback(() => TRIP_TYPE_OPTIONS, []);
  const getApprovalStatusOptions = useCallback(() => APPROVAL_STATUS_OPTIONS, []);
  const getPriorityOptions = useCallback(() => TRIP_PRIORITY_OPTIONS, []);
  const getDepartureTypeOptions = useCallback(() => DEPARTURE_TYPE_OPTIONS, []);
  const getDepartedFromOptions = useCallback(() => DEPARTED_FROM_OPTIONS, []);
  
  const getLoadStatusOptions = useCallback(() => LOAD_STATUS_OPTIONS, []);
  const getLoadPriorityOptions = useCallback(() => LOAD_PRIORITY_OPTIONS, []);
  const getCustomsStatusOptions = useCallback(() => CUSTOMS_STATUS_OPTIONS, []);
  
  const getDriverStatusOptions = useCallback(() => DRIVER_STATUS_OPTIONS, []);
  const getEmploymentTypeOptions = useCallback(() => EMPLOYMENT_TYPE_OPTIONS, []);
  const getGenderOptions = useCallback(() => GENDER_OPTIONS, []);
  const getShiftPatternOptions = useCallback(() => SHIFT_PATTERN_OPTIONS, []);
  
  const getVehicleStatusOptions = useCallback(() => VEHICLE_STATUS_OPTIONS, []);
  const getVehicleTypeOptions = useCallback(() => VEHICLE_TYPE_OPTIONS, []);
  const getFuelTankTypeOptions = useCallback(() => FUEL_TANK_TYPE_OPTIONS, []);
  const getMaintenanceStatusOptions = useCallback(() => MAINTENANCE_STATUS_OPTIONS, []);
  
  const getPodStatusOptions = useCallback(() => POD_STATUS_OPTIONS, []);
  
  const getPaymentMethodOptions = useCallback(() => PAYMENT_METHOD_OPTIONS, []);
  const getPaymentStatusOptions = useCallback(() => PAYMENT_STATUS_OPTIONS, []);
  const getAccountTypeOptions = useCallback(() => ACCOUNT_TYPE_OPTIONS, []);
  
  const getFuelTypeOptions = useCallback(() => FUEL_TYPE_OPTIONS, []);
  
  const getPaymentTermsOptions = useCallback(() => PAYMENT_TERMS_OPTIONS, []);
  const getCurrencyOptions = useCallback(() => CURRENCY_OPTIONS, []);
  const getCustomerTypeOptions = useCallback(() => CUSTOMER_TYPE_OPTIONS, []);
  const getIndustryOptions = useCallback(() => INDUSTRY_OPTIONS, []);
  
  // Driver and vehicle options (these might come from API or be empty)
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [supervisors, setSupervisors] = useState([]);

  const getDriverOptions = useCallback(() => 
    drivers.map(d => ({
      value: d.id,
      label: d.fullName || d.name || `Driver ${d.id}`,
      ...d
    })), [drivers]
  );

  const getVehicleOptions = useCallback(() => 
    vehicles.map(v => ({
      value: v.id,
      label: v.registrationNumber || `Vehicle ${v.id}`,
      ...v
    })), [vehicles]
  );

  const getSupervisorOptions = useCallback(() => 
    supervisors.map(s => ({
      value: s.id,
      label: s.fullName || s.name || `Supervisor ${s.id}`,
      ...s
    })), [supervisors]
  );

  // Refresh (just reloads from hardcoded values)
  const refreshEnums = useCallback(() => {
    console.log('📦 EnumProvider: Refreshing hardcoded enums');
    return Promise.resolve();
  }, []);

  const value = {
    // Hardcoded enums
    tripStatuses: TRIP_STATUS_OPTIONS,
    tripTypes: TRIP_TYPE_OPTIONS,
    approvalStatuses: APPROVAL_STATUS_OPTIONS,
    tripPriorities: TRIP_PRIORITY_OPTIONS,
    departureTypes: DEPARTURE_TYPE_OPTIONS,
    departedFrom: DEPARTED_FROM_OPTIONS,
    loadStatuses: LOAD_STATUS_OPTIONS,
    loadPriorities: LOAD_PRIORITY_OPTIONS,
    customsStatuses: CUSTOMS_STATUS_OPTIONS,
    driverStatuses: DRIVER_STATUS_OPTIONS,
    vehicleStatuses: VEHICLE_STATUS_OPTIONS,
    vehicleTypes: VEHICLE_TYPE_OPTIONS,
    fuelTypes: FUEL_TYPE_OPTIONS,
    podStatuses: POD_STATUS_OPTIONS,
    paymentMethods: PAYMENT_METHOD_OPTIONS,
    paymentStatuses: PAYMENT_STATUS_OPTIONS,
    accountTypes: ACCOUNT_TYPE_OPTIONS,
    
    loading: loading || authLoading,
    error,
    isReady,
    refreshEnums,
    
    // Getter functions
    getTripStatusOptions,
    getTripTypeOptions,
    getApprovalStatusOptions,
    getPriorityOptions,
    getDepartureTypeOptions,
    getDepartedFromOptions,
    getLoadStatusOptions,
    getLoadPriorityOptions,
    getCustomsStatusOptions,
    getDriverStatusOptions,
    getEmploymentTypeOptions,
    getGenderOptions,
    getShiftPatternOptions,
    getVehicleStatusOptions,
    getVehicleTypeOptions,
    getFuelTankTypeOptions,
    getMaintenanceStatusOptions,
    getPodStatusOptions,
    getPaymentMethodOptions,
    getPaymentStatusOptions,
    getAccountTypeOptions,
    getFuelTypeOptions,
    getPaymentTermsOptions,
    getCurrencyOptions,
    getCustomerTypeOptions,
    getIndustryOptions,
    getDriverOptions,
    getVehicleOptions,
    getSupervisorOptions,
    
    // Helper functions
    getDisplayName,
    getColor,
    toOptions,
    
    // Configs
    tripStatusConfig: TRIP_STATUS_CONFIG,
    driverStatusConfig: DRIVER_STATUS_CONFIG,
    vehicleStatusConfig: VEHICLE_STATUS_CONFIG,
  };

  return (
    <EnumContext.Provider value={value}>
      {children}
    </EnumContext.Provider>
  );
};

export default EnumProvider;
