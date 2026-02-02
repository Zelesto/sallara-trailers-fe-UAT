import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal, Descriptions, Tag, Button, Space, Select, DatePicker,
  Divider, Typography, Spin, message, Row, Col, Card
} from 'antd';
import {
  EnvironmentOutlined,
  UserOutlined,
  CarOutlined,
  SaveOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { tripService } from '../services/tripService';

const { Option } = Select;
const { Text } = Typography;

const statusColors = {
  PLANNED: 'blue',
  ACTIVE: 'green',
  IN_PROGRESS: 'orange',
  COMPLETED: 'cyan',
  CLOSED: 'purple',
  CANCELLED: 'red'
};

const TripDetails = ({ visible, tripId, onClose, onUpdate }) => {
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState(null);
  const [actualStart, setActualStart] = useState(null);
  const [actualEnd, setActualEnd] = useState(null);

  // Fetch trip details when modal opens
  useEffect(() => {
    if (visible && tripId) {
      fetchTripDetails();
    }
  }, [visible, tripId]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const data = await tripService.getTripById(tripId);
      setTrip(data);
      setNewStatus(data.status);
      setActualStart(data.actualStartDate ? dayjs(data.actualStartDate) : null);
      setActualEnd(data.actualEndDate ? dayjs(data.actualEndDate) : null);
    } catch (err) {
      console.error('Error fetching trip:', err);
      message.error('Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTrip = async () => {
    if (!trip) return;
    setUpdating(true);
    try {
      const payload = {
        ...trip,
        status: newStatus,
        actualStartDate: actualStart ? actualStart.toISOString() : null,
        actualEndDate: actualEnd ? actualEnd.toISOString() : null,
      };
      await tripService.updateTrip(tripId, payload);
      message.success('Trip updated successfully');
      await fetchTripDetails();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Update error:', err);
      message.error('Failed to update trip');
    } finally {
      setUpdating(false);
    }
  };

  const hasChanges = useMemo(() => {
    if (!trip) return false;
    return (
      trip.status !== newStatus ||
      (trip.actualStartDate && !dayjs(trip.actualStartDate).isSame(actualStart)) ||
      (trip.actualEndDate && !dayjs(trip.actualEndDate).isSame(actualEnd)) ||
      (!trip.actualStartDate && actualStart) ||
      (!trip.actualEndDate && actualEnd)
    );
  }, [trip, newStatus, actualStart, actualEnd]);

  if (loading && !trip) return (
    <Modal open={visible} onCancel={onClose} footer={null}>
      <Spin style={{ width: '100%', padding: 50 }} />
    </Modal>
  );

  if (!trip) return null;

  return (
    <Modal
      title={`Trip Details: ${trip.tripNumber}`}
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchTripDetails} disabled={loading}>Refresh</Button>,
        <Button key="close" onClick={onClose}>Close</Button>,
        <Button key="save" type="primary" icon={<SaveOutlined />} loading={updating} onClick={handleUpdateTrip} disabled={!hasChanges}>
          Save Changes
        </Button>
      ]}
    >
      <Spin spinning={loading}>
        <Row gutter={[24, 24]}>
          <Col span={16}>
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Origin"><EnvironmentOutlined /> {trip.originLocation}</Descriptions.Item>
              <Descriptions.Item label="Destination"><EnvironmentOutlined /> {trip.destinationLocation}</Descriptions.Item>
              <Descriptions.Item label="Driver"><UserOutlined /> {trip.driverName || 'Not Assigned'}</Descriptions.Item>
              <Descriptions.Item label="Vehicle"><CarOutlined /> {trip.vehicleRegistration || 'Not Assigned'}</Descriptions.Item>
              <Descriptions.Item label="Planned Start">{trip.plannedStartDate ? dayjs(trip.plannedStartDate).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
              <Descriptions.Item label="Planned End">{trip.plannedEndDate ? dayjs(trip.plannedEndDate).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
            </Descriptions>

            <Card title="Update Status & Times" size="small" style={{ marginTop: 20 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>Current Status: </Text>
                  <Tag color={statusColors[trip.status]}>{trip.status}</Tag>
                </div>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Change Status:</Text>
                    <Select style={{ width: '100%' }} value={newStatus} onChange={setNewStatus}>
                      {Object.keys(statusColors).map(status => (
                        <Option key={status} value={status}>{status}</Option>
                      ))}
                    </Select>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={12}>
                    <Text strong>Actual Start Time:</Text>
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      value={actualStart}
                      onChange={setActualStart}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong>Actual End Time:</Text>
                    <DatePicker
                      showTime
                      style={{ width: '100%' }}
                      value={actualEnd}
                      onChange={setActualEnd}
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>

          <Col span={8}>
            <Card title="Cargo & Notes" size="small">
              <Text strong>Description:</Text>
              <p>{trip.cargoDescription || 'No description provided'}</p>
              <Divider />
              <Text strong>Notes:</Text>
              <p>{trip.notes || 'No notes'}</p>
            </Card>
          </Col>
        </Row>
      </Spin>
    </Modal>
  );
};

export default TripDetails;
