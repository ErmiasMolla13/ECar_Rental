'use client'

import { Button, Col, Form, Input, Row, Space, Table, Select, Tabs, Image, Card, message, Tag, Statistic, Progress, Typography, Upload, Modal } from 'antd';
import { DeleteOutlined, SyncOutlined, CarOutlined, UserOutlined, DollarOutlined, CalendarOutlined, UploadOutlined, PlusOutlined } from '@ant-design/icons';
import React, { useEffect, useState } from 'react';
import { ToastContainer , toast } from 'react-toastify';

const { Title, Text } = Typography;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

const AdminDashboard = () => {
  const [allCarData, setAllCarData] = useState([]);
  const [bookedCars, setBookedCars] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [editingMode, setEditingMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customerLoading, setCustomerLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [owners, setOwners] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCars: 0,
    availableCars: 0,
    bookedCars: 0,
    weeklyRevenue: 0,
    totalCustomers: 0,
    totalOwners: 0,
    revenueData: [],
    recentRents: []
  });
  const [fileList, setFileList] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [addCarModalVisible, setAddCarModalVisible] = useState(false);

  useEffect(() => {
    getData();
    fetchBookedCars();
    fetchCustomers();
    fetchOwners();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [carsResponse, bookedResponse, customersResponse, ownersResponse, rentsResponse] = await Promise.all([
        fetch('/api/car'),
        fetch('/api/car?is_booked=true'),
        fetch('/api/customer/register'),
        fetch('/api/owner/owner_register'),
        fetch('/api/rent')
      ]);

      const allCars = await carsResponse.json();
      const bookedCars = await bookedResponse.json();
      const allCustomers = await customersResponse.json();
      const allOwners = await ownersResponse.json();
      const allRents = await rentsResponse.json();

      const weeklyRevenue = bookedCars.reduce((sum, car) => {
        try {
          const bookingInfo = typeof car.booking_info === 'string' ? 
            JSON.parse(car.booking_info) : car.booking_info;
          return sum + (bookingInfo?.total_price || 0);
        } catch {
          return sum;
        }
      }, 0);

      const revenueData = generateRevenueData(bookedCars);

      setDashboardStats({
        totalCars: allCars.length,
        availableCars: allCars.length - bookedCars.length,
        bookedCars: bookedCars.length,
        weeklyRevenue,
        totalCustomers: allCustomers.rows?.length || 0,
        totalOwners: allOwners.rows?.length || 0,
        revenueData,
        recentRents: allRents.rows?.slice(0, 5) || []
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error('Failed to load dashboard data');
    }
  };

  const generateRevenueData = (bookedCars) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  
  return days.map((day, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - index));
    
    const dayRevenue = bookedCars.reduce((sum, car) => {
      try {
        const bookingInfo = typeof car.booking_info === 'string' ? 
          JSON.parse(car.booking_info) : car.booking_info;
        
        if (bookingInfo?.pickup_date) {
          const pickupDate = new Date(bookingInfo.pickup_date);
          // Compare dates without time components
          if (
            pickupDate.getFullYear() === date.getFullYear() &&
            pickupDate.getMonth() === date.getMonth() &&
            pickupDate.getDate() === date.getDate()
          ) {
            return sum + (parseFloat(bookingInfo.total_price) || 0);
          }
        }
        return sum;
      } catch {
        return sum;
      }
    }, 0);
    
    return {
      name: day,
      revenue: dayRevenue
    };
  });
};

  const fetchOwners = async () => {
    setOwnerLoading(true);
    try {
      const response = await fetch('/api/owner/owner_register');
      if (!response.ok) throw new Error('Failed to fetch owners');
      const result = await response.json();
      setOwners(result.rows);
    } catch (error) {
      console.error("Owner fetch error:", error);
      toast.error(`Failed to load owners: ${error.message}`);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleDeleteOwner = async (ownerId, email) => {
    try {
      setOwnerLoading(true);
      const response = await fetch('/api/owner/owner_register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_id: ownerId, email })
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Failed to delete owner');
      }

      toast.success('Owner deleted successfully');
      await fetchOwners();
    } catch (error) {
      console.error("Error deleting owner:", error);
      toast.error(error.message || 'Failed to delete owner');
    } finally {
      setOwnerLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setCustomerLoading(true);
    try {
      const response = await fetch('/api/customer/register');
      if (!response.ok) throw new Error('Failed to fetch customers');
      const data = await response.json();
      setCustomers(data.rows);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error('Failed to load customers');
    } finally {
      setCustomerLoading(false);
    }
  };

  const handleDeleteCustomer = async (email) => {
    try {
      setCustomerLoading(true);
      const customerExists = customers.some(c => c.email === email);
      if (!customerExists) {
        throw new Error(`Customer with email ${email} not found in local data`);
      }

      const response = await fetch('/api/customer/register', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Server error: ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.message || 'Deletion failed on server');
      }

      toast.success(`Customer ${email} deleted successfully`);
      await fetchCustomers();
    } catch (error) {
      console.error("Deletion error details:", {
        emailAttempted: email,
        error: error.message,
        customerList: customers.map(c => c.email)
      });
      toast.error(`Deletion failed: ${error.message}`);
    } finally {
      setCustomerLoading(false);
    }
  };

  const fetchBookedCars = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/car?is_booked=true');
      if (!response.ok) throw new Error('Failed to fetch booked cars');
      const data = await response.json();
      setBookedCars(data);
    } catch (error) {
      console.error("Error fetching booked cars:", error);
      toast.error('Failed to load booked cars');
    } finally {
      setLoading(false);
    }
  };

  const unbookCar = async (carCode) => {
    setConfirmLoading(true);
    try {
      const response = await fetch('/api/car', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          car_code: carCode,
          is_booked: false,
          booking_info: null
        })
      });
      
      if (!response.ok) throw new Error('Failed to update car status');
      
      toast.success('Car marked as available successfully');
      await fetchBookedCars();
      await getData();
    } catch (error) {
      console.error("Error unbooking car:", error);
      toast.error('Failed to update car status');
    } finally {
      setConfirmLoading(false);
    }
  };

  const getData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/car?is_booked=false');
      if (!response.ok) throw new Error(`Response status: ${response.status}`);
      const data = await response.json();
      setAllCarData(data);
    } catch (error) {
      console.error("Error fetching car data:", error);
      toast.error('Failed to load car data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    const file = fileList[0];
    if (!file) {
      toast.error('Please select a file first!');
      return null;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/admin', {
        method: 'POST',
        body: formData,
      });
      const result = await response.json();
      
      if (result.success) {
        toast.success('Image uploaded successfully');
        form.setFieldsValue({ image: result.url });
        return result.url;
      } else {
        toast.error(result.error || 'Upload failed');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (record) => {
    form.setFieldsValue({
      car_code: record.car_code,
      make: record.make,
      model: record.model,
      rating: record.rating,
      description: record.description,
      price: record.price,
      image: record.image,
      year: record.year,
      car_type: record.car_type,
      owner_id: record.owner_id
    });
    setFileList([]);
    setEditingMode(true);
    setAddCarModalVisible(true);
  };

  const handleDelete = async (record) => {
    const isConfirmed = window.confirm(
      `Are you sure you want to delete ${record.make} ${record.model}?`
    );

    if (!isConfirmed) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/car`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ car_code: record.car_code })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Deletion failed');
      }

      toast.success('Car deleted successfully');
      await getData();
    } catch (error) {
      console.error('Full deletion error:', error);
      message.error(`Deletion failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearData = () => {
    form.resetFields();
    setFileList([]);
    setEditingMode(false);
  };

  const saveData = async (values) => {
    try {
      const response = await fetch('/api/car', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      
      toast.success('Car added successfully');
      await getData();
      clearData();
      setAddCarModalVisible(false);
    } catch (error) {
      console.error("Full error details:", error);
      toast.error(`Failed to save car: ${error.message}`);
    }
  };

  const updateData = async (values) => {
    try {
      setLoading(true);
      const response = await fetch('/api/car', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      toast.success('Car updated successfully');
      await getData();
      clearData();
      setAddCarModalVisible(false);
    } catch (error) {
      console.error("Error updating car:", error);
      toast.error(`Update failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values) => {
    try {
      const numericFields = {
        price: Number(values.price),
        rating: Number(values.rating),
        year: Number(values.year),
        owner_id: Number(values.owner_id)
      };

      if (isNaN(numericFields.price)) {
        toast.error('Please enter a valid price');
        return;
      }
      if (isNaN(numericFields.rating)) {
        toast.error('Please enter a valid rating');
        return;
      }
      if (isNaN(numericFields.year)) {
        toast.error('Please enter a valid year');
        return;
      }
      if (isNaN(numericFields.owner_id)) {
        toast.error('Please enter a valid owner ID');
        return;
      }

      const carData = {
        ...values,
        ...numericFields
      };

      if (fileList.length > 0) {
        const imageUrl = await handleUpload();
        if (!imageUrl) return;
        carData.image = imageUrl;
      } else if (!values.image) {
        toast.error('Please upload an image');
        return;
      }

      if (editingMode) {
        await updateData(carData);
      } else {
        await saveData(carData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      toast.error(`Failed to ${editingMode ? 'update' : 'add'} car: ${error.message}`);
    }
  };

  const columns = [
    { title: 'Car Code', dataIndex: 'car_code', key: 'car_code' },
    { title: 'Make', dataIndex: 'make', key: 'make' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price}` },
    { 
      title: 'Image', 
      dataIndex: 'image', 
      key: 'image', 
      render: (image) => <Image src={image} width={50} alt="Car" preview={false} />
    },
    { 
      title: 'Type', 
      dataIndex: 'car_type', 
      key: 'car_type',
      render: (type) => {
        switch(type) {
          case 'economic': return 'Economic';
          case 'middleclass': return 'Middle Class';
          case 'vip': return 'VIP Luxury';
          default: return type;
        }
      }
    },
    { 
      title: 'Rating', 
      dataIndex: 'rating', 
      key: 'rating',
      render: (rating) => rating?.toFixed(1) || 'N/A'
    },
    { 
      title: 'Owner ID', 
      dataIndex: 'owner_id', 
      key: 'owner_id'
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            size="small" 
            type="primary" 
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button 
            size="small" 
            type="primary" 
            danger 
            onClick={() => handleDelete(record)}
            loading={loading}
          >
            Delete
          </Button>
        </Space>
      ),
    }
  ];

  const bookedCarColumns = [
    { title: 'Car Code', dataIndex: 'car_code', key: 'car_code' },
    { title: 'Make', dataIndex: 'make', key: 'make' },
    { title: 'Model', dataIndex: 'model', key: 'model' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (price) => `$${price}` },
    { 
      title: 'Image', 
      key: 'image',
      render: (_, record) => (
        <Image 
          src={record.image} 
          width={100} 
          alt={`${record.make} ${record.model}`}
          preview={false}
        />
      )
    },
    { 
      title: 'Booking Info', 
      key: 'bookingInfo',
      render: (_, record) => {
        let bookingInfo = {};
        try {
          if (typeof record.booking_info === 'string') {
            bookingInfo = JSON.parse(record.booking_info);
          } else if (typeof record.booking_info === 'object') {
            bookingInfo = record.booking_info;
          }
        } catch (e) {
          console.error("Error parsing booking_info:", e);
        }

        const formatDate = (dateString) => {
          if (!dateString) return 'N/A';
          try {
            return new Date(dateString).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          } catch (e) {
            return dateString;
          }
        };

        return (
          <div className="space-y-1">
             <ToastContainer 
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        style={{ 
              zIndex: 999999,  
              position: 'fixed' 
  }}
      />
            <div className="flex">
              <span className="font-medium w-24">Customer:</span>
              <span>{bookingInfo.customer_name || 'Unknown'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">Email:</span>
              <span>{bookingInfo.email || 'N/A'}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">Pickup:</span>
              <span>{formatDate(bookingInfo.pickup_date)}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">Return:</span>
              <span>{formatDate(bookingInfo.return_date)}</span>
            </div>
            <div className="flex">
              <span className="font-medium w-24">Total:</span>
              <span>${bookingInfo.total_price?.toLocaleString() || '0'}</span>
            </div>
          </div>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Button 
          size="small" 
          type="primary" 
          onClick={() => unbookCar(record.car_code)}
          loading={confirmLoading}
        >
          Mark as Available
        </Button>
      ),
    }
  ];

  const customerColumns = [
    {
      title: 'Customer ID',
      dataIndex: 'custm_id',
      key: 'custm_id',
    },
    {
      title: 'Name',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email) => <span className="font-mono">{email}</span>
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (contact) => contact || 'N/A',
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (address) => address || 'N/A',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button  
          danger 
          size='small'
          onClick={() => handleDeleteCustomer(record.email)}
          icon={<DeleteOutlined/>}
          loading={customerLoading}
        />
      ),
    }
  ];

  const ownerColumns = [
    {
      title: 'ID',
      dataIndex: 'owner_id',
      key: 'owner_id',
      width: 80,
      sorter: (a, b) => a.owner_id - b.owner_id,
    },
    {
      title: 'Name',
      dataIndex: 'owner_name',
      key: 'name',
      filterSearch: true,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      filterSearch: true,
    },
    {
      title: 'Contact',
      dataIndex: 'contact',
      key: 'contact',
      render: (text) => text || <Tag color="gray">Not set</Tag>,
    },
    {
      title: 'Address',
      dataIndex: 'address',
      key: 'address',
      render: (text) => text || <Tag color="gray">Not set</Tag>,
      width: 200,
      ellipsis: true,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Button 
          danger 
          size="small"
          onClick={() => handleDeleteOwner(record.owner_id, record.email)}
          icon={<DeleteOutlined />}
          loading={ownerLoading}
        />
      ),
    }
  ];

  const rentColumns = [
    {
      title: 'Rent ID',
      dataIndex: 'rent_id',
      key: 'rent_id',
    },
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Car',
      key: 'car',
      render: (_, record) => (
        <span>
          {record.make} {record.model}
        </span>
      )
    },
    {
      title: 'Pickup Date',
      dataIndex: 'pickup_date',
      key: 'pickup_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Return Date',
      dataIndex: 'return_date',
      key: 'return_date',
      render: (date) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Rent Date',
      dataIndex: 'rent_date',
      key: 'rent_date',
      render: (date) => new Date(date).toLocaleDateString(),
    }
  ];

  const dashboardTab = (
    <div style={{ padding: 24 }}>
      <Title level={3}>Rental System Overview</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Cars"
              value={dashboardStats.totalCars}
              prefix={<CarOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Available Cars"
              value={dashboardStats.availableCars}
              prefix={<CarOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress 
              percent={Math.round((dashboardStats.availableCars / dashboardStats.totalCars) * 100)} 
              status="active" 
              showInfo={false}
              strokeColor="#52c41a"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Booked Cars"
              value={dashboardStats.bookedCars}
              prefix={<CarOutlined style={{ color: '#f5222d' }} />}
            />
            <Progress 
              percent={Math.round((dashboardStats.bookedCars / dashboardStats.totalCars) * 100)} 
              status="active" 
              showInfo={false}
              strokeColor="#f5222d"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Weekly Revenue"
              value={dashboardStats.weeklyRevenue}
              prefix={<DollarOutlined style={{ color: '#1890ff' }} />}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="System Statistics">
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Statistic
                    title="Total Customers"
                    value={dashboardStats.totalCustomers}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" style={{ marginBottom: 16 }}>
                  <Statistic
                    title="Total Owners"
                    value={dashboardStats.totalOwners}
                    prefix={<UserOutlined />}
                  />
                </Card>
              </Col>
            </Row>
           
<Card size="small" title="Recent Rentals">
  {dashboardStats.recentRents.length > 0 ? (
    dashboardStats.recentRents.map(rent => {
      // Safely parse dates
      const pickupDate = rent.pickup_date ? new Date(rent.pickup_date) : null;
      const returnDate = rent.return_date ? new Date(rent.return_date) : null;
      
      return (
        <div key={`${rent.rent_id}-${rent.pickup_date}`} style={{ marginBottom: 8 }}>
          <Text strong>Rent #{rent.rent_id}</Text>
          <br />
          <Text>Customer: {rent.customer_name}</Text>
          <br />
          <Text type="secondary">
            Pickup: {pickupDate && !isNaN(pickupDate) ? 
              pickupDate.toLocaleDateString() : 'N/A'}
          </Text>
          <br />
          <Text type="secondary">
            Return: {returnDate && !isNaN(returnDate) ? 
              returnDate.toLocaleDateString() : 'N/A'}
          </Text>
        </div>
      );
    })
  ) : (
    <Text type="secondary">No recent rentals found</Text>
  )}
</Card>
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={24}>
          <Card title="Quick Actions">
            <Space>
              <Button type="primary" icon={<CarOutlined />} onClick={() => setActiveTab('available')}>
                Manage Cars
              </Button>
              <Button icon={<UserOutlined />} onClick={() => setActiveTab('customers')}>
                View Customers
              </Button>
              <Button icon={<UserOutlined />} onClick={() => setActiveTab('owners')}>
                View Owners
              </Button>
              <Button icon={<CalendarOutlined />} onClick={() => setActiveTab('rents')}>
                View Rentals
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const items = [
    {
      key: 'dashboard',
      label: 'Dashboard',
      children: dashboardTab,
    },
   {
  key: 'available',
  label: 'Available Cars',
  children: (
    <div>
      <div className="pb-4 flex justify-between items-center">
        <div className="w-1/3">
          <Input.Search 
            placeholder="Search by make or model" 
            allowClear
            enterButton="Search"
            size="large"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            clearData();
            setAddCarModalVisible(true);
          }}
        >
          Add New Car
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={allCarData.filter(car => 
          car.make.toLowerCase().includes(searchText.toLowerCase()) ||
          car.model.toLowerCase().includes(searchText.toLowerCase())
        )} 
        rowKey="car_code"
        scroll={{ x: true }}
        loading={loading}
      />
    </div>
  ),
},
    {
      key: 'booked',
      label: 'Booked Cars',
      children: (
        <Table 
          columns={bookedCarColumns} 
          dataSource={bookedCars} 
          rowKey="car_code"
          scroll={{ x: true }}
          loading={loading}
        />
      ),
    },
    {
      key: 'customers',
      label: 'Customers',
      children: (
        <Table
          columns={customerColumns}
          dataSource={customers}
          rowKey="custm_id"
          scroll={{ x: true }}
          loading={customerLoading}
        />
      ),
    },
    {
      key: 'owners',
      label: 'Owners',
      children: (
        <div className="owner-tab-container">
          <div style={{ marginBottom: 16 }}>
            <Button 
              type="primary" 
              onClick={fetchOwners}
              loading={ownerLoading}
              icon={<SyncOutlined />}
            >
              Refresh Owners
            </Button>
          </div>
          <Table
            columns={ownerColumns}
            dataSource={owners}
            rowKey="owner_id"
            loading={ownerLoading}
            scroll={{ x: 1000 }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
            }}
          />
        </div>
      ),
    },
    {
      key: 'rents',
      label: 'Rent Management',
      children: (
        <Table
          columns={rentColumns}
          dataSource={dashboardStats.recentRents}
          rowKey={(record) => `${record.rent_id}-${record.pickup_date}`}
          loading={loading}
        />
      ),
    }
  ];

  return (
    <div style={{ padding: '20px' }}>
      <Tabs
        activeKey={activeTab}
        items={items}
        onChange={setActiveTab}
        tabBarStyle={{ marginBottom: '24px' }}
      />

      {/* Add/Edit Car Modal */}
      <Modal
        title={editingMode ? "Edit Car" : "Add New Car"}
        open={addCarModalVisible}
        onCancel={() => {
          setAddCarModalVisible(false);
          clearData();
        }}
        footer={null}
        width={800}
      >
        <Form
          {...formItemLayout}
          form={form}
          style={{ maxWidth: 600 }}
          onFinish={onFinish}
        >
          <Form.Item 
            label="Car Code" 
            name="car_code" 
            rules={[{ required: true, message: 'Please input car code!' }]}
          >
            <Input disabled={editingMode} />
          </Form.Item>

          <Form.Item label="Make" name="make" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Model" name="model" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <Form.Item 
            label="Description" 
            name="description" 
            rules={[{ required: true, message: 'Please enter a description' }]}
          >
            <Input.TextArea 
              rows={4} 
              placeholder="Enter car description" 
              maxLength={1000}
              showCount
            />
          </Form.Item>

          <Form.Item 
            label="Price" 
            name="price" 
            rules={[{ 
              required: true,
              message: 'Please enter a valid price'
            }]}
          >
            <Input type="number" step="0.01" onChange={(e) => {
              const value = parseFloat(e.target.value);
              form.setFieldsValue({ price: isNaN(value) ? '' : value });
            }} />
          </Form.Item>

          <Form.Item 
            label="Rating" 
            name="rating" 
            rules={[
              { 
                required: true, 
                message: 'Please input rating' 
              },
              () => ({
                validator(_, value) {
                  const numValue = Number(value);
                  if (isNaN(numValue) ){
                    return Promise.reject(new Error('Please enter a number'));
                  }
                  if (numValue < 0 || numValue > 5) {
                    return Promise.reject(new Error('Rating must be between 0 and 5'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input type="number" step="0.1" min={0} max={5} />
          </Form.Item>

          <Form.Item 
            label="Owner ID" 
            name="owner_id" 
            rules={[
              { 
                required: true, 
                message: 'Please input owner ID' 
              },
              () => ({
                validator(_, value) {
                  const numValue = Number(value);
                  if (isNaN(numValue)) {
                    return Promise.reject(new Error('Please enter a number'));
                  }
                  if (numValue < 1) {
                    return Promise.reject(new Error('Owner ID must be at least 1'));
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input type="number" min={1} />
          </Form.Item>

          <Form.Item label="Year" name="year" rules={[{ required: true, message: 'Please enter a valid year' }]}>
            <Input type="number" onChange={(e) => {
              const value = parseInt(e.target.value);
              form.setFieldsValue({ year: isNaN(value) ? '' : value });
            }} />
          </Form.Item>

          <Form.Item label="Car Image" name="image" rules={[{ required: true, message: 'Please upload an image' }]}>
            <div>
              <Upload
                fileList={fileList}
                beforeUpload={(file) => {
                  const isImage = file.type.startsWith('image/');
                  if (!isImage) {
                    toast.error('You can only upload image files!');
                    return Upload.LIST_IGNORE;
                  }
                  
                  const isLt2M = file.size / 1024 / 1024 < 2;
                  if (!isLt2M) {
                    toast.error('Image must be smaller than 2MB!');
                    return Upload.LIST_IGNORE;
                  }
                  
                  setFileList([file]);
                  return false;
                }}
                onRemove={() => {
                  setFileList([]);
                  form.setFieldsValue({ image: '' });
                }}
                listType="picture"
                maxCount={1}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Select Image</Button>
              </Upload>
              {fileList.length > 0 && (
                <Button
                  type="primary"
                  onClick={handleUpload}
                  loading={uploading}
                  style={{ marginTop: 8 }}
                  disabled={!fileList.length}
                >
                  {uploading ? 'Uploading' : 'Upload Image'}
                </Button>
              )}
              {form.getFieldValue('image') && !fileList.length && (
                <div style={{ marginTop: 8 }}>
                  <Image 
                    src={form.getFieldValue('image')} 
                    width={100} 
                    preview={false} 
                    alt="Car preview"
                  />
                  <Button 
                    danger 
                    size="small" 
                    onClick={() => form.setFieldsValue({ image: '' })}
                    style={{ marginLeft: 8 }}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </Form.Item>

          <Form.Item label="Car Type" name="car_type" rules={[{ required: true, message: 'Please enter car type' }]}>
            <Select placeholder="Select car type">
              <Select.Option value="economic">Economic</Select.Option>
              <Select.Option value="middleclass">Middle Class</Select.Option>
              <Select.Option value="vip">VIP Luxury</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item wrapperCol={{ offset: 6, span: 16 }}>
            <Button type="primary" htmlType="submit" loading={loading}>
              {editingMode ? 'Update' : 'Save'}
            </Button>
            <Button 
              style={{ marginLeft: 8 }} 
              onClick={() => {
                setAddCarModalVisible(false);
                clearData();
              }}
            >
              Cancel
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminDashboard;