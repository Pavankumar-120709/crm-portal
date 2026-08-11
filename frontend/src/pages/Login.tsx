import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Lock, Mail, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@erp.com');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickRole = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
    setError('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="logo-badge">
            <Boxes size={32} color="#6366f1" />
          </div>
          <h1>Nexus ERP + CRM</h1>
          <p>Enterprise Operations & Sales Portal</p>
        </div>

        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                required
                className="form-control"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                required
                className="form-control"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign In to Portal'}
            {!isSubmitting && <ArrowRight size={18} />}
          </button>
        </form>

        <div className="quick-test-section">
          <div className="quick-title">
            <Shield size={14} /> Quick Demo Accounts (Click to test roles)
          </div>
          <div className="quick-buttons">
            <button type="button" onClick={() => fillQuickRole('admin@erp.com')}>Admin</button>
            <button type="button" onClick={() => fillQuickRole('sales@erp.com')}>Sales</button>
            <button type="button" onClick={() => fillQuickRole('warehouse@erp.com')}>Warehouse</button>
            <button type="button" onClick={() => fillQuickRole('accounts@erp.com')}>Accounts</button>
          </div>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
          padding: 1.5rem;
        }

        .login-card {
          background: #ffffff;
          border-radius: var(--radius-lg);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
          width: 100%;
          max-width: 440px;
          padding: 2.5rem;
          animation: modalPop 0.3s ease-out;
        }

        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-badge {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          background: #eef2ff;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem auto;
        }

        .login-header h1 {
          font-size: 1.6rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
        }

        .login-header p {
          font-size: 0.875rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #fee2e2;
          color: #b91c1c;
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          font-size: 0.85rem;
          font-weight: 500;
          margin-bottom: 1.5rem;
        }

        .input-with-icon {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 0.85rem;
          color: #94a3b8;
          pointer-events: none;
        }

        .input-with-icon .form-control {
          padding-left: 2.5rem;
          width: 100%;
        }

        .btn-block {
          width: 100%;
          padding: 0.75rem;
          font-size: 0.95rem;
          margin-top: 1rem;
        }

        .quick-test-section {
          margin-top: 2rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .quick-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 0.35rem;
          margin-bottom: 0.75rem;
        }

        .quick-buttons {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.5rem;
        }

        .quick-buttons button {
          padding: 0.4rem 0.25rem;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          border-radius: var(--radius-sm);
          font-size: 0.75rem;
          font-weight: 600;
          color: #334155;
          transition: var(--transition-fast);
        }

        .quick-buttons button:hover {
          background: #e0e7ff;
          color: #4338ca;
          border-color: #818cf8;
        }
      `}</style>
    </div>
  );
};
