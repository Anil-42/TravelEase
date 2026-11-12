import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../../api/adminApi';
import LoadingSpinner from '../LoadingSpinner';
import ErrorMessage from '../ErrorMessage';

const IMAGE_PRESETS = [
  'tour1.jpg',
  'goa.jpg',
  'tour2.jpg',
  'manali.jpg',
  'tour3.jpg',
  'jaipur.jpg',
  'tour4.jpg',
  'kerala.jpg',
  'ooty.jpg',
  'coorg.jpg',
  'munnar.jpg',
  'andaman.jpg',
  'rishikesh.jpg',
  'udaipur.jpg',
];

const emptyForm = {
  slug: '',
  title: '',
  destination: '',
  description: '',
  basePrice: '',
  duration: '',
  coverImage: 'ooty.jpg',
  detailImage: 'ooty.jpg',
  available: true,
  itinerary: [{ day: 1, title: '', details: '' }],
  inclusions: [''],
};

const formatINR = (val) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(val || 0));

const AdminPackagesTab = ({ onDataChanged }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [banner, setBanner] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Delete confirmation modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadPackages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminApi.getAllPackages();
      setPackages(data);
    } catch {
      setError('Failed to fetch tour packages from backend.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPackages();
  }, [loadPackages]);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (pkg) => {
    setEditingId(pkg.id);
    setForm({
      slug: pkg.slug || '',
      title: pkg.title || '',
      destination: pkg.destination || '',
      description: pkg.description || '',
      basePrice: pkg.basePrice != null ? String(pkg.basePrice) : '',
      duration: pkg.duration || '',
      coverImage: pkg.coverImage || 'tour1.jpg',
      detailImage: pkg.detailImage || 'goa.jpg',
      available: Boolean(pkg.available),
      itinerary:
        Array.isArray(pkg.itinerary) && pkg.itinerary.length > 0
          ? pkg.itinerary.map((item, idx) => ({
              day: item.day || idx + 1,
              title: item.title || '',
              details: item.details || '',
            }))
          : [{ day: 1, title: '', details: '' }],
      inclusions:
        Array.isArray(pkg.inclusions) && pkg.inclusions.length > 0 ? [...pkg.inclusions] : [''],
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleTitleChange = (val) => {
    setForm((prev) => {
      const next = { ...prev, title: val };
      if (!editingId && (!prev.slug || prev.slug === slugify(prev.title))) {
        next.slug = slugify(val);
      }
      return next;
    });
  };

  const slugify = (text) =>
    text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');

  const handleItineraryChange = (index, field, value) => {
    setForm((prev) => {
      const updated = prev.itinerary.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      );
      return { ...prev, itinerary: updated };
    });
  };

  const addItineraryDay = () => {
    setForm((prev) => ({
      ...prev,
      itinerary: [...prev.itinerary, { day: prev.itinerary.length + 1, title: '', details: '' }],
    }));
  };

  const removeItineraryDay = (index) => {
    setForm((prev) => {
      const filtered = prev.itinerary.filter((_, idx) => idx !== index);
      return {
        ...prev,
        itinerary: filtered.map((item, idx) => ({ ...item, day: idx + 1 })),
      };
    });
  };

  const handleInclusionChange = (index, value) => {
    setForm((prev) => ({
      ...prev,
      inclusions: prev.inclusions.map((inc, idx) => (idx === index ? value : inc)),
    }));
  };

  const addInclusion = () => {
    setForm((prev) => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
  };

  const removeInclusion = (index) => {
    setForm((prev) => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, idx) => idx !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.title.trim()) {
      setFormError('Package title is required.');
      return;
    }
    if (!editingId && !form.slug.trim()) {
      setFormError('Package slug is required.');
      return;
    }
    const priceNum = Number(form.basePrice);
    if (Number.isNaN(priceNum) || priceNum < 0) {
      setFormError('Base price must be a non-negative number.');
      return;
    }
    if (!form.duration.trim()) {
      setFormError('Package duration is required.');
      return;
    }

    const cleanItinerary = form.itinerary
      .filter((d) => d.title.trim() || d.details.trim())
      .map((d, idx) => ({
        day: idx + 1,
        title: d.title.trim() || `Day ${idx + 1}`,
        details: d.details.trim(),
      }));

    const cleanInclusions = form.inclusions.map((s) => s.trim()).filter(Boolean);

    const payload = {
      ...(editingId ? {} : { slug: form.slug.trim().toLowerCase() }),
      title: form.title.trim(),
      destination: form.destination.trim(),
      description: form.description.trim(),
      basePrice: priceNum,
      duration: form.duration.trim(),
      coverImage: form.coverImage.trim(),
      detailImage: form.detailImage.trim(),
      available: form.available,
      itinerary: cleanItinerary,
      inclusions: cleanInclusions,
    };

    setSaving(true);
    try {
      if (editingId) {
        await adminApi.updatePackage(editingId, payload);
        setBanner({ type: 'success', text: `Package "${payload.title}" updated successfully.` });
      } else {
        await adminApi.createPackage(payload);
        setBanner({ type: 'success', text: `Package "${payload.title}" created successfully.` });
      }
      setModalOpen(false);
      await loadPackages();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save package. Please verify all inputs.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (pkg) => {
    setBanner(null);
    try {
      const updated = await adminApi.togglePackageAvailability(pkg.id, !pkg.available);
      setBanner({
        type: 'success',
        text: `"${updated.title}" marked as ${updated.available ? 'Available' : 'Unavailable'}.`,
      });
      await loadPackages();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to update availability.',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setBanner(null);
    try {
      await adminApi.deletePackage(deleteTarget.id);
      setBanner({ type: 'success', text: `Package "${deleteTarget.title}" deleted.` });
      setDeleteTarget(null);
      await loadPackages();
      if (onDataChanged) onDataChanged();
    } catch (err) {
      setBanner({
        type: 'danger',
        text: err.response?.data?.message || 'Unable to delete package because existing bookings depend on it.',
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = packages.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.destination?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="admin-section-header">
        <div>
          <h2>Manage Tour Packages ({packages.length})</h2>
          <p>Create, edit, toggle availability, or safely remove packages when booking history allows.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openCreateModal}>
          <i className="fa-solid fa-plus"></i> Add New Package
        </button>
      </div>

      {banner && (
        <div className={`alert alert-${banner.type}`} style={{ marginBottom: '20px' }}>
          <i className={`fa-solid ${banner.type === 'success' ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
          <span>{banner.text}</span>
        </div>
      )}

      <div className="admin-filter-bar">
        <input
          type="text"
          className="form-control"
          placeholder="Search packages by title, destination, or slug..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading && <LoadingSpinner message="Loading packages..." />}
      {error && <ErrorMessage message={error} onRetry={loadPackages} />}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Package</th>
                <th>Destination</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Availability</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '32px' }}>
                    No packages match your search.
                  </td>
                </tr>
              ) : (
                filtered.map((pkg) => (
                  <tr key={pkg.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={`/assets/images/${pkg.coverImage || 'tour1.jpg'}`}
                          alt={pkg.title}
                          style={{ width: '54px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/assets/images/tour1.jpg';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: '600', color: '#fff' }}>{pkg.title}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-subtle)' }}>{pkg.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td>{pkg.destination || 'India'}</td>
                    <td>{pkg.duration}</td>
                    <td style={{ color: 'var(--primary)', fontWeight: '600' }}>{formatINR(pkg.basePrice)}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge ${pkg.available ? 'badge-confirmed' : 'badge-cancelled'}`}
                        style={{ cursor: 'pointer', border: '1px solid currentColor' }}
                        onClick={() => handleToggleAvailability(pkg)}
                        title="Click to toggle availability"
                      >
                        <i className={`fa-solid ${pkg.available ? 'fa-eye' : 'fa-eye-slash'}`}></i>{' '}
                        {pkg.available ? 'Available' : 'Hidden'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-outline btn-sm" onClick={() => openEditModal(pkg)}>
                          <i className="fa-solid fa-pen"></i> Edit
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(pkg)}>
                          <i className="fa-solid fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create / Edit Package Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '720px', maxHeight: '90vh', overflowY: 'auto' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, color: '#fff' }}>
                {editingId ? 'Edit Tour Package' : 'Create New Tour Package'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {formError && (
              <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="admin-form-grid">
                <div className="form-group">
                  <label className="form-label">Title <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Slug {editingId ? '(immutable)' : <span>*</span>}</label>
                  <input
                    type="text"
                    className="form-control"
                    value={form.slug}
                    onChange={(e) => setForm({ ...form, slug: e.target.value })}
                    disabled={Boolean(editingId)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Destination</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ooty, Tamil Nadu"
                    value={form.destination}
                    onChange={(e) => setForm({ ...form, destination: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Duration <span>*</span></label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 4 Days / 3 Nights"
                    value={form.duration}
                    onChange={(e) => setForm({ ...form, duration: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Base Price (INR) <span>*</span></label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-control"
                    value={form.basePrice}
                    onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <select
                    className="form-control"
                    value={form.available ? 'true' : 'false'}
                    onChange={(e) => setForm({ ...form, available: e.target.value === 'true' })}
                  >
                    <option value="true">Available for Booking</option>
                    <option value="false">Hidden / Unavailable</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Cover Image</label>
                  <input
                    type="text"
                    list="preset-images"
                    className="form-control"
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Detail Banner Image</label>
                  <input
                    type="text"
                    list="preset-images"
                    className="form-control"
                    value={form.detailImage}
                    onChange={(e) => setForm({ ...form, detailImage: e.target.value })}
                  />
                </div>
                <datalist id="preset-images">
                  {IMAGE_PRESETS.map((img) => (
                    <option key={img} value={img} />
                  ))}
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              {/* Itinerary Builder */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Itinerary Days</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addItineraryDay}>
                    <i className="fa-solid fa-plus"></i> Add Day
                  </button>
                </div>
                {form.itinerary.map((item, idx) => (
                  <div key={idx} className="admin-subcard">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <strong style={{ color: 'var(--primary)', fontSize: '0.85rem' }}>Day {idx + 1}</strong>
                      {form.itinerary.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItineraryDay(idx)}
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.82rem' }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Day title"
                      value={item.title}
                      onChange={(e) => handleItineraryChange(idx, 'title', e.target.value)}
                      style={{ marginBottom: '8px' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Activities & sightseeing details"
                      value={item.details}
                      onChange={(e) => handleItineraryChange(idx, 'details', e.target.value)}
                    />
                  </div>
                ))}
              </div>

              {/* Inclusions Builder */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Package Inclusions</label>
                  <button type="button" className="btn btn-outline btn-sm" onClick={addInclusion}>
                    <i className="fa-solid fa-plus"></i> Add Inclusion
                  </button>
                </div>
                {form.inclusions.map((inc, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Daily breakfast and cab transfers"
                      value={inc}
                      onChange={(e) => handleInclusionChange(idx, e.target.value)}
                    />
                    {form.inclusions.length > 1 && (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => removeInclusion(idx)}>
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '12px' }}>Delete Package?</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem' }}>
              Are you sure you want to delete <strong>{deleteTarget.title}</strong>? If customer bookings already reference this package, deletion will be blocked to preserve financial integrity.
            </p>
            <div className="modal-actions">
              <button className="btn btn-outline btn-sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="btn btn-danger btn-sm" onClick={handleConfirmDelete} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPackagesTab;
