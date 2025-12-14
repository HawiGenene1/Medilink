import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Form,
  InputGroup,
  Spinner,
  Badge,
  Placeholder
} from 'react-bootstrap';
import { Search, Star } from 'react-bootstrap-icons';
import api from '../../services/api';
import './MedicineList.css';

const MedicineList = () => {
  // State declarations
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [isSearching, setIsSearching] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    priceRange: { min: 0, max: 1000 }
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    category: '',
    minPrice: '',
    maxPrice: 1000,
    inStock: false,
    requiresPrescription: false,
    discountOnly: false
  });
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    hasMore: false
  });

  // Fetch filter options on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await api.get('/medicines/filters');
        if (response.data.success) {
          setFilterOptions({
            categories: response.data.data.categories || [],
            priceRange: {
              min: response.data.data.priceRange?.min || 0,
              max: response.data.data.priceRange?.max || 1000
            }
          });
        }
      } catch (err) {
        console.error('Error fetching filter options:', err);
      }
    };

    fetchFilterOptions();
  }, []);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Fetch medicines with current filters and sorting
  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: filters.page,
        limit: filters.limit,
        search: filters.search,
        category: filters.category,
        minPrice: filters.minPrice || undefined,
        maxPrice: filters.maxPrice || undefined,
        inStock: filters.inStock || undefined,
        requiresPrescription: filters.requiresPrescription || undefined,
        discountOnly: filters.discountOnly || undefined,
        sort: sortBy === 'relevance' ? undefined : sortBy
      };

      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });

      const response = await api.get('/medicines', { params });
      const { data, pagination: paginationData } = response.data;
      
      setMedicines(data || []);
      
      if (paginationData) {
        setPagination({
          total: parseInt(paginationData.total, 10),
          page: parseInt(paginationData.page, 10),
          totalPages: Math.ceil(parseInt(paginationData.total, 10) / parseInt(paginationData.limit, 10)),
          hasMore: paginationData.hasMore
        });
      }
    } catch (err) {
      setError('Failed to load medicines. Please try again later.');
      console.error('Error fetching medicines:', err);
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  }, [filters, sortBy]);

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setFilters(prev => ({
      ...prev,
      search: searchQuery,
      page: 1
    }));
  }, [searchQuery]);

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= pagination.totalPages) {
      setFilters(prev => ({
        ...prev,
        page: newPage
      }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Fetch medicines when filters or sort change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedicines();
    }, 300);

    return () => clearTimeout(timer);
  }, [filters, sortBy, fetchMedicines]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ET').format(price.toFixed(2));
  };

  const resetFilters = () => {
    setFilters({
      ...filters,
      search: '',
      category: '',
      minPrice: '',
      maxPrice: filterOptions.priceRange?.max || 1000,
      inStock: false,
      discountOnly: false,
      requiresPrescription: false,
      page: 1
    });
    setSearchQuery('');
    setSortBy('relevance');
  };

  return (
    <Container fluid="lg" className="py-4">
      {/* Header */}
      <div className="mb-5">
        <h1 className="h2 fw-bold mb-3">Browse Medicines</h1>
        <p className="text-muted mb-4">
          Search medicines by name, description, or manufacturer...
        </p>
        
        {/* Search Bar */}
        <div className="search-wrapper mb-4">
          <InputGroup size="lg" className="shadow-sm">
            <Form.Control
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="border-end-0"
            />
            <Button 
              variant="primary" 
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4"
            >
              {isSearching ? (
                <>
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                    className="me-2"
                  />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="me-2" />
                  Search
                </>
              )}
            </Button>
          </InputGroup>
        </div>
      </div>

      <Row className="g-4">
        {/* Filters Sidebar */}
        <Col lg={3}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h5 fw-bold mb-0">Filters</h3>
                <Button
                  variant="link"
                  size="sm"
                  className="text-decoration-none p-0 text-muted"
                  onClick={resetFilters}
                >
                  Clear all
                </Button>
              </div>

              {/* Sort */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-uppercase text-muted mb-2">
                  Sort by
                </label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  size="sm"
                  className="border"
                >
                  <option value="relevance">Relevance</option>
                  <option value="priceAsc">Price: Low to High</option>
                  <option value="priceDesc">Price: High to Low</option>
                  <option value="nameAsc">Name: A to Z</option>
                  <option value="nameDesc">Name: Z to A</option>
                </Form.Select>
              </div>

              {/* Categories */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-uppercase text-muted mb-2">
                  Categories
                </label>
                <Form.Select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  size="sm"
                  className="border"
                >
                  <option value="">All Categories</option>
                  {filterOptions.categories?.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </Form.Select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-uppercase text-muted mb-2">
                  Price Range
                </label>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Form.Control
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    size="sm"
                    className="border"
                  />
                  <span className="text-muted">-</span>
                  <Form.Control
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    size="sm"
                    className="border"
                  />
                </div>
              </div>

              {/* Availability */}
              <div className="mb-4">
                <label className="form-label fw-semibold small text-uppercase text-muted mb-2">
                  Availability
                </label>
                <div className="d-flex flex-column gap-2">
                  <Form.Check
                    type="checkbox"
                    id="in-stock"
                    label="In Stock"
                    checked={filters.inStock}
                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                  />
                  <Form.Check
                    type="checkbox"
                    id="discount"
                    label="Discounted Items"
                    checked={filters.discountOnly}
                    onChange={(e) => handleFilterChange('discountOnly', e.target.checked)}
                  />
                </div>
              </div>

              <Button
                variant="primary"
                className="w-100 mt-2"
                onClick={fetchMedicines}
              >
                Apply Filters
              </Button>
            </Card.Body>
          </Card>

        </Col>

        {/* Medicines Grid */}
        <Col lg={9}>
          {/* Results Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="h5 fw-bold mb-1">Medicines</h2>
              {!loading && (
                <p className="text-muted small mb-0">
                  {pagination.total} {pagination.total === 1 ? 'item' : 'items'} found
                  {filters.category && ` in "${filters.category}"`}
                </p>
              )}
            </div>
            {!loading && medicines.length > 0 && (
              <div className="text-muted small">
                Page {filters.page} of {pagination.totalPages}
              </div>
            )}
          </div>

          {/* Loading State */}
          {loading ? (
            <Row xs={1} sm={2} lg={3} className="g-4">
              {[...Array(6)].map((_, i) => (
                <Col key={i}>
                  <Card className="border-0 shadow-sm h-100">
                    <Card.Body className="p-4">
                      <Placeholder as={Card.Img} animation="wave" className="rounded mb-3" style={{ height: '140px' }} />
                      <Placeholder as={Card.Title} animation="wave">
                        <Placeholder xs={6} />
                      </Placeholder>
                      <Placeholder as={Card.Text} animation="wave">
                        <Placeholder xs={8} />
                        <Placeholder xs={4} className="ms-2" />
                      </Placeholder>
                      <div className="d-flex justify-content-between mt-3">
                        <Placeholder.Button variant="primary" xs={4} />
                        <Placeholder.Button variant="outline-primary" xs={4} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <>
              {/* Medicines Grid */}
              {medicines.length > 0 ? (
                <>
                  <Row xs={1} sm={2} lg={3} className="g-4">
                    {medicines.map((medicine) => (
                      <Col key={medicine._id}>
                        <Card className="border-0 shadow-sm h-100 medicine-card">
                          {/* Medicine Image */}
                          <div className="medicine-image-wrapper">
                            <Card.Img
                              variant="top"
                              src={medicine.imageUrl || '/placeholder-medicine.jpg'}
                              alt={medicine.name}
                              className="medicine-image"
                            />
                            {medicine.discount > 0 && (
                              <Badge bg="danger" className="discount-badge">
                                -{medicine.discount}%
                              </Badge>
                            )}
                          </div>

                          <Card.Body className="p-4">
                            {/* Category & Manufacturer */}
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <Badge bg="light" text="dark" className="rounded-pill">
                                {medicine.category}
                              </Badge>
                              {medicine.requiresPrescription && (
                                <Badge bg="warning" text="dark" className="rounded-pill">
                                  Rx
                                </Badge>
                              )}
                            </div>

                            {/* Medicine Name */}
                            <Card.Title className="h6 fw-bold mb-2">
                              {medicine.name}
                            </Card.Title>
                            <Card.Subtitle className="text-muted small mb-3">
                              {medicine.manufacturer}
                            </Card.Subtitle>

                            {/* Rating */}
                            <div className="d-flex align-items-center mb-3">
                              <div className="d-flex me-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    size={14}
                                    className={i < Math.floor(medicine.rating || 0) ? 'text-warning' : 'text-muted'}
                                    fill={i < Math.floor(medicine.rating || 0) ? 'currentColor' : 'none'}
                                  />
                                ))}
                              </div>
                              <span className="text-muted small">
                                ({medicine.reviewCount || 0})
                              </span>
                            </div>

                            {/* Price & Stock */}
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <div>
                                <h5 className="text-primary fw-bold mb-0">
                                  {formatPrice(medicine.price)} birr
                                </h5>
                                {medicine.originalPrice && (
                                  <div className="text-muted small text-decoration-line-through">
                                    {formatPrice(medicine.originalPrice)} birr
                                  </div>
                                )}
                              </div>
                              <Badge
                                bg={medicine.stock > 0 ? 'success' : 'secondary'}
                                className="px-3"
                              >
                                {medicine.stock > 0 ? 'In Stock' : 'Out of Stock'}
                              </Badge>
                            </div>

                            {/* Action Buttons */}
                            <div className="d-grid gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                disabled={medicine.stock <= 0}
                              >
                                Add to Cart
                              </Button>
                              <Button
                                variant="outline-primary"
                                size="sm"
                              >
                                View Details
                              </Button>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="d-flex justify-content-center mt-5">
                      <nav>
                        <ul className="pagination">
                          <li className={`page-item ${filters.page === 1 ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page - 1)}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(pagination.totalPages).keys()].map((number) => {
                            const pageNum = number + 1;
                            // Show first, last, and pages around current
                            if (
                              pageNum === 1 ||
                              pageNum === pagination.totalPages ||
                              (pageNum >= filters.page - 1 && pageNum <= filters.page + 1)
                            ) {
                              return (
                                <li
                                  key={pageNum}
                                  className={`page-item ${filters.page === pageNum ? 'active' : ''}`}
                                >
                                  <button
                                    className="page-link"
                                    onClick={() => handlePageChange(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            } else if (pageNum === filters.page - 2 || pageNum === filters.page + 2) {
                              return (
                                <li key={pageNum} className="page-item disabled">
                                  <span className="page-link">...</span>
                                </li>
                              );
                            }
                            return null;
                          })}
                          <li className={`page-item ${!pagination.hasMore ? 'disabled' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => handlePageChange(filters.page + 1)}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              ) : (
                /* Empty State */
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <div className="mb-4">
                      <Search size={48} className="text-muted mb-3" />
                      <h3 className="h5 fw-bold text-muted mb-2">No medicines found</h3>
                      <p className="text-muted mb-4">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                    <div className="d-flex justify-content-center gap-3">
                      <Button
                        variant="outline-primary"
                        onClick={resetFilters}
                      >
                        Clear Filters
                      </Button>
                      <Button
                        variant="primary"
                        onClick={() => {
                          setSearchQuery('');
                          resetFilters();
                        }}
                      >
                        View All Medicines
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MedicineList;