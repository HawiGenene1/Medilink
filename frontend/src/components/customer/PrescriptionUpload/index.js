import React, { useState } from 'react';
import { Card, Form, Button, Alert, Image, Row, Col, Spinner } from 'react-bootstrap';
import prescriptionsAPI from '../../../services/api/prescriptions';

const PrescriptionUpload = () => {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, etc.)');
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setError(null);
    setFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!file) {
      setError('Please upload a prescription image.');
      return;
    }

    if (!doctorName || !issueDate || !expiryDate) {
      setError('Doctor name, issue date, and expiry date are required.');
      return;
    }

    try {
      setSubmitting(true);
      await prescriptionsAPI.upload({
        file,
        doctorName,
        issueDate,
        expiryDate,
        notes
      });

      setSuccessMessage('Prescription uploaded successfully. Our pharmacy team will review it shortly.');
      setFile(null);
      setPreviewUrl(null);
      setDoctorName('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
    } catch (err) {
      console.error('Prescription upload failed:', err);
      const message = err?.response?.data?.message || 'Failed to upload prescription. Please try again later.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-0 shadow-sm">
      <Card.Body className="p-4">
        <Card.Title className="mb-3">Upload Prescription</Card.Title>
        <Card.Text className="text-muted mb-4">
          Upload a clear photo or scan of your doctor&apos;s prescription. Our pharmacists will verify it before preparing your order.
        </Card.Text>

        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success" className="mb-3">
            {successMessage}
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group controlId="prescriptionImage" className="mb-3">
                <Form.Label>Prescription Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  disabled={submitting}
                />
                <Form.Text className="text-muted">
                  Supported formats: JPG, PNG. Max size 5MB.
                </Form.Text>
              </Form.Group>

              <Form.Group controlId="doctorName" className="mb-3">
                <Form.Label>Doctor Name</Form.Label>
                <Form.Control
                  type="text"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  placeholder="e.g. Dr. Meron Abebe"
                  disabled={submitting}
                />
              </Form.Group>

              <Row>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="issueDate">
                    <Form.Label>Issue Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
                <Col md={6} className="mb-3">
                  <Form.Group controlId="expiryDate">
                    <Form.Label>Expiry Date</Form.Label>
                    <Form.Control
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      disabled={submitting}
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Form.Group controlId="notes" className="mb-3">
                <Form.Label>Notes (optional)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional information for the pharmacist."
                  disabled={submitting}
                />
              </Form.Group>

              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                      className="me-2"
                    />
                    Uploading...
                  </>
                ) : (
                  'Upload Prescription'
                )}
              </Button>
            </Col>

            <Col md={6} className="mt-3 mt-md-0">
              <Form.Label>Preview</Form.Label>
              <div className="border rounded d-flex align-items-center justify-content-center" style={{ minHeight: '220px', backgroundColor: '#f8f9fa' }}>
                {previewUrl ? (
                  <Image src={previewUrl} alt="Prescription preview" fluid rounded style={{ maxHeight: '280px' }} />
                ) : (
                  <span className="text-muted">No image selected</span>
                )}
              </div>
            </Col>
          </Row>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PrescriptionUpload;
