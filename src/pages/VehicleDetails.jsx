// src/pages/VehicleDetails.jsx - FIXED with camelCase
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Row,
  Col,
  Tag,
  Button,
  Space,
  Descriptions,
  Divider,
  Spin,
  Alert,
  Statistic,
  Timeline,
  Tabs,
  Progress,
  Badge,
  List,
  Collapse,
  Typography,
  Breadcrumb
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  CarOutlined,
  ToolOutlined,
  CalendarOutlined,
  DashboardOutlined,
  FileTextOutlined,
  HistoryOutlined,
  SafetyCertificateOutlined,
  RadarChartOutlined,
  UserOutlined,
  EnvironmentOutlined,
  WarningOutlined,
  BugOutlined,
  HomeOutlined
} from '@ant-design/icons';
import vehicleService from '../services/vehicleService';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const statusColors = {
  ACTIVE: 'green',
  MAINTENANCE: 'orange',
  INACTIVE: 'red',
  REPAIR: 'volcano'
};

const fuelTypeColors = {
  DIESEL: 'blue',
  PETROL: 'red',
  ELECTRIC: 'green',
  HYBRID: 'purple',
  CNG: 'cyan',
  LPG: 'magenta'
};

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        console.log(`🟡 VehicleDetails: Fetching vehicle ID: ${id}`);
        const response = await vehicleService.getVehicleById(id);
        console.log('🟡 VehicleDetails: Response received:', response);

        if (response && typeof response === 'object') {
          console.log('🟡 VehicleDetails: Sample vehicle data:', {
            id: response.id,
            registrationNumber: response.registrationNumber,
            make: response.make,
            model: response.model,
            year: response.year,
            status: response.status
          });
          setVehicle(response);
        } else {
          console.error('❌ VehicleDetails: Invalid response format:', response);
          setError('Received invalid data format from server');
        }
      } catch (err) {
        console.error('❌ VehicleDetails: Error fetching vehicle:', err);
        setError('Failed to load vehicle details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    } else {
      setError('No vehicle ID provided');
      setLoading(false);
    }
  }, [id]);

  const calculateServiceProgress = () => {
    if (!vehicle?.currentOdometer || !vehicle?.lastServiceOdometer || !vehicle?.serviceIntervalKm) {
      return null;
    }

    const kmSinceService = vehicle.currentOdometer - vehicle.lastServiceOdometer;
    const progress = (kmSinceService / vehicle.serviceIntervalKm) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getDaysUntilNextService = () => {
    if (!vehicle?.nextServiceDue) return null;
    return dayjs(vehicle.nextServiceDue).diff(dayjs(), 'days');
  };

  const getInsuranceStatus = () => {
    if (!vehicle?.insuranceExpiry) return 'no-data';
    if (dayjs(vehicle.insuranceExpiry).isBefore(dayjs())) return 'expired';
    if (dayjs(vehicle.insuranceExpiry).diff(dayjs(), 'days') < 30) return 'expiring-soon';
    return 'valid';
  };

  const getRoadworthyStatus = () => {
    if (!vehicle?.roadworthyExpiry) return 'no-data';
    if (dayjs(vehicle.roadworthyExpiry).isBefore(dayjs())) return 'expired';
    if (dayjs(vehicle.roadworthyExpiry).diff(dayjs(), 'days') < 30) return 'expiring-soon';
    return 'valid';
  };

  const formatValue = (value, formatter = (v) => v) => {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    try {
      return formatter(value);
    } catch (error) {
      console.warn('Error formatting value:', value, error);
      return String(value);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return dayjs(date).format('MMM DD, YYYY');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      return dayjs(date).format('MMM DD, YYYY HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString();
  };

  const breadcrumbItems = [
    {
      title: <HomeOutlined />,
      onClick: () => navigate('/')
    },
    {
      title: 'Vehicles',
      onClick: () => navigate('/vehicles')
    },
    {
      title: vehicle?.registrationNumber || 'Vehicle Details'
    }
  ];

  const tabItems = [
    {
      key: '1',
      label: (
        <span>
          <HistoryOutlined />
          Service History
        </span>
      ),
      children: (
        <Timeline
          items={[
            {
              color: 'green',
              children: `Vehicle Registered - ${vehicle?.createdAt ? dayjs(vehicle.createdAt).format('MMM DD, YYYY') : 'Unknown'}`
            },
            ...(vehicle?.lastServiceDate ? [{
              color: 'green',
              children: `Last Service - ${dayjs(vehicle.lastServiceDate).format('MMM DD, YYYY')}${vehicle.lastServiceOdometer ? ` at ${vehicle.lastServiceOdometer.toLocaleString()} km` : ''}`
            }] : []),
            ...(vehicle?.nextServiceDue ? [{
              color: 'blue',
              children: `Next Service Due - ${dayjs(vehicle.nextServiceDue).format('MMM DD, YYYY')}${vehicle.nextServiceOdometer ? ` at ${vehicle.nextServiceOdometer.toLocaleString()} km` : ''}`
            }] : [])
          ]}
        />
      )
    },
    {
      key: '2',
      label: (
        <span>
          <EnvironmentOutlined />
          Location & Tracking
        </span>
      ),
      children: (
        <div>
          <p>GPS Tracking information would appear here.</p>
          {vehicle?.gpsTrackerId ? (
            <Button type="primary" icon={<RadarChartOutlined />}>
              View Real-time Location
            </Button>
          ) : (
            <Alert
              message="No GPS tracker installed"
              type="info"
              showIcon
            />
          )}
        </div>
      )
    }
  ];

  const collapseItems = [
    {
      key: '1',
      label: 'Driver & GPS Information',
      children: (
        <List
          size="small"
          dataSource={[
            {
              title: 'Assigned Driver',
              description: vehicle?.assignedDriver ? `Driver ID: ${vehicle.assignedDriver}` : 'No driver assigned',
              icon: <UserOutlined />
            },
            {
              title: 'GPS Tracker',
              description: vehicle?.gpsTrackerId ? `Tracker ID: ${vehicle.gpsTrackerId}` : 'No GPS tracker',
              icon: <RadarChartOutlined />
            }
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      )
    },
    {
      key: '2',
      label: 'Incidents & Notes',
      children: (
        <List
          size="small"
          dataSource={[
            {
              title: 'Incidents Logged',
              description: vehicle?.incidentsLogged || 0,
              icon: <WarningOutlined />
            },
            {
              title: 'Notes',
              description: vehicle?.notes || 'No additional notes',
              icon: <FileTextOutlined />
            }
          ]}
          renderItem={(item) => (
            <List.Item>
              <List.Item.Meta
                avatar={item.icon}
                title={item.title}
                description={item.description}
              />
            </List.Item>
          )}
        />
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
            <Spin size="large" />
            <div style={{ marginLeft: 16 }}>
              <Text>Loading vehicle details...</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          type="error"
          message="Error Loading Vehicle Details"
          description={error}
          showIcon
          action={
            <Space>
              <Button size="small" onClick={() => navigate('/vehicles')}>
                Back to Vehicles
              </Button>
              <Button size="small" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Space>
          }
        />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          type="warning"
          message="Vehicle Not Found"
          description="The vehicle you're looking for doesn't exist or may have been deleted."
          showIcon
          action={
            <Button size="small" onClick={() => navigate('/vehicles')}>
              Back to Vehicles
            </Button>
          }
        />
      </div>
    );
  }

  const serviceProgress = calculateServiceProgress();
  const insuranceStatus = getInsuranceStatus();
  const roadworthyStatus = getRoadworthyStatus();
  const daysUntilService = getDaysUntilNextService();

  return (
    <div style={{ padding: '24px' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        items={breadcrumbItems}
        style={{ marginBottom: 24 }}
      />

      {/* Header Section */}
      <Card
        style={{
          marginBottom: 24,
          borderLeft: '4px solid #1890ff',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}
        styles={{
          body: { padding: '16px 24px' }
        }}
      >
        <Row align="middle" justify="space-between">
          <Col flex="auto">
            <Space direction="vertical" size={0}>
              <Space align="center">
                <CarOutlined style={{ fontSize: '24px', color: '#1890ff' }} />
                <Title level={3} style={{ margin: 0 }}>
                  Vehicle Details
                </Title>
              </Space>
              <Space>
                <Text strong style={{ fontSize: '16px' }}>
                  {formatValue(vehicle.registrationNumber)}
                </Text>
                {vehicle.fleetNumber && (
                  <Tag color="blue">Fleet #{formatValue(vehicle.fleetNumber)}</Tag>
                )}
              </Space>
              <Space style={{ marginTop: 8 }}>
                <Tag color={statusColors[vehicle.status]}>
                  {formatValue(vehicle.status)}
                </Tag>
                <Tag color="cyan">
                  {formatValue(vehicle.vehicleType, v => v || 'TRUCK')}
                </Tag>
                <Tag color={fuelTypeColors[vehicle.fuelType]}>
                  {formatValue(vehicle.fuelType)}
                </Tag>
                {vehicle.available !== undefined && (
                  <Tag color={vehicle.available ? 'success' : 'error'}>
                    {vehicle.available ? 'Available' : 'Unavailable'}
                  </Tag>
                )}
                {vehicle.active !== undefined && (
                  <Tag color={vehicle.active ? 'success' : 'default'}>
                    {vehicle.active ? 'Active' : 'Inactive'}
                  </Tag>
                )}
              </Space>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/vehicles')}
              >
                Back
              </Button>
              <Button
                icon={<EditOutlined />}
                type="primary"
                onClick={() => navigate(`/vehicles/${id}/edit`)}
              >
                Edit Vehicle
              </Button>
              <Button
                icon={<DashboardOutlined />}
                onClick={() => navigate(`/vehicles/${id}/dashboard`)}
              >
                Dashboard
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[24, 24]}>
        {/* Vehicle Information */}
        <Col span={24}>
          <Card title="Vehicle Information">
            <Descriptions bordered column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}>
              <Descriptions.Item label="Registration Number">
                {formatValue(vehicle.registrationNumber)}
              </Descriptions.Item>
              <Descriptions.Item label="VIN">
                {formatValue(vehicle.vin)}
              </Descriptions.Item>
              <Descriptions.Item label="Make">
                {formatValue(vehicle.make)}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {formatValue(vehicle.model)}
              </Descriptions.Item>
              <Descriptions.Item label="Year">
                {formatValue(vehicle.year)}
              </Descriptions.Item>
              <Descriptions.Item label="Category">
                {formatValue(vehicle.category)}
              </Descriptions.Item>
              <Descriptions.Item label="Vehicle Type">
                {formatValue(vehicle.vehicleType, v => v || 'TRUCK')}
              </Descriptions.Item>
              <Descriptions.Item label="Fuel Type">
                <Tag color={fuelTypeColors[vehicle.fuelType]}>
                  {formatValue(vehicle.fuelType)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={statusColors[vehicle.status]}>
                  {formatValue(vehicle.status)}
                </Tag>
              </Descriptions.Item>
              {vehicle.maintenanceStatus && (
                <Descriptions.Item label="Maintenance Status">
                  <Tag color="orange">{formatValue(vehicle.maintenanceStatus)}</Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {formatDateTime(vehicle.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Last Updated">
                {formatDateTime(vehicle.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Performance & Service */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <ToolOutlined />
                Performance & Service
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Current Odometer"
                  value={formatValue(vehicle.currentOdometer, formatNumber)}
                  suffix="km"
                  styles={{
                    content: { color: '#1890ff' }
                  }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Current Mileage"
                  value={formatValue(vehicle.currentMileage, v => v?.toFixed(1))}
                  suffix="L"
                />
              </Col>
              <Col span={24}>
                <Divider />
                <Statistic
                  title="Average Consumption"
                  value={formatValue(vehicle.avgConsumption, v => v?.toFixed(1))}
                  suffix="L/100km"
                />
              </Col>
              <Col span={24}>
                {serviceProgress !== null && (
                  <div>
                    <div style={{ marginBottom: 8 }}>
                      <span>Service Progress: </span>
                      <span style={{ fontWeight: 'bold', color: serviceProgress > 80 ? '#f5222d' : '#52c41a' }}>
                        {serviceProgress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      percent={serviceProgress}
                      status={serviceProgress > 80 ? 'exception' : 'active'}
                      strokeColor={serviceProgress > 80 ? '#f5222d' : '#fa8c16'}
                    />
                    <div style={{ fontSize: '12px', color: '#666', marginTop: 4 }}>
                      {formatValue(vehicle.serviceIntervalKm)} km interval
                    </div>
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Service Information */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                Service Information
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="Last Service Date"
                  value={formatValue(vehicle.lastServiceDate, formatDate)}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Last Service Odometer"
                  value={formatValue(vehicle.lastServiceOdometer, formatNumber)}
                  suffix="km"
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Service Interval"
                  value={formatValue(
                    vehicle.serviceIntervalDays || vehicle.serviceIntervalKm,
                    () => (
                      <div>
                        <div>{formatValue(vehicle.serviceIntervalDays)} days</div>
                        <div style={{ fontSize: '12px' }}>{formatValue(vehicle.serviceIntervalKm)} km</div>
                      </div>
                    )
                  )}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Next Service Due"
                  value={formatValue(vehicle.nextServiceDue, formatDate)}
                  styles={{
                    content: {
                      color: daysUntilService !== null && daysUntilService < 0 ? '#f5222d' :
                             daysUntilService !== null && daysUntilService < 7 ? '#fa8c16' : '#52c41a'
                    }
                  }}
                />
                {vehicle.nextServiceOdometer && (
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    at {formatValue(vehicle.nextServiceOdometer, formatNumber)} km
                  </div>
                )}
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Certifications & Insurance */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <SafetyCertificateOutlined />
                Certifications
              </Space>
            }
          >
            <List
              dataSource={[
                {
                  title: 'Insurance',
                  description: insuranceStatus === 'no-data' ? 'No insurance data' :
                    insuranceStatus === 'expired' ? (
                      <Badge status="error" text={`Expired on ${formatDate(vehicle.insuranceExpiry)}`} />
                    ) : insuranceStatus === 'expiring-soon' ? (
                      <Badge status="warning" text={`Expires on ${formatDate(vehicle.insuranceExpiry)}`} />
                    ) : (
                      <Badge status="success" text={`Valid until ${formatDate(vehicle.insuranceExpiry)}`} />
                    ),
                  extra: vehicle.insurancePolicyNumber && `Policy: ${vehicle.insurancePolicyNumber}`,
                  icon: <SafetyCertificateOutlined />
                },
                {
                  title: 'Roadworthy Certificate',
                  description: roadworthyStatus === 'no-data' ? 'No roadworthy data' :
                    roadworthyStatus === 'expired' ? (
                      <Badge status="error" text={`Expired on ${formatDate(vehicle.roadworthyExpiry)}`} />
                    ) : roadworthyStatus === 'expiring-soon' ? (
                      <Badge status="warning" text={`Expires on ${formatDate(vehicle.roadworthyExpiry)}`} />
                    ) : (
                      <Badge status="success" text={`Valid until ${formatDate(vehicle.roadworthyExpiry)}`} />
                    ),
                  icon: <SafetyCertificateOutlined />
                }
              ]}
              renderItem={(item) => (
                <List.Item
                  extra={item.extra}
                >
                  <List.Item.Meta
                    avatar={item.icon}
                    title={item.title}
                    description={item.description}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Additional Information */}
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <FileTextOutlined />
                Additional Information
              </Space>
            }
          >
            <Collapse
              ghost
              items={collapseItems}
            />
          </Card>
        </Col>

        {/* Debug Information (can be removed in production) */}
        {process.env.NODE_ENV === 'development' && (
          <Col span={24}>
            <Card
              title={
                <Space>
                  <BugOutlined />
                  <span>Debug Information</span>
                </Space>
              }
              size="small"
            >
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Text strong>Vehicle ID:</Text> {id}
                </Col>
                <Col span={12}>
                  <Text strong>Data Loaded:</Text> {!!vehicle ? 'Yes' : 'No'}
                </Col>
                {vehicle && (
                  <Col span={24}>
                    <Divider style={{ margin: '8px 0' }} />
                    <Text strong>Available Fields:</Text>
                    <div style={{ marginTop: 8, maxHeight: '150px', overflowY: 'auto' }}>
                      <Space wrap>
                        {Object.keys(vehicle).map(key => (
                          <Tag key={key} color="blue" style={{ margin: '2px', fontSize: '10px' }}>
                            {key}: {typeof vehicle[key] === 'object' ? 'Object' : String(vehicle[key])}
                          </Tag>
                        ))}
                      </Space>
                    </div>
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        )}

        {/* Tabs for History */}
        <Col span={24}>
          <Card>
            <Tabs
              defaultActiveKey="1"
              items={tabItems}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <div style={{ textAlign: 'right' }}>
        <Space>
          <Button onClick={() => navigate('/vehicles')} icon={<ArrowLeftOutlined />}>
            Back to Vehicles
          </Button>
          <Button type="primary" onClick={() => navigate(`/vehicles/${id}/edit`)} icon={<EditOutlined />}>
            Edit Vehicle
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default VehicleDetails;