import React, { useEffect, useState } from 'react';
import { customerApi } from '../api/customerApi';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Edit2, Eye, Trash2, Calendar, Phone, Mail, Building, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst_number: '',
    customer_type: 'RETAIL' as CustomerType,
    address: '',
    status: 'LEAD' as CustomerStatus,
    follow_up_date: '',
    notes: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await customerApi.getCustomers({
        search,
        status: statusFilter,
        customer_type: typeFilter,
        page,
        limit: 10,
      });
      setCustomers(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search, statusFilter, typeFilter, page]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '',
      mobile: '',
      email: '',
      business_name: '',
      gst_number: '',
      customer_type: 'RETAIL',
      address: '',
      status: 'LEAD',
      follow_up_date: '',
      notes: '',
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      customer_name: c.customer_name,
      mobile: c.mobile,
      email: c.email || '',
      business_name: c.business_name || '',
      gst_number: c.gst_number || '',
      customer_type: c.customer_type,
      address: c.address || '',
      status: c.status,
      follow_up_date: c.follow_up_date ? c.follow_up_date.slice(0, 10) : '',
      notes: c.notes || '',
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_name || !formData.mobile) {
      setSubmitError('Customer name and mobile number are required.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await customerApi.updateCustomer(editingCustomer.id, formData);
      } else {
        await customerApi.createCustomer(formData);
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await customerApi.deleteCustomer(id);
        loadCustomers();
      } catch (err: any) {
        alert(err.message || 'Failed to delete customer');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer CRM Directory</h1>
          <p className="page-subtitle">Manage client accounts, contact leads, and sales follow-ups</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Add Customer
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search name, company, phone, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>

            <select
              className="form-control"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="RETAIL">RETAIL</option>
              <option value="WHOLESALE">WHOLESALE</option>
              <option value="DISTRIBUTOR">DISTRIBUTOR</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Data Table */}
      {loading ? (
        <LoadingSpinner message="Loading customer directory..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="No customer records match your filter criteria."
          action={
            hasRole('ADMIN', 'SALES') ? (
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} /> Add First Customer
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Business Name</th>
                <th>Contact</th>
                <th>Type</th>
                <th>Status</th>
                <th>Next Follow-up</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.customer_name}</div>
                    {c.gst_number && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST: {c.gst_number}</div>}
                  </td>
                  <td>{c.business_name || 'N/A'}</td>
                  <td>
                    <div style={{ fontSize: '0.85rem' }}>{c.mobile}</div>
                    {c.email && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>}
                  </td>
                  <td><StatusBadge status={c.customer_type} /></td>
                  <td><StatusBadge status={c.status} /></td>
                  <td>
                    {c.follow_up_date ? (
                      <span style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-700)', fontWeight: 500 }}>
                        <Calendar size={14} />
                        {new Date(c.follow_up_date).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>None</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn-icon" onClick={() => navigate(`/customers/${c.id}`)} title="View Customer Details">
                        <Eye size={18} />
                      </button>
                      {hasRole('ADMIN', 'SALES') && (
                        <button className="btn-icon" onClick={() => openEditModal(c)} title="Edit Customer">
                          <Edit2 size={18} />
                        </button>
                      )}
                      {hasRole('ADMIN') && (
                        <button className="btn-icon" style={{ color: 'var(--danger-text)' }} onClick={() => handleDelete(c.id)} title="Delete Customer">
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="pagination">
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Page {page} of {totalPages}
            </span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Record' : 'Add New Customer'}
      >
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="John Doe / Company"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Mobile Number *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="+1 555-0100"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-control"
                placeholder="client@company.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Business Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="Acme Corp LLC"
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Customer Type</label>
              <select
                className="form-control"
                value={formData.customer_type}
                onChange={(e) => setFormData({ ...formData, customer_type: e.target.value as CustomerType })}
              >
                <option value="RETAIL">RETAIL</option>
                <option value="WHOLESALE">WHOLESALE</option>
                <option value="DISTRIBUTOR">DISTRIBUTOR</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as CustomerStatus })}
              >
                <option value="LEAD">LEAD</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GST Number</label>
              <input
                type="text"
                className="form-control"
                placeholder="27ABCDE1234F1Z5"
                value={formData.gst_number}
                onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Follow-up Date</label>
            <input
              type="date"
              className="form-control"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Full street address..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Internal Notes / History</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="Key notes, payment preferences, or interaction log..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
