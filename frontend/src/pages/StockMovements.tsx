import React, { useEffect, useState } from 'react';
import { stockApi } from '../api/stockApi';
import { productApi } from '../api/productApi';
import { StockMovement, Product } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ArrowUpDown, Plus, Calendar, User, Package, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const StockMovements: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Stock Movement Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    product_id: '',
    quantity: 1,
    movement_type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const loadData = async () => {
    setLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        stockApi.getAllMovements(100),
        productApi.getProducts({ page: 1, limit: 100 }),
      ]);
      setMovements(movRes.data);
      setProducts(prodRes.data);
    } catch (err: any) {
      console.error('Failed to load stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openModal = () => {
    setFormData({
      product_id: products[0]?.id ? String(products[0].id) : '',
      quantity: 1,
      movement_type: 'IN',
      reason: 'Manual Stock Intake',
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.product_id || !formData.quantity) {
      setSubmitError('Select a product and valid quantity.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await stockApi.addMovement({
        product_id: parseInt(formData.product_id, 10),
        quantity: Number(formData.quantity),
        movement_type: formData.movement_type,
        reason: formData.reason,
      });
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to record stock movement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Stock Movement Audit Log</h1>
          <p className="page-subtitle">Historical inventory intake, outbound dispatches, and warehouse reconciliations</p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <button className="btn btn-primary" onClick={openModal}>
            <Plus size={18} />
            Record Movement
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving stock movement logs..." />
      ) : movements.length === 0 ? (
        <EmptyState
          title="No stock movements recorded"
          description="There are no inventory logs present in the audit log."
          action={
            hasRole('ADMIN', 'WAREHOUSE') ? (
              <button className="btn btn-primary" onClick={openModal}>
                <Plus size={18} /> Record First Movement
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Quantity</th>
                <th>Reason / Reference</th>
                <th>Logged By</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td><StatusBadge status={m.movement_type} /></td>
                  <td style={{ fontWeight: 600 }}>{m.product_name || `Product #${m.product_id}`}</td>
                  <td><code>{m.sku || 'N/A'}</code></td>
                  <td>
                    <span style={{ fontWeight: 800, color: m.movement_type === 'IN' ? 'var(--success-text)' : 'var(--danger-text)' }}>
                      {m.movement_type === 'IN' ? `+${m.quantity}` : `-${m.quantity}`}
                    </span>
                  </td>
                  <td>{m.reason || 'General Adjustment'}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem' }}>
                      <User size={14} color="var(--text-muted)" />
                      {m.created_by_name || 'System Auto'}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      <Calendar size={14} />
                      {new Date(m.created_at).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manual Stock Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record New Stock Movement"
      >
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-control"
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.sku}) — Available Stock: {p.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-control"
                value={formData.movement_type}
                onChange={(e) => setFormData({ ...formData, movement_type: e.target.value as 'IN' | 'OUT' })}
              >
                <option value="IN">IN (Stock Intake)</option>
                <option value="OUT">OUT (Stock Dispatch / Issue)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="1"
                required
                className="form-control"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Note</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Supplier Shipment Receiving / Damaged Stock Removal"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
