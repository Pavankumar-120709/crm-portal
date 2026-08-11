import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi } from '../api/customerApi';
import { productApi } from '../api/productApi';
import { challanApi } from '../api/challanApi';
import { Customer, Product } from '../types';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { ArrowLeft, Plus, Trash2, Save, ShoppingBag, AlertCircle } from 'lucide-react';

interface RowItem {
  product_id: string;
  quantity: number;
}

export const CreateChallan: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [customerId, setCustomerId] = useState('');
  const [rows, setRows] = useState<RowItem[]>([{ product_id: '', quantity: 1 }]);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [custRes, prodRes] = await Promise.all([
          customerApi.getCustomers({ page: 1, limit: 100 }),
          productApi.getProducts({ page: 1, limit: 100 }),
        ]);
        setCustomers(custRes.data);
        setProducts(prodRes.data);
      } catch (err: any) {
        setError('Failed to load initial customer or product options.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleAddRow = () => {
    setRows([...rows, { product_id: '', quantity: 1 }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: keyof RowItem, value: any) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  // Helper map for quick product lookup
  const productMap = new Map(products.map((p) => [String(p.id), p]));

  // Calculate totals
  let totalQuantity = 0;
  let totalAmount = 0;

  rows.forEach((r) => {
    const prod = productMap.get(r.product_id);
    const qty = Number(r.quantity) || 0;
    totalQuantity += qty;
    if (prod) {
      totalAmount += Number(prod.unit_price) * qty;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId) {
      setError('Please select a customer.');
      return;
    }

    if (rows.some((r) => !r.product_id || r.quantity <= 0)) {
      setError('Please select a valid product and positive quantity for all items.');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const res = await challanApi.createChallan({
        customer_id: parseInt(customerId, 10),
        items: rows.map((r) => ({
          product_id: parseInt(r.product_id, 10),
          quantity: Number(r.quantity),
        })),
      });
      navigate(`/challans/${res.data.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create draft challan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner message="Initializing Sales Challan Form..." />;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <button className="btn btn-secondary" onClick={() => navigate('/challans')}>
          <ArrowLeft size={16} /> Back to Sales Challans
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Generate New Sales Challan</h1>
          <p className="page-subtitle">Create a draft dispatch challan with line item pricing snapshots</p>
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '0.85rem 1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 500 }}>
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Customer Select Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShoppingBag size={20} color="var(--primary-600)" />
            Step 1: Select Customer
          </h3>

          <div className="form-group" style={{ maxWidth: '480px' }}>
            <label className="form-label">Customer Account *</label>
            <select
              className="form-control"
              required
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            >
              <option value="">-- Select Customer Account --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} {c.business_name ? `(${c.business_name})` : ''} — Mobile: {c.mobile}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Products Dynamic Rows Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Step 2: Add Line Items</h3>
            <button type="button" className="btn btn-secondary" onClick={handleAddRow}>
              <Plus size={16} /> Add Product Row
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>Product</th>
                  <th>Available Stock</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th>Unit Price ($)</th>
                  <th>Subtotal ($)</th>
                  <th style={{ width: '80px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const selectedProd = productMap.get(row.product_id);
                  const availableStock = selectedProd ? selectedProd.current_stock : 0;
                  const unitPrice = selectedProd ? Number(selectedProd.unit_price) : 0;
                  const subtotal = unitPrice * (Number(row.quantity) || 0);
                  const isInsufficient = selectedProd && row.quantity > availableStock;

                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-control"
                          required
                          value={row.product_id}
                          onChange={(e) => handleRowChange(idx, 'product_id', e.target.value)}
                        >
                          <option value="">-- Choose Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.product_name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {selectedProd ? (
                          <span style={{ fontWeight: 700, color: isInsufficient ? 'var(--danger-text)' : 'var(--success-text)' }}>
                            {availableStock} units
                            {isInsufficient && ' (Low Stock!)'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          required
                          className="form-control"
                          value={row.quantity}
                          onChange={(e) => handleRowChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                        />
                      </td>
                      <td style={{ fontWeight: 600 }}>${unitPrice.toFixed(2)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>${subtotal.toFixed(2)}</td>
                      <td>
                        <button
                          type="button"
                          className="btn-icon"
                          style={{ color: 'var(--danger-text)' }}
                          disabled={rows.length === 1}
                          onClick={() => handleRemoveRow(idx)}
                          title="Remove Line Item"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div style={{ textAlign: 'right', display: 'flex', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL QUANTITY</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{totalQuantity} units</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>ESTIMATED TOTAL AMOUNT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>${totalAmount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/challans')}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              <Save size={18} />
              {isSubmitting ? 'Saving Draft...' : 'Save Draft Sales Challan'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
