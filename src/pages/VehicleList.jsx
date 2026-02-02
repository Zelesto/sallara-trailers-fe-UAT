// In VehicleList.jsx - Fix the syntax error and update the columns definition
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Input, Select,
  Modal, message, Popconfirm, Row, Col, Tooltip, Spin,
  Badge, Avatar, Statistic, Progress
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  CarOutlined,
  SearchOutlined,
  FilterOutlined,
  ReloadOutlined,
  ExportOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  ToolOutlined,
  SafetyCertificateOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import vehicleService from '../services/vehicleService';
import VehicleForm from './VehicleForm';

const { Search } = Input;
const { Option } = Select;

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
  HYBRID: 'purple'
};

const VehicleList = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [makeFilter, setMakeFilter] = useState('all');

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState(null);

  const [makes, setMakes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    maintenance: 0,
    inactive: 0
  });

  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
    showSizeChanger: true,
    showQuickJumper: true,
    pageSizeOptions: ['10', '20', '50', '100']
  });

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔄 VehicleList: Fetching vehicles...');
      const response = await vehicleService.getAllVehicles();
      console.log('✅ VehicleList: Response received:', response);

      const vehiclesData = response || [];
      console.log(`✅ VehicleList: Received ${vehiclesData.length} vehicles`);

      if (vehiclesData.length > 0) {
        console.log('📋 VehicleList: First vehicle fields:', Object.keys(vehiclesData[0]));
        console.log('📋 VehicleList: First vehicle data:', vehiclesData[0]);
      }

      setVehicles(vehiclesData);

      // Extract unique makes for filter
      const uniqueMakes = [...new Set(vehiclesData.map(v => v.make).filter(Boolean))];
      console.log('✅ VehicleList: Unique makes found:', uniqueMakes);
      setMakes(uniqueMakes);

      // Calculate statistics
      const statsData = {
        total: vehiclesData.length,
        active: vehiclesData.filter(v => v.status === 'ACTIVE').length,
        maintenance: vehiclesData.filter(v => v.status === 'MAINTENANCE').length,
        inactive: vehiclesData.filter(v => v.status === 'INACTIVE').length
      };
      console.log('📊 VehicleList: Stats calculated:', statsData);
      setStats(statsData);

      setPagination(prev => ({
        ...prev,
        total: vehiclesData.length,
        current: 1
      }));
    } catch (err) {
      console.error('❌ VehicleList: Error fetching vehicles:', err);
      message.error(`Failed to load vehicles: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  const handleTableChange = (newPagination) => {
    setPagination(newPagination);
  };

  const handleSearch = (value) => {
    setSearchText(value);
  };

  const handleViewDetails = (vehicle) => {
    console.log('📍 VehicleList: Navigating to vehicle details - Full vehicle object:', vehicle);
    console.log('📍 VehicleList: Vehicle ID:', vehicle.id);
    console.log('📍 VehicleList: Registration Number:', vehicle.registrationNumber);
    console.log('📍 VehicleList: Make/Model:', vehicle.make, vehicle.model);

    if (!vehicle.id) {
      console.error('❌ VehicleList: Vehicle has no ID!', vehicle);
      message.error('Cannot view details: Vehicle ID is missing');
      return;
    }

    navigate(`/vehicles/${vehicle.id}`);
  };

  const handleEditVehicle = (vehicle) => {
    console.log('✏️ VehicleList: Opening edit modal for vehicle:', vehicle.id);
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  const handleDeleteClick = (vehicle) => {
    console.log('🗑️ VehicleList: Opening delete confirmation for vehicle:', vehicle.id);
    setVehicleToDelete(vehicle);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    if (!vehicleToDelete) return;

    try {
      console.log('🗑️ VehicleList: Deleting vehicle:', vehicleToDelete.id);
      await vehicleService.deleteVehicle(vehicleToDelete.id);
      message.success('Vehicle deleted successfully');
      fetchVehicles();
      setDeleteModalVisible(false);
      setVehicleToDelete(null);
    } catch (err) {
      console.error('❌ VehicleList: Error deleting vehicle:', err);
      message.error('Failed to delete vehicle');
    }
  };

  const calculateServiceProgress = (vehicle) => {
    if (!vehicle.currentOdometer || !vehicle.lastServiceOdometer || !vehicle.serviceIntervalKm) {
      return null;
    }

    const kmSinceService = vehicle.currentOdometer - vehicle.lastServiceOdometer;
    const progress = (kmSinceService / vehicle.serviceIntervalKm) * 100;
    return Math.min(100, Math.max(0, progress));
  };

  const getVehicleAvatar = (make) => {
    const colors = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#f5222d'];
    const color = colors[make?.charCodeAt(0) % colors.length] || '#1890ff';
    return {
      style: { backgroundColor: color },
      children: make?.charAt(0)?.toUpperCase() || 'V'
    };
  };

  const handleAddVehicle = () => {
    console.log('➕ VehicleList: Add Vehicle button clicked');
    setShowCreateModal(true);
  };

  const handleVehicleFormSuccess = () => {
    console.log('✅ VehicleList: Vehicle form completed successfully');
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedVehicle(null);
    fetchVehicles();
  };

  const handleVehicleFormCancel = () => {
    console.log('❌ VehicleList: Vehicle form cancelled');
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedVehicle(null);
  };

  const columns = useMemo(() => [
    {
      title: 'Vehicle',
      key: 'vehicle',
      width: 220,
      render: (_, record) => {
        console.log('📊 VehicleList: Rendering row for vehicle:', {
          id: record.id,
          registrationNumber: record.registrationNumber,
          make: record.make,
          model: record.model
        });

        return (
          <Space>
            <Avatar {...getVehicleAvatar(record.make)} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {record.registrationNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {record.fleetNumber ? `Fleet #${record.fleetNumber}` : 'No Fleet #'}
              </div>
            </div>
          </Space>
        );
      },
      sorter: (a, b) => (a.registrationNumber || '').localeCompare(b.registrationNumber || '')
    },
    {
      title: 'Make & Model',
      key: 'makeModel',
      width: 180,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>{record.make || 'N/A'}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>{record.model || 'N/A'}</div>
          <Tag color={fuelTypeColors[record.fuelType] || 'default'} style={{ fontSize: '10px', marginTop: '4px' }}>
            {record.fuelType || 'N/A'}
          </Tag>
        </div>
      ),
      sorter: (a, b) => (a.make || '').localeCompare(b.make || '')
    },
    {
      title: 'Mileage',
      key: 'mileage',
      width: 140,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: '500' }}>
            {record.currentOdometer ? `${record.currentOdometer.toLocaleString()} km` : 'N/A'}
          </div>
          {record.currentMileage && (
            <div style={{ fontSize: '11px', color: '#666' }}>
              Fuel: {record.currentMileage.toFixed(1)} L
            </div>
          )}
        </div>
      ),
      sorter: (a, b) => (a.currentOdometer || 0) - (b.currentOdometer || 0)
    },
    {
      title: 'Service',
      key: 'service',
      width: 180,
      render: (_, record) => {
        const progress = calculateServiceProgress(record);
        return (
          <div>
            <div style={{ fontSize: '12px' }}>
              {record.lastServiceDate ? dayjs(record.lastServiceDate).format('MMM DD') : 'No Service'}
            </div>
            {progress !== null && (
              <div style={{ marginTop: '4px' }}>
                <Progress
                  percent={progress}
                  size="small"
                  status={progress > 80 ? 'exception' : progress > 60 ? 'active' : 'normal'}
                  strokeColor={progress > 80 ? '#f5222d' : progress > 60 ? '#fa8c16' : '#52c41a'}
                />
                <div style={{ fontSize: '10px', color: '#666', textAlign: 'center' }}>
                  {record.serviceIntervalKm ? `${record.serviceIntervalKm} km interval` : 'No interval'}
                </div>
              </div>
            )}
          </div>
        );
      }
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status, record) => (
        <Space direction="vertical" size={2}>
          <Tag
            color={statusColors[status] || 'default'}
            style={{ margin: 0 }}
            icon={status === 'MAINTENANCE' ? <ToolOutlined /> : null}
          >
            {status || 'UNKNOWN'}
          </Tag>
          {record.maintenanceStatus && (
            <Tag color="orange" style={{ fontSize: '10px', margin: 0 }}>
              {record.maintenanceStatus}
            </Tag>
          )}
        </Space>
      ),
      filters: Object.keys(statusColors).map(status => ({
        text: status,
        value: status
      })),
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Insurance',
      key: 'insurance',
      width: 120,
      render: (_, record) => (
        <div>
          {record.insuranceExpiry ? (
            dayjs(record.insuranceExpiry).isBefore(dayjs()) ? (
              <Badge status="error" text="Expired" />
            ) : dayjs(record.insuranceExpiry).diff(dayjs(), 'days') < 30 ? (
              <Badge status="warning" text="Soon" />
            ) : (
              <Badge status="success" text="Valid" />
            )
          ) : (
            <Badge status="default" text="No Data" />
          )}
          {record.insuranceExpiry && (
            <div style={{ fontSize: '10px', color: '#666', marginTop: '2px' }}>
              {dayjs(record.insuranceExpiry).format('MMM DD')}
            </div>
          )}
        </div>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleViewDetails(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEditVehicle(record)}
            />
          </Tooltip>
          <Tooltip title="Dashboard">
            <Button
              type="text"
              size="small"
              icon={<DashboardOutlined />}
              onClick={() => navigate(`/vehicles/${record.id}/dashboard`)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Vehicle"
            description="Are you sure to delete this vehicle?"
            onConfirm={() => handleDeleteClick(record)}
            okText="Yes"
            cancelText="No"
            icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
          >
            <Tooltip title="Delete">
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      )
    }
  ], [navigate]);

  const filteredVehicles = useMemo(() => {
    let result = vehicles;

    // Apply search filter
    if (searchText) {
      const search = searchText.toLowerCase();
      result = result.filter(vehicle =>
        (vehicle.registrationNumber || '').toLowerCase().includes(search) ||
        (vehicle.make || '').toLowerCase().includes(search) ||
        (vehicle.model || '').toLowerCase().includes(search) ||
        (vehicle.vin || '').toLowerCase().includes(search) ||
        (vehicle.fleetNumber || '').toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      result = result.filter(vehicle => vehicle.status === statusFilter);
    }

    // Apply make filter
    if (makeFilter !== 'all') {
      result = result.filter(vehicle => vehicle.make === makeFilter);
    }

    console.log(`🔍 VehicleList: Filtered to ${result.length} vehicles`);
    return result;
  }, [vehicles, searchText, statusFilter, makeFilter]);

  const StatCard = ({ title, value, color, icon }) => (
    <Card size="small" style={{ textAlign: 'center' }}>
      <Statistic
        title={title}
        value={value}
        styles={{
          content: { color }
        }}
        prefix={icon}
      />
    </Card>
  );

  return (
    <div style={{ padding: '24px' }}>
      {/* Debug info - remove in production */}
      <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4 }}>
        <strong>Debug Info:</strong> Vehicles loaded: {vehicles.length} | Create Modal: {showCreateModal.toString()} | Edit Modal: {showEditModal.toString()}
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card>
            <Row gutter={16}>
              <Col xs={24} sm={6}>
                <StatCard
                  title="Total Vehicles"
                  value={stats.total}
                  color="#1890ff"
                  icon={<CarOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <StatCard
                  title="Active"
                  value={stats.active}
                  color="#52c41a"
                  icon={<CheckCircleOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <StatCard
                  title="Maintenance"
                  value={stats.maintenance}
                  color="#fa8c16"
                  icon={<ToolOutlined />}
                />
              </Col>
              <Col xs={24} sm={6}>
                <StatCard
                  title="Inactive"
                  value={stats.inactive}
                  color="#f5222d"
                  icon={<ExclamationCircleOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Space>
            <CarOutlined />
            <span>Vehicle Fleet Management</span>
            <Badge count={vehicles.length} showZero />
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ExportOutlined />}
              onClick={() => message.info('Export feature coming soon!')}
            >
              Export
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={fetchVehicles}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAddVehicle}
            >
              Add Vehicle
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search by reg, VIN, fleet #..."
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              size="middle"
            />
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Status"
              value={statusFilter}
              onChange={setStatusFilter}
              allowClear
              onClear={() => setStatusFilter('all')}
            >
              <Option value="all">All Statuses</Option>
              {Object.keys(statusColors).map(status => (
                <Option key={status} value={status}>{status}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6} md={4}>
            <Select
              style={{ width: '100%' }}
              placeholder="Filter by Make"
              value={makeFilter}
              onChange={setMakeFilter}
              allowClear
              onClear={() => setMakeFilter('all')}
            >
              <Option value="all">All Makes</Option>
              {makes.map(make => (
                <Option key={make} value={make}>{make}</Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText('');
                setStatusFilter('all');
                setMakeFilter('all');
              }}
              block
            >
              Clear All Filters
            </Button>
          </Col>
        </Row>

        <Table
          rowKey="id"
          columns={columns}
          dataSource={filteredVehicles}
          pagination={{
            ...pagination,
            total: filteredVehicles.length,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} vehicles`
          }}
          loading={loading}
          onChange={handleTableChange}
          scroll={{ x: 1300 }}
          rowClassName={(record) => {
            if (record.status === 'MAINTENANCE') return 'maintenance-row';
            if (record.status === 'INACTIVE') return 'inactive-row';
            if (record.insuranceExpiry && dayjs(record.insuranceExpiry).isBefore(dayjs())) {
              return 'insurance-expired-row';
            }
            return '';
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <CarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                <div>No vehicles found</div>
                <Button
                  type="primary"
                  onClick={handleAddVehicle}
                  style={{ marginTop: 16 }}
                >
                  <PlusOutlined /> Add Your First Vehicle
                </Button>
              </div>
            )
          }}
        />
      </Card>

      {/* Create Vehicle Modal */}
      <Modal
        title="Add New Vehicle"
        open={showCreateModal}
        onCancel={handleVehicleFormCancel}
        footer={null}
        width={800}
        destroyOnClose
        maskClosable={false}
        afterClose={() => console.log('🚪 VehicleList: Create modal closed')}
      >
        <VehicleForm
          mode="create"
          onSuccess={handleVehicleFormSuccess}
          onCancel={handleVehicleFormCancel}
        />
      </Modal>

      {/* Edit Vehicle Modal */}
      <Modal
        title="Edit Vehicle"
        open={showEditModal}
        onCancel={handleVehicleFormCancel}
        footer={null}
        width={800}
        destroyOnClose
        maskClosable={false}
        afterClose={() => console.log('🚪 VehicleList: Edit modal closed')}
      >
        {selectedVehicle && (
          <VehicleForm
            mode="edit"
            vehicleId={selectedVehicle.id}
            initialData={selectedVehicle}
            onSuccess={handleVehicleFormSuccess}
            onCancel={handleVehicleFormCancel}
          />
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        title="Confirm Delete"
        open={deleteModalVisible}
        onOk={confirmDelete}
        onCancel={() => setDeleteModalVisible(false)}
        okText="Delete"
        okType="danger"
        cancelText="Cancel"
      >
        {vehicleToDelete && (
          <div>
            <p>Are you sure you want to delete this vehicle?</p>
            <Card size="small" style={{ marginTop: 16 }}>
              <Space>
                <Avatar {...getVehicleAvatar(vehicleToDelete.make)} />
                <div>
                  <strong>{vehicleToDelete.registrationNumber}</strong>
                  <div>{vehicleToDelete.make} {vehicleToDelete.model}</div>
                  <div>VIN: {vehicleToDelete.vin || 'N/A'}</div>
                </div>
              </Space>
            </Card>
            <p style={{ marginTop: 16, color: '#ff4d4f' }}>
              <ExclamationCircleOutlined /> This action cannot be undone.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
};

// Add custom styles
const style = document.createElement('style');
style.textContent = `
  .maintenance-row {
    background-color: #fff7e6 !important;
  }
  .inactive-row {
    background-color: #fff1f0 !important;
  }
  .insurance-expired-row {
    background-color: #fff0f0 !important;
  }
  .ant-table-row:hover {
    cursor: pointer;
    background-color: #fafafa !important;
  }
  .ant-table-thead > tr > th {
    background-color: #fafafa;
    font-weight: 600;
  }

  /* Debug styles */
  .debug-panel {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: #fff;
    border: 1px solid #ccc;
    padding: 10px;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 1000;
    font-size: 12px;
  }
`;
document.head.appendChild(style);

export default VehicleList;