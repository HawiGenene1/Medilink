// frontend/src/components/pharmacy-staff/PrescriptionReview/index.js
import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Table, 
  Button, 
  Modal, 
  Badge, 
  Spinner, 
  Alert,
  Row,
  Col
} from 'react-bootstrap';
import { FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import prescriptionsAPI from '../../../services/api/prescriptions';
import { format } from 'date-fns';

const PrescriptionReview = () => {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        const response = await prescriptionsAPI.getPending();
        setPrescriptions(response.data.data || []);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('Failed to load prescriptions. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      setActionLoading(true);
      setActionError(null);
      
      await prescriptionsAPI.updateStatus(id, status, reviewNotes);
      
      // Update local state
      setPrescriptions(prev => 
        prev.filter(prescription => prescription._id !== id)
      );
      
      if (selectedPrescription?._id === id) {
        setSelectedPrescription(null);
        setShowModal(false);
      }
    } catch (err) {
      console.error(`Error updating prescription status:`, err);
      setActionError(`Failed to update prescription status. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = (id) => handleStatusUpdate(id, 'approved');
  const handleReject = (id) => handleStatusUpdate(id, 'rejected');

  const openPrescriptionModal = (prescription) => {
    setSelectedPrescription(prescription);
    setReviewNotes(prescription.reviewNotes || '');
    setShowModal(true);
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading prescriptions...</p>
      </div>
    );
  }

  return (
    <Container className="py-4">
      <h2 className="mb-4">Prescription Review</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {actionError && <Alert variant="danger" onClose={() => setActionError(null)} dismissible>{actionError}</Alert>}
      
      {prescriptions.length === 0 ? (
        <Alert variant="info">No pending prescriptions to review.</Alert>
      ) : (
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Issued</th>
              <th>Expires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prescriptions.map((prescription) => (
              <tr key={prescription._id}>
                <td>
                  {prescription.user?.firstName} {prescription.user?.lastName}
                </td>
                <td>{prescription.doctorName}</td>
                <td>{formatDate(prescription.issueDate)}</td>
                <td>{formatDate(prescription.expiryDate)}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => openPrescriptionModal(prescription)}
                  >
                    <FaEye /> View
                  </Button>
                  <Button
                    variant="outline-success"
                    size="sm"
                    className="me-2"
                    onClick={() => handleApprove(prescription._id)}
                    disabled={actionLoading}
                  >
                    <FaCheck /> Approve
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleReject(prescription._id)}
                    disabled={actionLoading}
                  >
                    <FaTimes /> Reject
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* Prescription Detail Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Prescription Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPrescription && (
            <div>
              <Row className="mb-4">
                <Col md={6}>
                  <h5>Patient Information</h5>
                  <p>
                    <strong>Name:</strong>{' '}
                    {selectedPrescription.user?.firstName}{' '}
                    {selectedPrescription.user?.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedPrescription.user?.email}
                  </p>
                </Col>
                <Col md={6}>
                  <h5>Prescription Details</h5>
                  <p>
                    <strong>Doctor:</strong> {selectedPrescription.doctorName}
                  </p>
                  <p>
                    <strong>Issued:</strong>{' '}
                    {formatDate(selectedPrescription.issueDate)}
                  </p>
                  <p>
                    <strong>Expires:</strong>{' '}
                    {formatDate(selectedPrescription.expiryDate)}
                  </p>
                  {selectedPrescription.notes && (
                    <p>
                      <strong>Notes:</strong> {selectedPrescription.notes}
                    </p>
                  )}
                </Col>
              </Row>
              
              <div className="mb-3">
                <label htmlFor="reviewNotes" className="form-label">Review Notes (Optional)</label>
                <textarea
                  className="form-control"
                  id="reviewNotes"
                  rows="3"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add any notes about this review..."
                ></textarea>
              </div>
              
              <div className="text-center">
                <img
                  src={`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}${selectedPrescription.imageUrl}`}
                  alt="Prescription"
                  className="img-fluid"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModal(false)}
            disabled={actionLoading}
          >
            Close
          </Button>
          <Button
            variant="danger"
            onClick={() => handleReject(selectedPrescription?._id)}
            disabled={actionLoading}
            className="me-2"
          >
            <FaTimes /> Reject
          </Button>
          <Button
            variant="success"
            onClick={() => handleApprove(selectedPrescription?._id)}
            disabled={actionLoading}
          >
            <FaCheck /> Approve
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default PrescriptionReview;