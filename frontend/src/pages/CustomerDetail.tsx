import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerApi } from '../api/customerApi';
import { Customer, CustomerStatus } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArrowLeft, Building, Phone, Mail, MapPin, Calendar, FileText, Save, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editable fields
  const [status, setStatus] = useState<CustomerStatus>('LEAD');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;
      try {
        const res = await customerApi.getCustomerById(parseInt(id, 10));
        setCustomer(res.data);
        setStatus(res.data.status);
        setFollowUpDate(res.data.follow_up_date ? res.data.follow_up_date.slice(0, 10) : '');
        setNotes(res.data.notes || '');
      } catch (err: any) {
        setError(err.message || 'Customer not found');
      } finally {
        setLoading(false);
      }
    }
    loadCustomer();
  }, [id]);

  const handleUpdateFollowUp = async () => {
    if (!customer) return;
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await customerApi.updateCustomer(customer.id, {
        status,
        follow_up_date: followUpDate || null,
        notes,
      });
      setCustomer(res.data);
      setSuccessMsg('Follow-up details & status updated successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message || 'Failed to update follow-up');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading customer dossier..." />;
  if (error || !customer) return <div className="card" style={{ color: 'var(--danger-text)' }}>{error || 'Customer not found'}</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/customers')}>
          <ArrowLeft size={16} /> Back to Customers
        </button>
      </div>

      {successMsg && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--success-bg)', color: 'var(--success-text)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          <CheckCircle size={20} />
          {successMsg}
        </div>
      )}

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <h1 className="page-title">{customer.customer_name}</h1>
            <StatusBadge status={customer.status} />
            <StatusBadge status={customer.customer_type} />
          </div>
          <p className="page-subtitle">Customer Profile ID #{customer.id} — Added {new Date(customer.created_at).toLocaleDateString()}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Business & Contact Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              Business & Contact Information
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="detail-item">
                <div className="detail-label"><Building size={16} /> Business Name</div>
                <div className="detail-value">{customer.business_name || 'N/A'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label"><FileText size={16} /> GST Identification</div>
                <div className="detail-value">{customer.gst_number || 'Not Provided'}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label"><Phone size={16} /> Mobile Number</div>
                <div className="detail-value">{customer.mobile}</div>
              </div>

              <div className="detail-item">
                <div className="detail-label"><Mail size={16} /> Email Address</div>
                <div className="detail-value">{customer.email || 'N/A'}</div>
              </div>
            </div>

            <div className="detail-item" style={{ marginTop: '1.25rem' }}>
              <div className="detail-label"><MapPin size={16} /> Registered Address</div>
              <div className="detail-value">{customer.address || 'No physical address recorded.'}</div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up & CRM Notes */}
        <div className="card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            CRM Follow-up & Status
          </h3>

          <div className="form-group">
            <label className="form-label">Customer Status</label>
            <select
              className="form-control"
              disabled={!hasRole('ADMIN', 'SALES')}
              value={status}
              onChange={(e) => setStatus(e.target.value as CustomerStatus)}
            >
              <option value="LEAD">LEAD</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label"><Calendar size={14} /> Scheduled Follow-up Date</label>
            <input
              type="date"
              className="form-control"
              disabled={!hasRole('ADMIN', 'SALES')}
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Interaction Log / Notes</label>
            <textarea
              className="form-control"
              rows={5}
              disabled={!hasRole('ADMIN', 'SALES')}
              placeholder="Record phone call summaries, client requirements, or contract status..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {hasRole('ADMIN', 'SALES') && (
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={handleUpdateFollowUp} disabled={saving}>
              <Save size={18} />
              {saving ? 'Updating...' : 'Save Follow-up & Status'}
            </button>
          )}
        </div>
      </div>

      <style>{`
        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .detail-label {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .detail-value {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-main);
        }

        @media (max-width: 900px) {
          div[style*="grid-template-columns: 2fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
