import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Row,
  Col,
  Alert,
  Typography,
  Spin,
  Space
} from 'antd';
import {
  EnvironmentOutlined,
  CalculatorOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { routingService } from '../services/routingService';

const { Text } = Typography;

const RouteCalculator = ({ onCalculated, defaultOrigin = '', defaultDestination = '' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const calculateRoute = async (values) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { origin, destination, vehicleType } = values;

      const metrics = await routingService.calculateTripMetrics(
        origin,
        destination,
        vehicleType || 'TRUCK'
      );

      const fuelCost = routingService.calculateFuelCost(
        metrics.totalDistance,
        vehicleType || 'TRUCK'
      );

      const calculatedResult = {
        ...metrics,
        fuelCost,
        formattedDuration: formatDuration(metrics.estimatedDuration)
      };

      setResult(calculatedResult);

      if (onCalculated) {
        onCalculated(calculatedResult);
      }

    } catch (err) {
      setError(err.message || 'Failed to calculate route');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (hours) => {
    const totalMinutes = hours * 60;
    const days = Math.floor(totalMinutes / 1440);
    const hoursRemaining = Math.floor((totalMinutes % 1440) / 60);
    const minutes = Math.round(totalMinutes % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hoursRemaining > 0) parts.push(`${hoursRemaining}h`);
    if (minutes > 0 && days === 0) parts.push(`${minutes}m`);

    return parts.join(' ') || '0h';
  };

  const swapLocations = () => {
    const origin = form.getFieldValue('origin');
    const destination = form.getFieldValue('destination');

    form.setFieldsValue({
      origin: destination,
      destination: origin
    });
  };

  return (
    <Card
      title="Route Calculator"
      size="small"
      style={{ width: '100%' }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={calculateRoute}
        initialValues={{
          origin: defaultOrigin,
          destination: defaultDestination,
          vehicleType: 'TRUCK'
        }}
      >
        <Row gutter={16} align="middle">
          <Col span={10}>
            <Form.Item
              name="origin"
              rules={[{ required: true, message: 'Enter origin' }]}
            >
              <Input
                placeholder="From location"
                prefix={<EnvironmentOutlined />}
                size="large"
              />
            </Form.Item>
          </Col>

          <Col span={4} style={{ textAlign: 'center' }}>
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={swapLocations}
              title="Swap locations"
            />
          </Col>

          <Col span={10}>
            <Form.Item
              name="destination"
              rules={[{ required: true, message: 'Enter destination' }]}
            >
              <Input
                placeholder="To location"
                prefix={<EnvironmentOutlined />}
                size="large"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<CalculatorOutlined />}
            block
            size="large"
          >
            Calculate Route
          </Button>
        </Form.Item>
      </Form>

      {error && (
        <Alert
          message="Calculation Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {loading && (
        <div style={{ textAlign: 'center', padding: 20 }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Calculating optimal route...
          </Text>
        </div>
      )}

      {result && !loading && (
        <div style={{ padding: 16, backgroundColor: '#fafafa', borderRadius: 8 }}>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text strong>Route Summary:</Text>
              <div style={{ marginTop: 8 }}>
                <Text>{result.totalDistance} km • {result.formattedDuration}</Text>
              </div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Text type="secondary">Fuel Required:</Text>
                <div><Text strong>{result.fuelConsumption} liters</Text></div>
              </Col>
              <Col span={12}>
                <Text type="secondary">Estimated Cost:</Text>
                <div><Text strong>R {result.fuelCost.cost.toFixed(2)}</Text></div>
              </Col>
            </Row>

            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Data provided by OpenStreetMap • {result.serviceUsed.toUpperCase()}
              </Text>
            </div>
          </Space>
        </div>
      )}
    </Card>
  );
};

export default RouteCalculator;