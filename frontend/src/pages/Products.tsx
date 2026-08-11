import React, { useEffect, useState } from 'react';
import { productApi } from '../api/productApi';
import { stockApi } from '../api/stockApi';
import { Product } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { Search, Plus, Edit2, ArrowUpDown, AlertTriangle, Trash2, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Add / Edit Product Modal
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState({
    product_name: '',
    sku: '',
    category: 'General',
    unit_price: 0,
    current_stock: 0,
    minimum_stock: 0,
    warehouse_location: '',
  });

  // Stock Movement Modal
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForStock, setSelectedProductForStock] = useState<Product | null>(null);
  const [stockForm, setStockForm] = useState({
    quantity: 1,
    movement_type: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasRole } = useAuth();

  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await productApi.getProducts({
        search,
        category: categoryFilter,
        lowStock: lowStockOnly,
        page,
        limit: 10,
      });
      setProducts(res.data);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages);
      }
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, categoryFilter, lowStockOnly, page]);

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      product_name: '',
      sku: '',
      category: 'General',
      unit_price: 0,
      current_stock: 0,
      minimum_stock: 5,
      warehouse_location: '',
    });
    setSubmitError('');
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      product_name: p.product_name,
      sku: p.sku,
      category: p.category,
      unit_price: p.unit_price,
      current_stock: p.current_stock,
      minimum_stock: p.minimum_stock,
      warehouse_location: p.warehouse_location || '',
    });
    setSubmitError('');
    setIsProductModalOpen(true);
  };

  const openStockModal = (p: Product) => {
    setSelectedProductForStock(p);
    setStockForm({
      quantity: 1,
      movement_type: 'IN',
      reason: 'Manual Warehouse Adjustment',
    });
    setSubmitError('');
    setIsStockModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.product_name || !productForm.sku) {
      setSubmitError('Product name and SKU are required.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productApi.updateProduct(editingProduct.id, productForm);
      } else {
        await productApi.createProduct(productForm);
      }
      setIsProductModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductForStock) return;

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await stockApi.addMovement({
        product_id: selectedProductForStock.id,
        quantity: Number(stockForm.quantity),
        movement_type: stockForm.movement_type,
        reason: stockForm.reason,
      });
      setIsStockModalOpen(false);
      loadProducts();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productApi.deleteProduct(id);
        loadProducts();
      } catch (err: any) {
        alert(err.message || 'Failed to delete product');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stock Management</h1>
          <p className="page-subtitle">Track product stock levels, warehouse locations, and inventory intake/dispatch</p>
        </div>
        {hasRole('ADMIN', 'WAREHOUSE') && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} />
            Add Product
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
              placeholder="Search product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Filter by Category..."
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ width: '180px' }}
            />

            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600, color: lowStockOnly ? 'var(--danger-text)' : 'var(--text-main)' }}>
              <input
                type="checkbox"
                checked={lowStockOnly}
                onChange={(e) => setLowStockOnly(e.target.checked)}
              />
              <AlertTriangle size={16} color={lowStockOnly ? 'var(--danger-text)' : 'var(--text-muted)'} />
              Low Stock Only
            </label>
          </div>
        </div>
      </div>

      {/* Product Data Table */}
      {loading ? (
        <LoadingSpinner message="Loading inventory records..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="No products match your search or filter options."
          action={
            hasRole('ADMIN', 'WAREHOUSE') ? (
              <button className="btn btn-primary" onClick={openAddModal}>
                <Plus size={18} /> Add First Product
              </button>
            ) : undefined
          }
        />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock Level</th>
                <th>Min Stock</th>
                <th>Warehouse Location</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const isLowStock = p.current_stock <= p.minimum_stock;
                return (
                  <tr key={p.id} style={isLowStock ? { background: '#fff5f5' } : {}}>
                    <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                    <td><code>{p.sku}</code></td>
                    <td>{p.category}</td>
                    <td style={{ fontWeight: 700 }}>${Number(p.unit_price).toFixed(2)}</td>
                    <td>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isLowStock ? 'var(--danger-text)' : 'var(--text-main)' }}>
                        {p.current_stock}
                      </span>
                    </td>
                    <td>{p.minimum_stock}</td>
                    <td>{p.warehouse_location || 'Unassigned'}</td>
                    <td>
                      {isLowStock ? (
                        <StatusBadge status="LOW_STOCK" />
                      ) : (
                        <StatusBadge status="IN_STOCK" />
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        {hasRole('ADMIN', 'WAREHOUSE') && (
                          <>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                              onClick={() => openStockModal(p)}
                              title="Adjust Inventory Stock"
                            >
                              <ArrowUpDown size={14} /> Stock
                            </button>
                            <button className="btn-icon" onClick={() => openEditModal(p)} title="Edit Product">
                              <Edit2 size={18} />
                            </button>
                          </>
                        )}
                        {hasRole('ADMIN') && (
                          <button className="btn-icon" style={{ color: 'var(--danger-text)' }} onClick={() => handleDelete(p.id)} title="Delete Product">
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product to Inventory'}
      >
        <form onSubmit={handleProductSubmit}>
          {submitError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. Ergonomic Office Desk"
                value={productForm.product_name}
                onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">SKU (Stock Keeping Unit) *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="e.g. FURN-DESK-001"
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value.toUpperCase() })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                required
                className="form-control"
                placeholder="Electronics, Furniture, Office..."
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="form-control"
                value={productForm.unit_price}
                onChange={(e) => setProductForm({ ...productForm, unit_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                min="0"
                className="form-control"
                disabled={!!editingProduct}
                value={productForm.current_stock}
                onChange={(e) => setProductForm({ ...productForm, current_stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Minimum Stock Alert</label>
              <input
                type="number"
                min="0"
                className="form-control"
                value={productForm.minimum_stock}
                onChange={(e) => setProductForm({ ...productForm, minimum_stock: parseInt(e.target.value, 10) || 0 })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Warehouse Bay/Bin</label>
              <input
                type="text"
                className="form-control"
                placeholder="Aisle A1 - Bay 4"
                value={productForm.warehouse_location}
                onChange={(e) => setProductForm({ ...productForm, warehouse_location: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Movement Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Adjust Stock: ${selectedProductForStock?.product_name}`}
      >
        <form onSubmit={handleStockSubmit}>
          {submitError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          <div style={{ background: 'var(--bg-subtle)', padding: '0.85rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Current Stock Level</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedProductForStock?.current_stock} units</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type</label>
              <select
                className="form-control"
                value={stockForm.movement_type}
                onChange={(e) => setStockForm({ ...stockForm, movement_type: e.target.value as 'IN' | 'OUT' })}
              >
                <option value="IN">IN (Receive / Stock Intake)</option>
                <option value="OUT">OUT (Dispatch / Adjustment)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input
                type="number"
                min="1"
                required
                className="form-control"
                value={stockForm.quantity}
                onChange={(e) => setStockForm({ ...stockForm, quantity: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="e.g. New Shipment Intake / Stock Audit"
              value={stockForm.reason}
              onChange={(e) => setStockForm({ ...stockForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsStockModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Recording...' : 'Record Movement'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
