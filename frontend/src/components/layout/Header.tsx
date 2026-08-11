import React from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();

  return (
    <header className="app-header">
      <div className="header-left">
        <button className="mobile-menu-btn" onClick={onToggleSidebar}>
          <Menu size={22} />
        </button>
        <div className="header-greeting">
          Operations Control Portal
        </div>
      </div>

      <div className="header-right">
        <div className="role-pill">
          <ShieldCheck size={14} />
          <span>{user?.role} MODE</span>
        </div>
      </div>

      <style>{`
        .app-header {
          height: 64px;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 2rem;
          sticky;
          top: 0;
          z-index: 30;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .mobile-menu-btn {
          display: none;
          color: var(--text-main);
          padding: 0.25rem;
        }

        .header-greeting {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .role-pill {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          background: var(--primary-50);
          color: var(--primary-700);
          border: 1px solid var(--primary-200);
          padding: 0.3rem 0.75rem;
          border-radius: var(--radius-full);
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.04em;
        }

        @media (max-width: 1024px) {
          .app-header { padding: 0 1rem; }
          .mobile-menu-btn { display: block; }
        }
      `}</style>
    </header>
  );
};
