import React, { useState } from 'react';
import { contactApi } from '../api/contactApi';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [successResponse, setSuccessResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setErrorMessage('');
    setSuccessResponse(null);

    try {
      const response = await contactApi.submitInquiry({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim(),
      });

      setSuccessResponse(response);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      if (err.response?.data?.message) {
        setErrorMessage(err.response.data.message);
      } else if (err.response?.data?.details) {
        setErrorMessage(Object.values(err.response.data.details).join(', '));
      } else {
        setErrorMessage('Failed to send your inquiry. Please verify the backend connection.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Banner */}
      <div
        style={{
          background: 'linear-gradient(rgba(8,8,8,0.7), rgba(8,8,8,0.9)), url(/assets/images/Background2.jpg) center/cover',
          padding: '80px 0 60px',
          textAlign: 'center',
          borderBottom: '1px solid var(--border-color)',
        }}
      >
        <div className="container">
          <h1 className="section-title">
            Contact <span>Our Concierge</span>
          </h1>
          <p className="section-subtitle" style={{ marginBottom: 0 }}>
            Have questions about custom dates, group bookings, or itineraries? We are here to help.
          </p>
        </div>
      </div>

      <div className="container section">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '50px' }}>
          {/* Contact Details */}
          <div>
            <h2 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '16px' }}>
              Let's Plan Your <span>Next Trip</span>
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '32px' }}>
              Our travel consultants specialize in personalized vacation planning across India's top tourist destinations.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-location-dot"></i>
                </div>
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '4px' }}>Headquarters</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    Connaught Place, Central Delhi, New Delhi 110001, India
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-envelope"></i>
                </div>
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '4px' }}>Email Support</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    support@travelease.com
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.2rem',
                    flexShrink: 0,
                  }}
                >
                  <i className="fa-solid fa-phone"></i>
                </div>
                <div>
                  <h4 style={{ color: '#fff', marginBottom: '4px' }}>Phone Concierge</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem' }}>
                    98xxx xxx09 (Mon-Sat, 9 AM - 8 PM IST)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="form-card" style={{ maxWidth: '100%', margin: 0 }}>
            <h3 style={{ fontSize: '1.4rem', color: '#fff', marginBottom: '8px' }}>
              Send an Inquiry
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
              Fill out your details and we will respond within 24 hours.
            </p>

            {successResponse && (
              <div className="alert alert-success">
                <i className="fa-solid fa-circle-check"></i>
                <div>
                  <strong>Inquiry Submitted! (Ref #{successResponse.id})</strong>
                  <p style={{ margin: '4px 0 0', fontSize: '0.85rem' }}>
                    Thank you, {successResponse.name}. Your message has been received by our concierge team.
                  </p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="alert alert-danger">
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Name <span>*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  placeholder="e.g. Rahul Sharma"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address <span>*</span></label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  placeholder="e.g. rahul@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  name="subject"
                  className="form-control"
                  placeholder="e.g. Custom Honeymoon Package, Group Booking"
                  value={formData.subject}
                  onChange={handleChange}
                  maxLength={200}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message / Inquiry Details <span>*</span></label>
                <textarea
                  name="message"
                  className="form-control"
                  placeholder="Tell us about your desired travel dates, destination preferences, or questions..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                  disabled={submitting}
                ></textarea>
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-block"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-paper-plane"></i> Submit Inquiry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
