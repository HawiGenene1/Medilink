
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Spinner } from 'react-bootstrap';
import { Search, Filter, Plus } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import './MedicineList.css';

const MedicineList = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    sort: 'name',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    const fetchMedicines = async () => {
      setLoading(true);
      try {
        const response = await api.get('/medicines', { params: filters });
        // Handle both direct array and { success: true, data: [...] } structures
        const medicineData = Array.isArray(response.data) ? response.data : (response.data?.data || []);
        setMedicines(medicineData);
      } catch (error) {
        console.error('Error fetching medicines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <Spinner animation="border" />;
  }

  return (
    <Container className="my-4" style={{ paddingTop: '100px' }}>
      <h2 className="mb-4">Browse Medicines</h2>

      {/* Search and Filter Section */}
      <Card className="mb-4">
        <Card.Body>
          <Form>
            <Row>
              <Col md={9}>
                <Form.Group>
                  <Form.Label><Search /> Search Medicines</Form.Label>
                  <Form.Control
                    type="text"
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    placeholder="Search by name, manufacturer, etc."
                  />
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label><Filter /> Category</Form.Label>
                  <Form.Select
                    name="category"
                    value={filters.category}
                    onChange={handleFilterChange}
                  >
                    <option value="">All Categories</option>
                    <option value="prescription">Prescription</option>
                    <option value="otc">Over the Counter</option>
                    <option value="supplement">Supplements</option>
                    <option value="equipment">Medical Equipment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      {/* Medicine Grid */}
      <Row xs={1} md={2} lg={4} className="g-4">
        {Array.isArray(medicines) && medicines.map(medicine => (
          <Col key={medicine._id}>
            <Card className="h-100">
              <Card.Img
                variant="top"
                src={(medicine.images && medicine.images[0]) || medicine.imageUrl || '/images/medicine-placeholder.jpg'}
                alt={medicine.name}
                style={{ height: '160px', objectFit: 'cover' }}
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title>{medicine.name}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {medicine.manufacturer}
                </Card.Subtitle>
                <Card.Text>
                  {medicine.description?.substring(0, 100)}...
                </Card.Text>
                <div className="d-flex justify-content-between align-items-center mt-auto">
                  <h6 className="mb-0 fw-bold">
                    ETB {(medicine.price?.basePrice || medicine.price || 0).toFixed(2)}
                  </h6>
                  <Button
                    variant="primary"
                    as={Link}
                    to={`/medicines/${medicine._id}`}
                    className="view-details-btn"
                  >
                    View Details
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default MedicineList;