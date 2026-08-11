import React, { useEffect, useState } from 'react';
import { userApi } from '../api/userApi';
import { User, UserRole } from '../types';
import { StatusBadge } from '../components/ui/StatusBadge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { UserCog, Plus, Shield, Mail, Lock, Calendar } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as UserRole,
  });

  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await userApi.getUsers();
      setUsers(res.data);
    } catch (err: any) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openModal = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'SALES',
    });
    setSubmitError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setSubmitError('All fields are required.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);
    try {
      await userApi.createUser(formData);
      setIsModalOpen(false);
      loadUsers();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Account Administration</h1>
          <p className="page-subtitle">Manage portal users and assign Role-Based Access Control (RBAC) permissions</p>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <Plus size={18} />
          Add User Account
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="Retrieving user accounts..." />
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email Address</th>
                <th>Assigned Role</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>#{u.id}</td>
                  <td style={{ fontWeight: 600 }}>{u.name}</td>
                  <td>{u.email}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.8rem' }}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New User Account"
      >
        <form onSubmit={handleSubmit}>
          {submitError && (
            <div style={{ padding: '0.75rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderRadius: 'var(--radius-md)', marginBottom: '1rem', fontSize: '0.85rem' }}>
              {submitError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              className="form-control"
              placeholder="Jane Smith"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="janesmith@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="form-control"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              >
                <option value="ADMIN">ADMIN (Full Control)</option>
                <option value="SALES">SALES (CRM & Challans)</option>
                <option value="WAREHOUSE">WAREHOUSE (Stock & Inventory)</option>
                <option value="ACCOUNTS">ACCOUNTS (View & Audit)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
