// src/pages/TripForm.jsx - FULLY REFACTORED
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Button,
  Row,
  Col,
  message,
  Spin,
  Card,
  Alert,
  Typography
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { tripService } from '../services/tripService';
import { driverService } from '../services/driverService';
import { vehicleService } from '../services/vehicleService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Text } = Typography;

// Helper functions outside component to prevent recreation
const formatDateForAPI = (dateValue) => {
  if (!dateValue) return null;
  return dayjs(dateValue).format('YYYY-MM-DDTHH:mm:ss');
};

const extractArrayData = (response, endpointName = '') => {
  const data = response?.data !== undefined ? response.data : response;

  if (Array.isArray(data)) {
    return data;
  }

  if (data?.content && Array.isArray(data.content)) {
    return data.content;
  }

  if (data && typeof data === 'object') {
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
    if (arrayKey) {
      return data[arrayKey];
    }
  }

  console.warn(`No array data found in ${endpointName} response:`, response);
  return [];
};

const filterActiveVehicles = (vehicles) => {
  return vehicles.filter(v =>
    v.status === 'ACTIVE' ||
    v.status === 'active' ||
    v.status === 'Available' ||
    v.status === 'OPERATIONAL' ||
    v.available === true
  );
};

const filterActiveDrivers = (drivers) => {
  return drivers.filter(d =>
    d.status === 'ACTIVE' ||
    d.status === 'active' ||
    d.status === 'Available' ||
    d.status === 'AVAILABLE'
  );
};

