import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Form, Spinner, Alert } from 'react-bootstrap';
import api from '../../services/api';

const MedicineDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [prescription, setPrescription] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchMedicine = async () => {
      try {
        const res = await api.get(`/medicines/${id}`);
        setMedicine(res.data);
      } catch (err) {
        setError('Failed to load medicine details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedicine();
  }, [id]);

  const handleAddToCart = async () => {
    if (medicine?.requiresPrescription && !prescription) {
      setError('A prescription is required for this medicine');
      return;
    }
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append('medicineId', id);
      fd.append('quantity', quantity);
      if (prescription) fd.append('prescription', prescription);
      await api.post('/cart', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate('/cart');
    } catch (err) {
      console.error(err);
      setError('Failed to add to cart');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="d-flex justify-content-center my-5"><Spinner animation="border" /></div>;
  if (!medicine) return <div className="my-5">Medicine not found</div>;

  return (
    <Container className="my-4">
      <Button variant="link" onClick={() => navigate(-1)} className="mb-3">&larr; Back to Medicines</Button>
      <Row>
        <Col md={6}>
          <Card>
            <Card.Img variant="top" src={medicine.imageUrl || '/images/medicine-placeholder.jpg'} alt={medicine.name} style={{ maxHeight: 500, objectFit: 'contain' }} />
          </Card>
        </Col>
        <Col md={6}>
          <Card>
            <Card.Body>
              <Card.Title className="display-6">{medicine.name}</Card.Title>
              <Card.Subtitle className="mb-3 text-muted">{medicine.manufacturer}</Card.Subtitle>
              <div className="mb-4">
                <h3 className="text-primary">${medicine.price?.toFixed(2)}</h3>
                <span className={`badge ${medicine.stock > 0 ? 'bg-success' : 'bg-danger'}`}>{medicine.stock > 0 ? 'In Stock' : 'Out of Stock'}</span>
                {medicine.requiresPrescription && <span className="badge bg-warning text-dark ms-2">Prescription Required</span>}
              </div>
              <Card.Text className="mb-4">{medicine.description}</Card.Text>
              <div className="mb-4"><h5>Details</h5><ul><li>Category: {medicine.category}</li><li>Dosage: {medicine.dosage || 'N/A'}</li><li>Stock: {medicine.stock} units available</li></ul></div>
              {medicine.requiresPrescription && (
                <div className="mb-4">
                  <h5>Upload Prescription</h5>
                  <Form.Group controlId="prescription" className="mb-3">
                    <Form.Label>Prescription (PDF or Image)</Form.Label>
                    <Form.Control type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setPrescription(e.target.files[0])} />
                    <Form.Text className="text-muted">A valid prescription is required for this medication.</Form.Text>
                  </Form.Group>
                </div>
              )}
              <div className="d-flex align-items-center mb-4">
                <Form.Group className="me-3" style={{ width: '100px' }}>
                  <Form.Label>Quantity</Form.Label>
                  <Form.Control type="number" min={1} max={medicine.stock} value={quantity} onChange={(e) => setQuantity(Math.min(Number(e.target.value || 1), medicine.stock))} />
                </Form.Group>
                <Button variant="primary" size="lg" onClick={handleAddToCart} disabled={medicine.stock === 0 || (medicine.requiresPrescription && !prescription)}>{uploading ? 'Adding...' : 'Add to Cart'}</Button>
              </div>
              {error && <Alert variant="danger">{error}</Alert>}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default MedicineDetail;
