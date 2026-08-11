import React, { useEffect, useState } from 'react';
import { dashboardApi } from '../api/dashboardApi';
import { DashboardStats } from '../types';
import { StatCard } from '../components/ui/StatCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Users, Package, AlertTriangle, FileText, ArrowUpDown, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const { hasRole } = useAuth();

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await dashboardApi.getStats();
        setStats(res.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard metrics');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) return <LoadingSpinner message="Calculating real-time business metrics..." />;
  if (error) return <div className="card" style={{ color: 'var(--danger-text)' }}>{error}</div>;

  const m = stats?.metrics;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Operations Dashboard</h1>
          <p className="page-subtitle">Real-time overview of customers, inventory, stock movements, and sales challans</p>
        </div>
        {hasRole('ADMIN', 'SALES') && (
          <Link to="/challans/new" className="btn btn-primary">
            <Plus size={18} />
            Create Sales Challan
          </Link>
        )}
      </div>

      {/* Metrics Row */}
      <div className="dashboard-grid">
        <StatCard title="Total Customers" value={m?.totalCustomers || 0} icon={Users} color="primary" />
        <StatCard title="Product Catalog" value={m?.totalProducts || 0} icon={Package} color="info" />
        <StatCard title="Total Stock Units" value={m?.totalStockUnits || 0} icon={ArrowUpDown} color="success" />
        <StatCard title="Low Stock Alerts" value={m?.lowStockCount || 0} icon={AlertTriangle} color="danger" />
        <StatCard title="Total Challans" value={m?.totalChallans || 0} subtitle={`${m?.confirmedChallans} Confirmed / ${m?.draftChallans} Draft`} icon={FileText} color="warning" />
      </div>

      {/* Tables Row */}
      <div className="dashboard-content-grid">
        {/* Recent Challans */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header-flex">
            <h3>Recent Sales Challans</h3>
            <Link to="/challans" className="view-all-link">View All</Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Challan #</th>
                  <th>Customer</th>
                  <th>Total Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentChallans && stats.recentChallans.length > 0 ? (
                  stats.recentChallans.map((ch) => (
                    <tr key={ch.id}>
                      <td><span style={{ fontWeight: 600, color: 'var(--primary-600)' }}>{ch.challan_number}</span></td>
                      <td>{ch.customer_name}</td>
                      <td>{ch.total_quantity} units</td>
                      <td><StatusBadge status={ch.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center' }}>No recent challans found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ padding: 0 }}>
          <div className="card-header-flex">
            <h3>Low Stock Watchlist</h3>
            <Link to="/products?lowStock=true" className="view-all-link">View All</Link>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Current Stock</th>
                  <th>Min Threshold</th>
                </tr>
              </thead>
              <tbody>
                {stats?.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                  stats.lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.product_name}</td>
                      <td><code>{p.sku}</code></td>
                      <td>
                        <span style={{ color: 'var(--danger-text)', fontWeight: 700 }}>
                          {p.current_stock}
                        </span>
                      </td>
                      <td>{p.minimum_stock}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--success-text)' }}>All products meet stock requirements.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Stock Movement Audit Log */}
      <div className="card" style={{ padding: 0, marginTop: '1.5rem' }}>
        <div className="card-header-flex">
          <h3>Recent Inventory Movement History</h3>
          <Link to="/stock-movements" className="view-all-link">Full Audit Log</Link>
        </div>
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Reason</th>
                <th>Logged By</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats?.recentMovements && stats.recentMovements.length > 0 ? (
                stats.recentMovements.map((sm) => (
                  <tr key={sm.id}>
                    <td><StatusBadge status={sm.movement_type} /></td>
                    <td style={{ fontWeight: 600 }}>{sm.product_name}</td>
                    <td><code>{sm.sku}</code></td>
                    <td style={{ fontWeight: 700 }}>{sm.quantity}</td>
                    <td>{sm.reason || 'N/A'}</td>
                    <td>{sm.created_by_name || 'System'}</td>
                    <td>{new Date(sm.created_at).toLocaleDateString()}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} style={{ textAlign: 'center' }}>No stock movements recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .dashboard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.75rem;
        }

        .dashboard-content-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .card-header-flex {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .card-header-flex h3 {
          font-size: 1.05rem;
          font-weight: 700;
        }

        .view-all-link {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--primary-600);
        }
        .view-all-link:hover { text-decoration: underline; }

        @media (max-width: 1024px) {
          .dashboard-content-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};
