import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select, DatePicker,
  Modal, message, Popconfirm, Row, Col, Empty, Tooltip, Spin
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DashboardOutlined,
  FilePdfOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { tripService } from '../services/tripService';
import TripForm from './TripForm';
import TripMetricsForm from './TripMetricsForm';
import TripDetails from './TripDetails';

const { Search } = Input;
const { Option } = Select;
const { RangePicker } = DatePicker;

const statusColors = {
  PLANNED: 'blue',
  ACTIVE: 'green',
  IN_PROGRESS: 'orange',
  COMPLETED: 'cyan',
  CLOSED: 'purple',
  CANCELLED: 'red'
};

const TripList = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState(null);

  const [selectedTrip, setSelectedTrip] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
  });

  const fetchTrips = useCallback(async (page = 0, size = pagination.pageSize) => {
    setLoading(true);
    try {
      const res = await tripService.getAllTrips(page, size);
      setTrips(res.content || []);
      setPagination(prev => ({
        ...prev,
        total: res.totalElements || 0,
        current: page + 1,
        pageSize: size
      }));
    } catch (err) {
      message.error(`Failed to load trips: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [pagination.pageSize]);

  useEffect(() => {
    fetchTrips(0);
  }, [fetchTrips]);

  const handleTableChange = (newPagination) => {
    fetchTrips(newPagination.current - 1, newPagination.pageSize);
  };

  const handleDownloadReport = async () => {
    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: dateRange?.[1]?.format('YYYY-MM-DD'),
      };
      const response = await tripService.downloadReport(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `trip-report-${dayjs().format('YYYYMMDD')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      message.error('Failed to download report');
    }
  };

  const handleViewTrip = (trip) => {
    setSelectedTrip(trip);
    setShowDetailsModal(true);
  };

  const handleEditTrip = (trip) => {
    setSelectedTrip(trip);
    setShowEditModal(true);
  };

  const handleOpenMetrics = (trip) => {
    setSelectedTrip(trip);
    setShowMetricsModal(true);
  };

  const handleFinalizeTrip = async (id) => {
    try {
      await tripService.finalizeTrip(id);
      message.success('Trip finalized successfully');
      fetchTrips(pagination.current - 1);
    } catch (err) {
      message.error('Failed to finalize trip');
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      await tripService.deleteTrip(id);
      message.success('Trip deleted successfully');
      fetchTrips(0);
    } catch (err) {
      message.error('Failed to delete trip');
    }
  };

  const columns = useMemo(() => [
    {
      title: 'Trip Number',
      dataIndex: 'tripNumber',
      key: 'tripNumber',
      sorter: (a, b) => (a.tripNumber || '').localeCompare(b.tripNumber || '')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: s => s ? <Tag color={statusColors[s]}>{s.replace('_', ' ')}</Tag> : '-'
    },
    { title: 'Origin', dataIndex: 'originLocation', key: 'originLocation' },
    { title: 'Destination', dataIndex: 'destinationLocation', key: 'destinationLocation' },
    {
      title: 'Start Date',
      dataIndex: 'plannedStartDate',
      key: 'plannedStartDate',
      render: d => d ? dayjs(d).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 250,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewTrip(record)} />
          </Tooltip>
          <Tooltip title="Metrics & Calculator">
            <Button type="text" icon={<DashboardOutlined />} onClick={() => handleOpenMetrics(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button type="text" icon={<EditOutlined />} onClick={() => handleEditTrip(record)} />
          </Tooltip>
          {record.status !== 'COMPLETED' && record.status !== 'CLOSED' && (
            <Tooltip title="Finalize">
              <Button type="text" icon={<CheckCircleOutlined />} onClick={() => handleFinalizeTrip(record.id)} />
            </Tooltip>
          )}
          <Popconfirm title="Delete this trip?" onConfirm={() => handleDeleteTrip(record.id)}>
            <Tooltip title="Delete">
              <Button type="text" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ], [fetchTrips, pagination.current]);

  const filteredTrips = useMemo(() => {
    return trips.filter(trip => {
      if (searchText) {
        const s = searchText.toLowerCase();
        const matchesSearch = 
          (trip.tripNumber || '').toLowerCase().includes(s) ||
          (trip.originLocation || '').toLowerCase().includes(s) ||
          (trip.destinationLocation || '').toLowerCase().includes(s);
        if (!matchesSearch) return false;
      }
      if (statusFilter !== 'all' && trip.status !== statusFilter) return false;
      if (dateRange?.length === 2 && trip.plannedStartDate) {
        const start = dayjs(trip.plannedStartDate);
        if (!start.isBetween(dateRange[0], dateRange[1], 'day', '[]')) return false;
      }
      return true;
    });
  }, [trips, searchText, statusFilter, dateRange]);

  return (
    <Card
      title="Trip Management"
      extra={
        <Space>
          <Button icon={<FilePdfOutlined />} onClick={handleDownloadReport}>Report</Button>
          <Button icon={<ReloadOutlined />} onClick={() => fetchTrips(pagination.current - 1)}>Refresh</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowCreateModal(true)}>
            Create Trip
          </Button>
        </Space>
      }
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8}>
          <Search placeholder="Search trips..." allowClear onSearch={setSearchText} onChange={e => setSearchText(e.target.value)} />
        </Col>
        <Col xs={24} sm={6}>
          <Select style={{ width: '100%' }} defaultValue="all" onChange={setStatusFilter}>
            <Option value="all">All Statuses</Option>
            {Object.keys(statusColors).map(status => <Option key={status} value={status}>{status}</Option>)}
          </Select>
        </Col>
        <Col xs={24} sm={10}>
          <RangePicker style={{ width: '100%' }} onChange={setDateRange} />
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={filteredTrips}
        pagination={pagination}
        loading={loading}
        onChange={handleTableChange}
      />

      {showCreateModal && (
        <TripForm visible={showCreateModal} onClose={() => setShowCreateModal(false)} onSuccess={() => fetchTrips(0)} />
      )}
      
      {showEditModal && selectedTrip && (
        <TripForm 
          visible={showEditModal} mode="edit" tripId={selectedTrip.id} initialData={selectedTrip} 
          onClose={() => setShowEditModal(false)} onSuccess={() => fetchTrips(pagination.current - 1)}
        />
      )}

      {showMetricsModal && selectedTrip && (
        <TripMetricsForm 
          visible={showMetricsModal} tripId={selectedTrip.id} 
          originLocation={selectedTrip.originLocation} destinationLocation={selectedTrip.destinationLocation}
          onClose={() => setShowMetricsModal(false)} onSuccess={() => fetchTrips(pagination.current - 1)}
        />
      )}

      {showDetailsModal && selectedTrip && (
        <TripDetails
          visible={showDetailsModal}
          tripId={selectedTrip.id}
          onClose={() => setShowDetailsModal(false)}
          onUpdate={() => fetchTrips(pagination.current - 1)}
        />
      )}
    </Card>
  );
};

export default TripList;
