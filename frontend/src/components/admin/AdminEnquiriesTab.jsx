import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

const AdminEnquiriesTab = ({ onDataChanged }) => {
  const [enquiriesPage, setEnquiriesPage] = useState({ content: [], page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);

  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 0,
    size: 10,
  });

  const [selectedEnquiry, setSelectedEnquiry] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getEnquiries(filters);
      setEnquiriesPage(data);
    } catch {
      setError('Failed to fetch contact enquiries.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadEnquiries();
  }, [loadEnquiries]);

  const handleStatusChange = async (id, nextStatus) => {
    setUpdatingId(id);
    setBanner(null);
    try {
      const updated = await adminApi.updateEnquiryStatus(id, nextStatus);
      setBanner({
        type: 'success',
        text: `Enquiry #${updated.id} status updated to ${updated.status}.`,
      });
      await loadEnquiries();
      if (selectedEnquiry?.id === id) {
        setSelectedEnquiry(updated);
      }
      if (onDataChanged) onDataChanged();
    } catch {
      setBanner({ type: 'danger', text: 'Unable to update enquiry status.' });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusClass = (status) => {
    if (status === 'RESOLVED') return 'badge-confirmed';
    if (status === 'IN_PROGRESS') return 'badge-pending';
    if (status === 'CLOSED') return 'badge-cancelled';
    return 'badge-tag';
  };

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Contact Enquiries ({enquiriesPage.totalElements || 0})</h2>
          <p>Review customer questions, trip customization requests, and update resolution statuses.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={loadEnquiries}>
          <i className="fa-solid fa-rotate"></i> Refresh
        </button>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: '18px' }}>
          <i className={`fa-solid ${banner.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{banner.text}</span>
        </div>
      )}

      <div className="admin-filter-grid" style={{ gridTemplateColumns: '2fr 1fr auto' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by customer name, email, subject, or message..."
          value={filters.search}
          onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value, page: 0 }))}
        />
        <select
          className="form-control"
          value={filters.status}
          onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value, page: 0 }))}
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setFilters({ search: '', status: '', page: 0, size: 10 })}
        >
          Reset
        </button>
      </div>

      {loading && <LoadingSpinner message="Loading customer enquiries..." />}
      {error && <ErrorMessage message={error} onRetry={loadEnquiries} />}

      {!loading && !error && (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Subject & Message</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {enquiriesPage.content.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                      No contact enquiries match your filters.
                    </td>
                  </tr>
                ) : (
                  enquiriesPage.content.map((enq) => (
                    <tr key={enq.id}>
                      <td>
                        <div style={{ fontWeight: '600', color: '#fff' }}>{enq.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{enq.email}</div>
                      </td>
                      <td style={{ maxWidth: '340px' }}>
                        <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.88rem' }}>
                          {enq.subject || 'General Inquiry'}
                        </div>
                        <div
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.84rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {enq.message}
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedEnquiry(enq)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--primary)',
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            padding: 0,
                            marginTop: '4px',
                          }}
                        >
                          Read full message
                        </button>
                      </td>
                      <td>{enq.submittedAt ? new Date(enq.submittedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <span className={`badge ${getStatusClass(enq.status)}`}>{enq.status}</span>
                      </td>
                      <td>
                        <select
                          className="form-control"
                          style={{ minWidth: '140px', padding: '6px 10px' }}
                          value={enq.status}
                          disabled={updatingId === enq.id}
                          onChange={(e) => handleStatusChange(enq.id, e.target.value)}
                        >
                          <option value="NEW">NEW</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="RESOLVED">RESOLVED</option>
                          <option value="CLOSED">CLOSED</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {enquiriesPage.totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="btn btn-outline btn-sm"
                disabled={enquiriesPage.first}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
              >
                <i className="fa-solid fa-chevron-left"></i> Previous
              </button>
              <span>
                Page {enquiriesPage.page + 1} of {enquiriesPage.totalPages} ({enquiriesPage.totalElements} enquiries)
              </span>
              <button
                className="btn btn-outline btn-sm"
                disabled={enquiriesPage.last}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Next <i className="fa-solid fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {selectedEnquiry && (
        <div className="modal-overlay" onClick={() => setSelectedEnquiry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>Enquiry #{selectedEnquiry.id}</h3>
              <button
                onClick={() => setSelectedEnquiry(null)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="admin-detail-grid" style={{ marginBottom: '16px' }}>
              <div>
                <label>From</label>
                <span>{selectedEnquiry.name}</span>
              </div>
              <div>
                <label>Email</label>
                <span>{selectedEnquiry.email}</span>
              </div>
              <div>
                <label>Subject</label>
                <span>{selectedEnquiry.subject || 'General Inquiry'}</span>
              </div>
              <div>
                <label>Submitted</label>
                <span>{selectedEnquiry.submittedAt ? new Date(selectedEnquiry.submittedAt).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
            <div style={{ background: 'var(--bg-input)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-subtle)', marginBottom: '6px' }}>MESSAGE</label>
              <p style={{ color: '#fff', whiteSpace: 'pre-wrap', margin: 0 }}>{selectedEnquiry.message}</p>
            </div>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setSelectedEnquiry(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEnquiriesTab;
