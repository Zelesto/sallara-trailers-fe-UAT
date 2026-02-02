// src/pages/VehicleForm.jsx - UPDATED and FIXED
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  DatePicker,
  Row,
  Col,
  Space,
  message,
  Card,
  Divider,
  InputNumber,
  Switch,
  Typography
} from 'antd';
import {
  SaveOutlined,
  CloseOutlined,
  CarOutlined,
  ToolOutlined,
  CalendarOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import vehicleService from '../services/vehicleService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;
const { Title } = Typography;

const VehicleForm = ({ mode = 'create', vehicleId, initialData, onSuccess, onCancel }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch vehicle data for edit mode
  useEffect(() => {
    const fetchVehicle = async () => {
      if (mode === 'edit' && vehicleId) {
        setLoading(true);
        try {
          const response = await vehicleService.getVehicleById(vehicleId);
          console.log('Edit mode - Vehicle data:', response);

          // Format dates for form
          const formattedData = {
            ...response,
            // Convert date strings to dayjs objects for DatePicker
            lastServiceDate: response.lastServiceDate ? dayjs(response.lastServiceDate) : null,
            insuranceExpiry: response.insuranceExpiry ? dayjs(response.insuranceExpiry) : null,
            roadworthyExpiry: response.roadworthyExpiry ? dayjs(response.roadworthyExpiry) : null,
            nextServiceDue: response.nextServiceDue ? dayjs(response.nextServiceDue) : null
          };

          form.setFieldsValue(formattedData);
        } catch (error) {
          console.error('Error fetching vehicle for edit:', error);
          message.error('Failed to load vehicle data');
        } finally {
          setLoading(false);
        }
      } else if (initialData) {
        // For modal edit from VehicleList
        form.setFieldsValue(initialData);
      }
    };

    fetchVehicle();
  }, [mode, vehicleId, initialData, form]);

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      console.log('Form values:', values);

      // Format values for backend (camelCase)
      const formattedValues = {
        registrationNumber: values.registrationNumber?.trim(),
        vin: values.vin?.trim(),
        make: values.make?.trim(),
        model: values.model?.trim(),
        year: values.year,
        vehicleType: values.vehicleType || 'TRUCK',
        fuelType: values.fuelType || 'DIESEL',
        currentMileage: values.currentMileage || 0,
        currentOdometer: values.currentOdometer || 0,
        status: values.status || 'ACTIVE',
        category: values.category || null,
        fleetNumber: values.fleetNumber || null,
        insurancePolicyNumber: values.insurancePolicyNumber || null,
        insuranceExpiry: values.insuranceExpiry?.format('YYYY-MM-DD') || null,
        roadworthyExpiry: values.roadworthyExpiry?.format('YYYY-MM-DD') || null,
        lastServiceDate: values.lastServiceDate?.format('YYYY-MM-DD') || null,
        lastServiceOdometer: values.lastServiceOdometer || null,
        serviceIntervalDays: values.serviceIntervalDays || null,
        serviceIntervalKm: values.serviceIntervalKm || null,
        nextServiceDue: values.nextServiceDue?.format('YYYY-MM-DD') || null,
        nextServiceOdometer: values.nextServiceOdometer || null,
        assignedDriver: values.assignedDriver || null,
        gpsTrackerId: values.gpsTrackerId || null,
        maintenanceStatus: values.maintenanceStatus || null,
        incidentsLogged: values.incidentsLogged || 0,
        notes: values.notes || null,
        available: values.available !== undefined ? values.available : true,
        active: values.active !== undefined ? values.active : true
      };

      console.log('Sending to API:', formattedValues);

      if (mode === 'create') {
        const response = await vehicleService.createVehicle(formattedValues);
        console.log('Create response:', response);
        message.success('Vehicle created successfully!');
      } else {
        const response = await vehicleService.updateVehicle(vehicleId, formattedValues);
        console.log('Update response:', response);
        message.success('Vehicle updated successfully!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error submitting form:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Operation failed';
      message.error(`Error: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      size="large"
      disabled={loading}
      initialValues={{
        status: 'ACTIVE',
        fuelType: 'DIESEL',
        vehicleType: 'TRUCK',
        available: true,
        active: true
      }}
    >
      <Row gutter={[24, 16]}>
        <Col span={24}>
          <Card
            title={
              <Space>
                <CarOutlined />
                <span>{mode === 'create' ? 'Add New Vehicle' : 'Edit Vehicle'}</span>
              </Space>
            }
            loading={loading}
          >
            {/* Basic Information */}
            <Title level={5} style={{ marginBottom: 16 }}>
              Basic Information
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="registrationNumber"
                  label="Registration Number"
                  rules={[
                    { required: true, message: 'Please enter registration number' },
                    { min: 3, message: 'Registration number must be at least 3 characters' }
                  ]}
                >
                  <Input
                    placeholder="e.g., ABC123GP"
                    maxLength={20}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="vin"
                  label="VIN (Vehicle Identification Number)"
                  rules={[
                    { required: true, message: 'Please enter VIN' },
                    { min: 17, max: 17, message: 'VIN must be 17 characters' }
                  ]}
                >
                  <Input
                    placeholder="17-character VIN"
                    maxLength={17}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="make"
                  label="Make"
                  rules={[{ required: true, message: 'Please enter vehicle make' }]}
                >
                  <Input placeholder="e.g., Volvo" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="model"
                  label="Model"
                  rules={[{ required: true, message: 'Please enter vehicle model' }]}
                >
                  <Input placeholder="e.g., FH16" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="year"
                  label="Manufacture Year"
                  rules={[{ required: true, message: 'Please enter manufacture year' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={2000}
                    max={new Date().getFullYear() + 1}
                    placeholder="e.g., 2023"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="vehicleType"
                  label="Vehicle Type"
                  rules={[{ required: true, message: 'Please select vehicle type' }]}
                >
                  <Select placeholder="Select vehicle type">
                    <Option value="TRUCK">Truck</Option>
                    <Option value="VAN">Van</Option>
                    <Option value="CAR">Car</Option>
                    <Option value="BUS">Bus</Option>
                    <Option value="TRAILER">Trailer</Option>
                    <Option value="OTHER">Other</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="fuelType"
                  label="Fuel Type"
                  rules={[{ required: true, message: 'Please select fuel type' }]}
                >
                  <Select placeholder="Select fuel type">
                    <Option value="DIESEL">Diesel</Option>
                    <Option value="PETROL">Petrol</Option>
                    <Option value="ELECTRIC">Electric</Option>
                    <Option value="HYBRID">Hybrid</Option>
                    <Option value="CNG">CNG</Option>
                    <Option value="LPG">LPG</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="status"
                  label="Status"
                  rules={[{ required: true, message: 'Please select status' }]}
                >
                  <Select placeholder="Select status">
                    <Option value="ACTIVE">Active</Option>
                    <Option value="MAINTENANCE">Maintenance</Option>
                    <Option value="INACTIVE">Inactive</Option>
                    <Option value="RESERVED">Reserved</Option>
                    <Option value="REPAIR">Repair</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Performance & Tracking */}
            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <ToolOutlined />
                <span>Performance & Tracking</span>
              </Space>
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="currentOdometer"
                  label="Current Odometer (km)"
                  rules={[
                    { type: 'number', min: 0, message: 'Odometer must be positive' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="e.g., 15000"
                    addonAfter="km"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="currentMileage"
                  label="Current Mileage (L)"
                  rules={[
                    { type: 'number', min: 0, message: 'Mileage must be positive' }
                  ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                    placeholder="e.g., 15000.5"
                    addonAfter="L"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="avgConsumption"
                  label="Avg Consumption (L/100km)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={0.1}
                    placeholder="e.g., 25.5"
                    addonAfter="L/100km"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Service Information */}
            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <CalendarOutlined />
                <span>Service Information</span>
              </Space>
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastServiceDate"
                  label="Last Service Date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="lastServiceOdometer"
                  label="Last Service Odometer (km)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Odometer at last service"
                    addonAfter="km"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="serviceIntervalDays"
                  label="Service Interval (Days)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="e.g., 90"
                    addonAfter="days"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="serviceIntervalKm"
                  label="Service Interval (km)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="e.g., 10000"
                    addonAfter="km"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="maintenanceStatus"
                  label="Maintenance Status"
                >
                  <Select placeholder="Select status">
                    <Option value="">None</Option>
                    <Option value="SERVICE_DUE">Service Due</Option>
                    <Option value="IN_SERVICE">In Service</Option>
                    <Option value="REPAIR_NEEDED">Repair Needed</Option>
                    <Option value="PARTS_WAITING">Parts Waiting</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="nextServiceDue"
                  label="Next Service Due Date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="nextServiceOdometer"
                  label="Next Service Odometer (km)"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Odometer for next service"
                    addonAfter="km"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Certifications & Documentation */}
            <Title level={5} style={{ marginBottom: 16 }}>
              <Space>
                <SafetyOutlined />
                <span>Certifications & Documentation</span>
              </Space>
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="insurancePolicyNumber"
                  label="Insurance Policy Number"
                >
                  <Input placeholder="Insurance policy number" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="insuranceExpiry"
                  label="Insurance Expiry Date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="roadworthyExpiry"
                  label="Roadworthy Expiry Date"
                >
                  <DatePicker
                    style={{ width: '100%' }}
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="fleetNumber"
                  label="Fleet Number"
                >
                  <Input placeholder="Internal fleet number" />
                </Form.Item>
              </Col>
            </Row>

            <Divider />

            {/* Operational Information */}
            <Title level={5} style={{ marginBottom: 16 }}>
              Operational Information
            </Title>

            <Row gutter={16}>
              <Col xs={24} md={8}>
                <Form.Item
                  name="category"
                  label="Category"
                >
                  <Input placeholder="Vehicle category" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="assignedDriver"
                  label="Assigned Driver ID"
                >
                  <Input placeholder="Driver ID" />
                </Form.Item>
              </Col>
              <Col xs={24} md={8}>
                <Form.Item
                  name="gpsTrackerId"
                  label="GPS Tracker ID"
                >
                  <Input placeholder="GPS tracker ID" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="incidentsLogged"
                  label="Incidents Logged"
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    placeholder="Number of incidents"
                  />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item
                  name="available"
                  label="Available"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="active"
                  label="Active"
                  valuePropName="checked"
                >
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              name="notes"
              label="Notes"
            >
              <TextArea
                rows={4}
                placeholder="Additional notes about the vehicle (maintenance history, special requirements, etc.)"
                maxLength={1000}
                showCount
              />
            </Form.Item>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
        <Space>
          <Button
            onClick={onCancel}
            icon={<CloseOutlined />}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            icon={<SaveOutlined />}
          >
            {mode === 'create' ? 'Create Vehicle' : 'Update Vehicle'}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default VehicleForm;