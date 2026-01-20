import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout, Menu, Card, Row, Col, Typography, Button, Badge, List, Avatar,
  Tag, Space, Input, Dropdown, message, Modal, Upload, Empty, Spin
} from 'antd';
import {
  ShoppingCartOutlined,
  MedicineBoxOutlined,
  HistoryOutlined,
  HeartOutlined,
  ArrowRightOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  FileTextOutlined,
  PlusOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../contexts/AuthContext';
import { medicinesAPI, ordersAPI, cartAPI } from '../../../services/api';
import './styles.css';

const { Title, Text } = Typography;
const { Dragger } = Upload;

const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prescriptionModalVisible, setPrescriptionModalVisible] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [cart, setCart] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [recommendedMeds, setRecommendedMeds] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data from backend on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      console.log('Loading dashboard data...');

      // Load recent orders
      try {
        console.log('Fetching orders...');
        const ordersResponse = await ordersAPI.getAll(1, 5);
        console.log('Orders response:', ordersResponse.data);
        setRecentOrders(ordersResponse.data.data?.orders || []);
      } catch (orderError) {
        console.error('Orders API error:', orderError.response?.data || orderError.message);
        // Don't show error for orders, just leave empty
      }

      // Load recommended medicines
      try {
        console.log('Fetching medicines...');
        const medsResponse = await medicinesAPI.search('', {}, 1, 8);
        console.log('Medicines response:', medsResponse.data);
        setRecommendedMeds(medsResponse.data.medicines || []);
      } catch (medsError) {
        console.error('Medicines API error:', medsError.response?.data || medsError.message);
        // Don't show error for medicines, just leave empty
      }

      // Load cart
      try {
        console.log('Fetching cart...');
        const cartResponse = await cartAPI.getCart();
        console.log('Cart response:', cartResponse.data);
        setCart(cartResponse.data.items || {});
      } catch (cartError) {
        console.error('Cart API error:', cartError.response?.data || cartError.message);
        // If cart API fails, try localStorage as fallback
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
      }
    } catch (error) {
      console.error('General dashboard error:', error);
      // Only show error if all APIs fail
      if (recentOrders.length === 0 && recommendedMeds.length === 0) {
        message.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (medicine) => {
    if (medicine.requiresPrescription) {
      setSelectedMedicine(medicine);
      setPrescriptionModalVisible(true);
      return;
    }

    try {
      // Try to add via API first
      await cartAPI.addItem(medicine._id, 1);
      message.success(`${medicine.name} added to cart`);

      // Refresh cart data
      const cartResponse = await cartAPI.getCart();
      setCart(cartResponse.data.items || {});
    } catch (error) {
      // Fallback to localStorage if API fails
      console.error('API cart add failed, using localStorage:', error);
      const newCart = { ...cart };
      if (newCart[medicine._id]) {
        newCart[medicine._id].quantity += 1;
      } else {
        newCart[medicine._id] = {
          ...medicine,
          quantity: 1,
          addedAt: new Date().toISOString()
        };
      }

      setCart(newCart);
      localStorage.setItem('cart', JSON.stringify(newCart));
      message.success(`${medicine.name} added to cart`);
    }
  };

  const handlePrescriptionUpload = (file) => {
    // In a real app, you would upload the file to your server
    message.success('Prescription uploaded successfully');
    setPrescriptionModalVisible(false);

    if (selectedMedicine) {
      handleAddToCart(selectedMedicine);
    }
  };

  const getCartCount = () => {
    return Object.values(cart).reduce((total, item) => total + item.quantity, 0);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <Spin size="large" />
        <div style={{ marginLeft: '16px' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="customer-dashboard" style={{ background: '#f5f7fa', minHeight: '100vh', padding: '24px' }}>
      <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', marginBottom: '24px' }}>
        <h1>Customer Dashboard - Test Version</h1>
        <p>Welcome back, {user?.firstName || 'Customer'}!</p>

        {/* Debug info */}
        <div style={{
          background: '#fff3cd',
          border: '1px solid #ffeaa7',
          padding: '8px',
          borderRadius: '4px',
          marginBottom: '16px'
        }}>
          <strong>Debug Info:</strong><br />
          Loading: {loading.toString()}<br />
          Orders: {recentOrders.length}<br />
          Medicines: {recommendedMeds.length}<br />
          Cart items: {Object.keys(cart).length}<br />
          User: {JSON.stringify(user)}
        </div>

        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/medicines')}
            style={{ padding: '8px 16px', background: '#1890ff', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Browse Medicines
          </button>
          <button
            onClick={() => navigate('/customer/orders')}
            style={{ padding: '8px 16px', background: '#52c41a', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            View Orders
          </button>
          <button
            onClick={() => navigate('/customer/prescriptions')}
            style={{ padding: '8px 16px', background: '#fa8c16', color: 'white', border: 'none', borderRadius: '4px' }}
          >
            Prescriptions
          </button>
        </div>

        <div style={{ background: '#f0f0f0', padding: '16px', borderRadius: '4px' }}>
          <h3>Quick Actions</h3>
          <p>This is a simplified version to test if the page renders correctly.</p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