const TripForm = ({
  visible,
  onClose,
  onSuccess,
  mode = 'create',
  initialData = null,
  tripId = null
}) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [fetchError, setFetchError] = useState(null);

  // Fetch vehicles and drivers
  const fetchVehiclesAndDrivers = useCallback(async () => {
    setLoadingData(true);
    setFetchError(null);

    try {
      const [vehiclesResponse, driversResponse] = await Promise.allSettled([
        vehicleService.getAllVehicles(),
        driverService.getAllDrivers()
      ]);

      const errors = [];

      // Process vehicles
      if (vehiclesResponse.status === 'fulfilled') {
        const vehiclesData = extractArrayData(vehiclesResponse.value, 'vehicles');
        const activeVehicles = filterActiveVehicles(vehiclesData);
        setVehicles(activeVehicles);
        console.log('Active Vehicles:', activeVehicles);
      } else {
        errors.push('vehicles');
        console.error('Vehicles API error:', vehiclesResponse.reason);
      }

      // Process drivers
      if (driversResponse.status === 'fulfilled') {
        const driversData = extractArrayData(driversResponse.value, 'drivers');
        const activeDrivers = filterActiveDrivers(driversData);
        setDrivers(activeDrivers);
        console.log('Active Drivers:', activeDrivers);
      } else {
        errors.push('drivers');
        console.error('Drivers API error:', driversResponse.reason);
      }

      // Set error message if any API failed
      if (errors.length > 0) {
        setFetchError(`Failed to load: ${errors.join(' and ')}. You can still create a trip.`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setFetchError('Failed to load form data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      fetchVehiclesAndDrivers();

      // Reset form
      form.resetFields();

      if (mode === 'edit' && initialData) {
        const formData = {
          originLocation: initialData.originLocation,
          destinationLocation: initialData.destinationLocation,
          status: initialData.status,
          priority: initialData.priority || 'MEDIUM',
          cargoDescription: initialData.cargoDescription,
          plannedStartDate: initialData.plannedStartDate ? dayjs(initialData.plannedStartDate) : null,
          plannedEndDate: initialData.plannedEndDate ? dayjs(initialData.plannedEndDate) : null,
          startDate: initialData.startDate ? dayjs(initialData.startDate) : null,
          endDate: initialData.endDate ? dayjs(initialData.endDate) : null,
          vehicleId: initialData.vehicleId,
          driverId: initialData.driverId,
          notes: initialData.notes
        };

        if (mode === 'create') {
          formData.tripNumber = initialData.tripNumber || `TRIP-${Date.now().toString(36).toUpperCase()}`;
        }

        form.setFieldsValue(formData);
      } else {
        // Set default values for create mode
        form.setFieldsValue({
          status: 'PLANNED',
          priority: 'MEDIUM',
          tripNumber: `TRIP-${Date.now().toString(36).toUpperCase()}`
        });
      }
    }
  }, [visible, mode, initialData, form, fetchVehiclesAndDrivers]);

  // Memoized options
  const statusOptions = useMemo(() => [
    { value: 'PLANNED', label: 'Planned' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CLOSED', label: 'Closed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ], []);

  const priorityOptions = useMemo(() => [
    { value: 'LOW', label: 'Low' },
    { value: 'MEDIUM', label: 'Medium' },
    { value: 'HIGH', label: 'High' },
    { value: 'URGENT', label: 'Urgent' }
  ], []);

  const vehicleOptions = useMemo(() => [
    <Option key="empty" value="">No vehicle assigned</Option>,
    ...vehicles.map(vehicle => (
      <Option key={vehicle.id} value={vehicle.id}>
        {vehicle.registrationNumber} - {vehicle.make} {vehicle.model}
        {vehicle.status && vehicle.status !== 'ACTIVE' ? ` (${vehicle.status})` : ''}
      </Option>
    ))
  ], [vehicles]);

  const driverOptions = useMemo(() => [
    <Option key="empty" value="">No driver assigned</Option>,
    ...drivers.map(driver => (
      <Option key={driver.id} value={driver.id}>
        {driver.firstName} {driver.lastName} ({driver.licenseNumber})
        {driver.status && driver.status !== 'ACTIVE' ? ` (${driver.status})` : ''}
      </Option>
    ))
  ], [drivers]);

  // Form submission handler
  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      // Format dates for API
      const formattedValues = {
        ...values,
        startDate: formatDateForAPI(values.startDate) || formatDateForAPI(values.plannedStartDate),
        endDate: formatDateForAPI(values.endDate),
        plannedStartDate: formatDateForAPI(values.plannedStartDate),
        plannedEndDate: formatDateForAPI(values.plannedEndDate),
        vehicleId: values.vehicleId ? Number(values.vehicleId) : null,
        driverId: values.driverId ? Number(values.driverId) : null,
        // Ensure trip number for create mode
        tripNumber: mode === 'create'
          ? (values.tripNumber || `TRIP-${Date.now().toString(36).toUpperCase()}`)
          : initialData?.tripNumber
      };

      // Validate required fields
      if (!formattedValues.startDate) {
        message.error('Please provide a start date (planned or actual)');
        setSubmitting(false);
        return;
      }

      console.log('Submitting trip data:', formattedValues);

      let response;
      if (mode === 'create') {
        response = await tripService.createTrip(formattedValues);
        message.success('Trip created successfully!');
      } else if (mode === 'edit' && (tripId || initialData?.id)) {
        const idToUpdate = tripId || initialData.id;
        response = await tripService.updateTrip(idToUpdate, formattedValues);
        message.success('Trip updated successfully!');
      }

      if (onSuccess) {
        onSuccess(response);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);

      // Handle 409 Conflict (Duplicate Entry)
      if (error.response?.status === 409) {
        const errorDetail = error.response.data?.detail ||
                          error.response.data?.message ||
                          'Duplicate entry detected';

        if (errorDetail.toLowerCase().includes('tripnumber') || errorDetail.includes('TRIP_NUMBER')) {
          message.error('Trip number already exists. Please use a different trip number.');
        } else if (errorDetail.toLowerCase().includes('vehicle') ||
                  errorDetail.toLowerCase().includes('driver')) {
          message.error('Vehicle or driver is already assigned to another trip during this period.');
        } else {
          message.error(`Duplicate entry: ${errorDetail}`);
        }
        setSubmitting(false);
        return;
      }

      // Handle validation errors
      if (error.errorFields) {
        message.error('Please fill in all required fields correctly.');
      }
      // Handle API errors
      else if (error.response?.data) {
        const errorMessage = error.response.data.error ||
                            error.response.data.message ||
                            'Server error occurred';
        message.error(`Error: ${errorMessage}`);
      }
      // Handle network/other errors
      else if (error.message) {
        message.error(error.message);
      } else {
        message.error(`Failed to ${mode === 'create' ? 'create' : 'update'} trip`);
      }

      setSubmitting(false);
    }
  }, [form, mode, tripId, initialData, onSuccess, onClose]);

  const handleCancel = useCallback(() => {
    form.resetFields();
    onClose();
  }, [form, onClose]);

  // Render methods for better organization
  const renderTripNumberSection = () => (
    mode === 'edit' && initialData?.tripNumber ? (
      <Card size="small" style={{ marginBottom: 16, backgroundColor: '#fafafa' }}>
        <Row align="middle">
          <Col span={6}>
            <Text strong>Trip Number:</Text>
          </Col>
          <Col span={18}>
            <Text style={{ fontSize: '16px', fontWeight: 'bold', color: '#1890ff' }}>
              {initialData.tripNumber}
            </Text>
          </Col>
        </Row>
      </Card>
    ) : null
  );

  const renderBasicInfoSection = () => (
    <Card size="small" title="Basic Information" style={{ marginBottom: 16 }}>
      {mode === 'create' && (
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="tripNumber"
              label="Trip Number"
              rules={[
                { required: true, message: 'Please enter a trip number' },
                { min: 3, message: 'Trip number must be at least 3 characters' }
              ]}
              help="Must be unique (e.g., TRIP-2024-001)"
            >
              <Input placeholder="e.g., TRIP-2024-001" />
            </Form.Item>
          </Col>
        </Row>
      )}

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="originLocation"
            label="Origin Location"
            rules={[{ required: true, message: 'Please enter origin location' }]}
          >
            <Input placeholder="e.g., New York Warehouse" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="destinationLocation"
            label="Destination Location"
            rules={[{ required: true, message: 'Please enter destination location' }]}
          >
            <Input placeholder="e.g., Los Angeles Distribution Center" />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select trip status' }]}
          >
            <Select placeholder="Select status">
              {statusOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="priority"
            label="Priority"
          >
            <Select placeholder="Select priority">
              {priorityOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Form.Item
            name="cargoDescription"
            label="Cargo Description"
          >
            <Input placeholder="e.g., Electronics, Food Supplies" />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderScheduleSection = () => (
    <Card size="small" title="Schedule" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="plannedStartDate"
            label="Planned Start Date & Time"
            rules={[{ required: true, message: 'Please select planned start date' }]}
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Select date and time"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="plannedEndDate"
            label="Planned End Date & Time"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Select date and time"
            />
          </Form.Item>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="startDate"
            label="Actual Start Date & Time"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Select date and time"
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="endDate"
            label="Actual End Date & Time"
          >
            <DatePicker
              showTime
              format="YYYY-MM-DD HH:mm"
              style={{ width: '100%' }}
              placeholder="Select date and time"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderAssignmentSection = () => (
    <Card size="small" title="Assignment" style={{ marginBottom: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name="vehicleId"
            label="Select Vehicle"
            rules={[{ required: true, message: 'Please select a vehicle' }]}
            help={vehicles.length === 0 ? "No active vehicles available" : ""}
          >
            <Select
              placeholder="Select a vehicle"
              loading={loadingData}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              disabled={vehicles.length === 0}
            >
              {vehicleOptions}
            </Select>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name="driverId"
            label="Select Driver"
            rules={[{ required: true, message: 'Please select a driver' }]}
            help={drivers.length === 0 ? "No active drivers available" : ""}
          >
            <Select
              placeholder="Select a driver"
              loading={loadingData}
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
              }
              disabled={drivers.length === 0}
            >
              {driverOptions}
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );

  const renderAdditionalInfoSection = () => (
    <Card size="small" title="Additional Information">
      <Form.Item
        name="notes"
        label="Notes"
      >
        <TextArea
          rows={3}
          placeholder="Any additional notes or instructions..."
          maxLength={500}
          showCount
        />
      </Form.Item>
    </Card>
  );

  const renderErrorAlert = () => (
    fetchError && (
      <Alert
        message="Data Loading Issue"
        description={fetchError}
        type="warning"
        showIcon
        icon={<WarningOutlined />}
        style={{ marginBottom: 16 }}
      />
    )
  );

  return (
    <Modal
      title={mode === 'create' ? 'Create New Trip' : `Edit Trip ${initialData?.tripNumber ? `- ${initialData.tripNumber}` : ''}`}
      open={visible}
      onCancel={handleCancel}
      width={800}
      footer={[
        <Button key="cancel" onClick={handleCancel} icon={<CloseOutlined />}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          icon={<SaveOutlined />}
        >
          {mode === 'create' ? 'Create Trip' : 'Update Trip'}
        </Button>
      ]}
      destroyOnClose
    >
      <Spin spinning={loadingData} tip="Loading vehicles and drivers...">
        {renderErrorAlert()}

        <Form
          form={form}
          layout="vertical"
          name="tripForm"
          style={{ marginTop: 24 }}
        >
          {renderTripNumberSection()}
          {renderBasicInfoSection()}
          {renderScheduleSection()}
          {renderAssignmentSection()}
          {renderAdditionalInfoSection()}
        </Form>
      </Spin>
    </Modal>
  );
};

export default TripForm;