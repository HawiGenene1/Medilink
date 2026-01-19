
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, InputNumber, Row, Col, Spin, Tag, Typography, Divider, Form, Upload, message, Breadcrumb } from 'antd';
import { ShoppingCartOutlined, ArrowLeftOutlined, UploadOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text, Paragraph } = Typography;

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [prescription, setPrescription] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        setLoading(true);
        // const res = await api.get(`/medicines/${id}`);
        // setMedicine(res.data);

        // MOCK DATA for dev
        setTimeout(() => {
          // Simulate finding the medicine based on ID (mock logic)
          const mockMedicines = {
            '1': { _id: '1', name: 'Paracetamol', manufacturer: 'EthioPharm', description: 'Effective pain reliever and fever reducer. Suitable for mild to moderate pain.', price: 50, imageUrl: '', category: 'otc', stock: 100, dosage: '500mg', requiresPrescription: false },
            '2': { _id: '2', name: 'Amoxicillin', manufacturer: 'Cadila', description: 'Broad-spectrum antibiotic used to treat various bacterial infections.', price: 120, imageUrl: '', category: 'prescription', stock: 50, dosage: '250mg', requiresPrescription: true },
            '3': { _id: '3', name: 'Vitamin C', manufacturer: 'SunPharma', description: 'Daily immune supplement.', price: 200, imageUrl: '', category: 'supplement', stock: 0, dosage: '1000mg', requiresPrescription: false },
          };
          setMedicine(mockMedicines[id] || mockMedicines['1']); // Fallback to 1 if not found in mock
          setLoading(false);
        }, 1000);

      } catch (err) {
        message.error('Failed to load medicine details');
        console.error(err);
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleAddToCart = async () => {
    if (medicine?.requiresPrescription && !prescription) {
      message.error('A prescription is required for this medicine');
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('medicineId', id);
      fd.append('quantity', quantity);
      if (prescription) fd.append('prescription', prescription);

      // await api.post('/cart', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      // Mock success
      setTimeout(() => {
        message.success('Added to cart successfully!');
        navigate('/cart'); // This route might need to be created/verified
        setUploading(false);
      }, 1000);

    } catch (err) {
      console.error(err);
      message.error('Failed to add to cart');
      setUploading(false);
    }
  };

  const handleQuantityChange = (value) => {
    if (value) setQuantity(value);
  };

  const beforeUpload = (file) => {
    const isPDFOrImage = file.type === 'application/pdf' || file.type.startsWith('image/');
    if (!isPDFOrImage) {
      message.error('You can only upload PDF or Image files!');
    }
    setPrescription(file); // Manually handle file state
    return false; // Prevent automatic upload
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '100px' }}><Spin size="large" /></div>;
  if (!medicine) return <div style={{ textAlign: 'center', padding: '100px' }}><Title level={4}>Medicine not found</Title></div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '16px' }}>
        <Button type="link" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>Back to Medicines</Button>
      </div>

      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Row gutter={[48, 24]}>
          <Col xs={24} md={10}>
            <div style={{ background: '#f5f5f5', padding: '24px', borderRadius: '8px', textAlign: 'center' }}>
              <img
                src={medicine.imageUrl || 'https://via.placeholder.com/400x400?text=Medicine+Image'}
                alt={medicine.name}
                style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          </Col>
          <Col xs={24} md={14}>
            <Title level={2} style={{ marginBottom: '8px' }}>{medicine.name}</Title>
            <Text type="secondary" style={{ fontSize: '16px' }}>{medicine.manufacturer}</Text>

            <div style={{ marginTop: '16px', marginBottom: '24px' }}>
              <Title level={3} type="primary" style={{ margin: 0, color: '#1890ff' }}>${medicine.price?.toFixed(2)}</Title>
              <div style={{ marginTop: '8px' }}>
                {medicine.stock > 0 ? <Tag color="green">In Stock</Tag> : <Tag color="red">Out of Stock</Tag>}
                {medicine.requiresPrescription && <Tag icon={<SafetyCertificateOutlined />} color="orange">Prescription Required</Tag>}
              </div>
            </div>

            <Divider />

            <Paragraph style={{ fontSize: '16px' }}>
              {medicine.description}
            </Paragraph>

            <div style={{ marginBottom: '24px' }}>
              <Text strong>Details:</Text>
              <ul style={{ paddingLeft: '20px', marginTop: '8px', color: '#666' }}>
                <li>Category: {medicine.category}</li>
                <li>Dosage: {medicine.dosage || 'N/A'}</li>
                <li>Available Stock: {medicine.stock} units</li>
              </ul>
            </div>

            {medicine.requiresPrescription && (
              <Card size="small" style={{ marginBottom: '24px', background: '#fff7e6', borderColor: '#ffd591' }}>
                <Text strong>Upload Prescription</Text>
                <Paragraph type="secondary" style={{ marginBottom: '12px', fontSize: '12px' }}>
                  A valid prescription is required to purchase this medication.
                </Paragraph>
                <Upload
                  beforeUpload={beforeUpload}
                  maxCount={1}
                  onRemove={() => setPrescription(null)}
                >
                  <Button icon={<UploadOutlined />}>Select File (PDF/Image)</Button>
                </Upload>
              </Card>
            )}

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '24px' }}>
              <div>
                <Text strong style={{ display: 'block', marginBottom: '4px' }}>Quantity</Text>
                <InputNumber
                  min={1}
                  max={medicine.stock}
                  value={quantity}
                  onChange={handleQuantityChange}
                  size="large"
                />
              </div>
              <div style={{ flex: 1 }}>
                {/* Spacer */}
                <Text style={{ display: 'block', marginBottom: '4px' }}>&nbsp;</Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  onClick={handleAddToCart}
                  disabled={medicine.stock === 0 || (medicine.requiresPrescription && !prescription)}
                  loading={uploading}
                  style={{ width: '100%', maxWidth: '200px' }}
                >
                  {medicine.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </div>

          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default MedicineDetail;
