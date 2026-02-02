import React, { useEffect, useState, useCallback } from 'react';
import {
  Modal,
  Form,
  InputNumber,
  Button,
  Space,
  Row,
  Col,
  message,
  Input,
  Select,
  Card,
  Alert,
  Typography,
  Tabs,
  Divider,
  Statistic,
  Tooltip
} from 'antd';
import {
  CalculatorOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
  CarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  RadarChartOutlined,
  ReloadOutlined,
  FireOutlined
} from '@ant-design/icons';
import { tripService } from '../services/tripService';

const { Option } = Select;
const { Text } = Typography;
const { TabPane } = Tabs;

/* -------------------- helpers -------------------- */

const inferVehicleType = (vehicle) => {
  if (!vehicle) return 'TRUCK';
  const mm = `${vehicle.make || ''} ${vehicle.model || ''}`.toUpperCase();

  if (mm.includes('TRAILER') || mm.includes('SEMI')) return 'TRAILER';
  if (mm.includes('VAN') || mm.includes('BAKKIE')) return 'VAN';
  if (mm.includes('CAR') || mm.includes('SEDAN') || mm.includes('HATCH')) return 'CAR';
  return 'TRUCK';
};

const formatDuration = (hours = 0) => {
  const minutes = Math.round(hours * 60);
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;

  return [
    d > 0 && `${d}d`,
    h > 0 && `${h}h`,
    m > 0 && d === 0 && `${m}m`
  ].filter(Boolean).join(' ') || '0h';
};

/* -------------------- component -------------------- */

const TripMetricsForm = ({
  visible,
  onClose,
  onSuccess,
  tripId,
  initialMetrics,
  originLocation = '',
  destinationLocation = '',
  vehicleInfo
}) => {
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [vehicleType, setVehicleType] = useState('TRUCK');
  const [calculatedMetrics, setCalculatedMetrics] = useState(null);
  const [routeError, setRouteError] = useState('');
  const [activeTab, setActiveTab] = useState('calculator');

  /* ---------- modal lifecycle ---------- */

  useEffect(() => {
    if (!visible) return;

    form.resetFields();
    setCalculatedMetrics(null);
    setRouteError('');

    form.setFieldsValue({
      ...initialMetrics,
      originLocation: originLocation || initialMetrics?.originLocation || '',
      destinationLocation: destinationLocation || initialMetrics?.destinationLocation || ''
    });

    setVehicleType(inferVehicleType(vehicleInfo));
  }, [visible, form, initialMetrics, originLocation, destinationLocation, vehicleInfo]);

  /* ---------- calculate ---------- */

  const calculateMetrics = useCallback(async () => {
    setCalculating(true);
    setRouteError('');

    try {
      const { originLocation, destinationLocation } = form.getFieldsValue([
        'originLocation',
        'destinationLocation'
      ]);

      const dto = await tripService.calculateTripMetrics(
        originLocation,
        destinationLocation,
        vehicleType,
        tripId
      );

      form.setFieldsValue({
        totalDistance: dto.totalDistanceKm,
        estimatedDuration: dto.totalDurationHours,
        fuelConsumption: dto.fuelUsedLiters,
        estimatedCost: dto.costAmount
      });

      setCalculatedMetrics(dto);
      message.success('Route calculated successfully');
    } catch {
      setRouteError('Unable to calculate route. Check locations or API key.');
    } finally {
      setCalculating(false);
    }
  }, [form, vehicleType, tripId]);

  /* ---------- save ---------- */

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await tripService.saveTripMetrics(tripId, {
        totalDistance: values.totalDistance,
        estimatedDuration: values.estimatedDuration,
        estimatedFuel: values.fuelConsumption,
        estimatedCost: values.estimatedCost,
        delays: values.delays,
        incidents: values.incidents
      });

      message.success('Trip metrics updated');
      onSuccess();
    } catch (err) {
      message.error(err?.response?.data?.error || 'Failed to save metrics');
    } finally {
      setLoading(false);
    }
  };

  /* ---------- UI ---------- */

  const renderSummary = () =>
    calculatedMetrics && (
      <Card
        title="Calculated Route Summary"
        size="small"
        style={{ marginBottom: 16, borderColor: '#52c41a' }}
        extra={
          <Tooltip title="Calculated using OpenRouteService (OSM)">
            <InfoCircleOutlined />
          </Tooltip>
        }
      >
        <Row gutter={16}>
          <Col span={6}>
            <Statistic title="Distance" value={calculatedMetrics.totalDistanceKm} suffix="km" prefix={<RadarChartOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Duration" value={formatDuration(calculatedMetrics.totalDurationHours)} prefix={<ClockCircleOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Fuel" value={calculatedMetrics.fuelUsedLiters} suffix="L" prefix={<FireOutlined />} />
          </Col>
          <Col span={6}>
            <Statistic title="Cost" value={calculatedMetrics.costAmount || 0} prefix={<DollarOutlined />} formatter={(v) => `R ${v}`} />
          </Col>
        </Row>
        <Divider />
        <Text type="secondary">Service: <Text strong>OpenRouteService</Text></Text>
      </Card>
    );

  return (
    <Modal
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      title={
        <Space>
          <CalculatorOutlined />
          <span>Trip Metrics</span>
          {tripId && <Text type="secondary">#{tripId}</Text>}
        </Space>
      }
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Auto Calculator" key="calculator">
          <Form form={form} layout="vertical" onFinish={handleSubmit}>
            <Card size="small" style={{ marginBottom: 16 }}>
              <Alert
                type="info"
                showIcon
                message="Free Route Calculation"
                description="OpenStreetMap via OpenRouteService"
              />
            </Card>

            <Card title="Trip Locations" size="small" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="originLocation" label="Origin" rules={[{ required: true }]}>
                    <Input prefix={<EnvironmentOutlined />} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="destinationLocation" label="Destination" rules={[{ required: true }]}>
                    <Input prefix={<EnvironmentOutlined />} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16} align="middle">
                <Col span={12}>
                  <Select value={vehicleType} onChange={setVehicleType} style={{ width: '100%' }}>
                    <Option value="TRUCK">Truck</Option>
                    <Option value="TRAILER">Trailer</Option>
                    <Option value="VAN">Van</Option>
                    <Option value="CAR">Car</Option>
                  </Select>
                </Col>
                <Col span={12} style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    icon={calculating ? <ReloadOutlined spin /> : <CalculatorOutlined />}
                    onClick={calculateMetrics}
                    loading={calculating}
                  >
                    Calculate Route
                  </Button>
                </Col>
              </Row>

              {routeError && <Alert type="error" showIcon message={routeError} style={{ marginTop: 16 }} />}
            </Card>

            {renderSummary()}

            <Card title="Metrics" size="small">
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item name="totalDistance" label="Distance (km)" rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="estimatedDuration" label="Duration (h)" rules={[{ required: true }]}>
                    <InputNumber min={0.1} step={0.5} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="fuelConsumption" label="Fuel (L)" rules={[{ required: true }]}>
                    <InputNumber min={1} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Form.Item style={{ marginTop: 24 }}>
              <Space style={{ float: 'right' }}>
                <Button onClick={onClose}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={loading}>
                  Save Metrics
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default TripMetricsForm;
