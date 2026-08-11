import React, { useEffect, useState } from 'react';
import { challanApi } from '../api/challanApi';
import { Challan } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Search, Plus, Eye, CheckCircle2, XCircle, FileText, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Challans: React.FC = () => {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionMessage, setActionMessage] = useState('');

  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const loadChallans = async () => {
    setLoading(true);
    try {
      const res = await challanApi.getChallans({
        search,
        status: statusFilter,
        page,
        limit: 10,
      });
      setChallans(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChallans();
  }, [search, statusFilter, page]);

  const handleConfirm = async (id: number, challanNo: string) => {
    if (window.confirm(`Are you sure you want to CONFIRM Challan #${challanNo}? This will deduct inventory stock immediately.`)) {
      try {
        await challanApi.confirmChallan(id);
        setActionMessage(`Challan ${challanNo} confirmed and stock deducted successfully!`);
        setTimeout(() => setActionMessage(''), 4000);
        loadChallans();
      } catch (err: any) {
        alert(err.message || 'Failed to confirm challan');
      }
    }
  };

  const handleCancel = async (id: number, challanNo: string) => {
    if (window.confirm(`Are you sure you want to CANCEL Challan #${challanNo}?`)) {
      try {
        await challanApi.cancelChallan(id);
        setActionMessage(`Challan ${challanNo} has been cancelled.`);
        setTimeout(() => setActionMessage(''), 4000);
        loadChallans();
      } catch (err: any) {
        alert(err.message || 'Failed to cancel challan');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challan Management</h1>
          <p className="page-subtitle">Generate draft dispatch notes and execute atomic inventory reductions upon confirmation</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
            <Plus size={18} />
            Create Sales Challan
          </button>
        )}
      </div>

      {actionMessage && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {actionMessage}
        </div>
      )}

      {/* Search & Status Filter */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search by Challan # or Customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="form-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Challan List Table */}
      {loading ? (
        <LoadingSpinner message="Retrieving sales challans..." />
      ) : challans.length === 0 ? (
        <EmptyState
          title="No sales challans found"
          description="No sales challans match your search query or status filter."
          action={
            hasRole('ADMIN', 'SALES') ? (
              <button className="btn btn-primary" onClick={() => navigate('/challans/new')}>
                <Plus size={18} /> Create First Challan
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Challan #</th>
                <th>Customer</th>
                <th>Total Units</th>
                <th>Status</th>
                <th>Created By</th>
                <th>Created Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((ch) => (
                <tr key={ch.id}>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-600)' }}>
                      {ch.challan_number}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{ch.customer_name}</td>
                  <td style={{ fontWeight: 700 }}>{ch.total_quantity}</td>
                  <td><StatusBadge status={ch.status} /></td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <User size={14} color="var(--text-muted)" />
                      {ch.created_by_name || 'System'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      {new Date(ch.created_at).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn-icon" onClick={() => navigate(`/challans/${ch.id}`)} title="View Detailed Challan">
                        <Eye size={18} />
                      </button>

                      {ch.status === 'DRAFT' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
                        <button
                          className="btn btn-success"
                          style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => handleConfirm(ch.id, ch.challan_number)}
                          title="Confirm & Reduce Stock"
                        >
                          <CheckCircle2 size={14} /> Confirm
                        </button>
                      )}

                      {ch.status !== 'CANCELLED' && hasRole('ADMIN', 'SALES') && (
                        <button
                          className="btn-icon"
                          style={{ color: 'var(--danger-text)' }}
                          onClick={() => handleCancel(ch.id, ch.challan_number)}
                          title="Cancel Challan"
                        >
                          <XCircle size={18} />
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
              <button className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Previous
              </button>
              <button className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
