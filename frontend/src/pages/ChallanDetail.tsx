import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { challanApi } from '../api/challanApi';
import { Challan } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArrowLeft, CheckCircle2, XCircle, FileText, User, Calendar, Phone, Mail, MapPin, Printer } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ChallanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    async function loadChallan() {
      if (!id) return;
      try {
        const res = await challanApi.getChallanById(parseInt(id, 10));
        setChallan(res.data);
      } catch (err: any) {
        setError(err.message || 'Sales challan not found');
      } finally {
        setLoading(false);
      }
    }
    loadChallan();
  }, [id]);

  const handleConfirm = async () => {
    if (!challan) return;
    if (window.confirm(`Are you sure you want to CONFIRM Challan #${challan.challan_number}? Stock will be deducted immediately.`)) {
      setIsProcessing(true);
      setError('');
      try {
        const res = await challanApi.confirmChallan(challan.id);
        setChallan(res.data);
        setActionSuccess('Challan confirmed successfully! Inventory stock has been atomically reduced.');
      } catch (err: any) {
        setError(err.message || 'Failed to confirm challan');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleCancel = async () => {
    if (!challan) return;
    if (window.confirm(`Are you sure you want to CANCEL Challan #${challan.challan_number}?`)) {
      setIsProcessing(true);
      setError('');
      try {
        const res = await challanApi.cancelChallan(challan.id);
        setChallan(res.data);
        setActionSuccess('Challan has been cancelled.');
      } catch (err: any) {
        setError(err.message || 'Failed to cancel challan');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (loading) return <LoadingSpinner message="Retrieving sales challan details..." />;
  if (error || !challan) return <div className="card" style={{ color: 'var(--danger-text)' }}>{error || 'Challan not found'}</div>;

  const totalAmount = challan.items
    ? challan.items.reduce((sum, item) => sum + Number(item.subtotal), 0)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/challans')}>
          <ArrowLeft size={16} /> Back to Sales Challans
        </button>
        <button className="btn btn-secondary" onClick={() => window.print()}>
          <Printer size={16} /> Print Challan
        </button>
      </div>

      {actionSuccess && (
        <div style={{ padding: '0.85rem 1.25rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontWeight: 600 }}>
          {actionSuccess}
        </div>
      )}

      {/* Challan Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                {challan.challan_number}
              </h1>
              <StatusBadge status={challan.status} />
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Generated on {new Date(challan.created_at).toLocaleString()} by {challan.created_by_name || 'Sales Officer'}
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {challan.status === 'DRAFT' && hasRole('ADMIN', 'SALES', 'WAREHOUSE') && (
              <button className="btn btn-success" onClick={handleConfirm} disabled={isProcessing}>
                <CheckCircle2 size={18} />
                {isProcessing ? 'Confirming...' : 'Confirm & Deduct Stock'}
              </button>
            )}

            {challan.status !== 'CANCELLED' && hasRole('ADMIN', 'SALES') && (
              <button className="btn btn-danger" onClick={handleCancel} disabled={isProcessing}>
                <XCircle size={18} />
                {isProcessing ? 'Cancelling...' : 'Cancel Challan'}
              </button>
            )}
          </div>
        </div>

        {/* Customer Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1.25rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CUSTOMER ACCOUNT</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: '0.2rem' }}>{challan.customer_name}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>CONTACT MOBILE</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{challan.customer_mobile || 'N/A'}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>EMAIL ADDRESS</div>
            <div style={{ fontSize: '0.95rem', fontWeight: 600, marginTop: '0.2rem' }}>{challan.customer_email || 'N/A'}</div>
          </div>
        </div>
      </div>

      {/* Item Snapshots Table Card */}
      <div className="card">
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem' }}>
          Challan Dispatch Items (Snapshot)
        </h3>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Snapshot</th>
                <th>SKU Snapshot</th>
                <th>Quantity</th>
                <th>Unit Price ($)</th>
                <th>Subtotal ($)</th>
              </tr>
            </thead>
            <tbody>
              {challan.items && challan.items.length > 0 ? (
                challan.items.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600 }}>{item.product_name_snapshot}</td>
                    <td><code>{item.sku_snapshot}</code></td>
                    <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                    <td>${Number(item.unit_price_snapshot).toFixed(2)}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>${Number(item.subtotal).toFixed(2)}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ textAlign: 'center' }}>No items recorded.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ textAlign: 'right', display: 'flex', gap: '2.5rem' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL DISPATCH QUANTITY</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{challan.total_quantity} units</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL VALUATION</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>${totalAmount.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
