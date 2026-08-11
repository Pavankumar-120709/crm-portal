import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <h1 style={{ fontSize: '4rem', fontWeight: 800, color: 'var(--primary-600)' }}>404</h1>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>The page or record you requested does not exist or has been moved.</p>
      <Link to="/dashboard" className="btn btn-primary">
        <Home size={18} /> Back to Dashboard
      </Link>
    </div>
  );
};
