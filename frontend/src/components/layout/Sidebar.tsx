import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  ArrowUpDown,
  FileText,
  UserCog,
  LogOut,
  Boxes,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout, hasRole } = useAuth();

  const navItemClass = ({ isActive }: { isActive: boolean }) =>
    `sidebar-link ${isActive ? 'active' : ''}`;

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo">
          <Boxes size={24} color="#818cf8" />
          <span>Nexus<b>ERP</b></span>
        </div>
        <button className="mobile-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="sidebar-menu">
        {/* Core */}
        <div className="menu-group-label">OVERVIEW</div>
        <NavLink to="/dashboard" className={navItemClass} onClick={onClose}>
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        {/* CRM */}
        {(hasRole('ADMIN', 'SALES', 'ACCOUNTS')) && (
          <>
            <div className="menu-group-label">CRM MODULE</div>
            <NavLink to="/customers" className={navItemClass} onClick={onClose}>
              <Users size={18} />
              <span>Customers</span>
            </NavLink>
          </>
        )}

        {/* Inventory */}
        {(hasRole('ADMIN', 'WAREHOUSE', 'SALES', 'ACCOUNTS')) && (
          <>
            <div className="menu-group-label">INVENTORY</div>
            <NavLink to="/products" className={navItemClass} onClick={onClose}>
              <Package size={18} />
              <span>Products & Stock</span>
            </NavLink>
            <NavLink to="/stock-movements" className={navItemClass} onClick={onClose}>
              <ArrowUpDown size={18} />
              <span>Stock Movements</span>
            </NavLink>
          </>
        )}

        {/* Sales */}
        {(hasRole('ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS')) && (
          <>
            <div className="menu-group-label">SALES & DISPATCH</div>
            <NavLink to="/challans" className={navItemClass} onClick={onClose}>
              <FileText size={18} />
              <span>Sales Challans</span>
            </NavLink>
          </>
        )}

        {/* Administration */}
        {hasRole('ADMIN') && (
          <>
            <div className="menu-group-label">ADMINISTRATION</div>
            <NavLink to="/users" className={navItemClass} onClick={onClose}>
              <UserCog size={18} />
              <span>User Management</span>
            </NavLink>
          </>
        )}
      </div>

      {/* Footer Profile */}
      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">{user?.name ? user.name[0].toUpperCase() : 'U'}</div>
          <div className="user-details">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout} title="Sign Out">
          <LogOut size={18} />
        </button>
      </div>

      <style>{`
        .sidebar {
          width: 260px;
          background: var(--bg-sidebar);
          color: var(--text-sidebar);
          display: flex;
          flex-direction: column;
          height: 100vh;
          position: sticky;
          top: 0;
          z-index: 50;
          transition: transform 0.3s ease;
        }

        .sidebar-brand {
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.02em;
        }
        .brand-logo b { color: #818cf8; }

        .mobile-close-btn {
          display: none;
          color: var(--text-sidebar);
        }

        .sidebar-menu {
          flex: 1;
          padding: 1.25rem 0.85rem;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .menu-group-label {
          font-size: 0.68rem;
          font-weight: 700;
          color: #64748b;
          letter-spacing: 0.08em;
          padding: 0.85rem 0.75rem 0.35rem 0.75rem;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0.75rem;
          border-radius: var(--radius-md);
          font-size: 0.875rem;
          font-weight: 500;
          color: #94a3b8;
          transition: var(--transition-fast);
        }

        .sidebar-link:hover {
          background: var(--bg-sidebar-hover);
          color: #ffffff;
        }

        .sidebar-link.active {
          background: linear-gradient(90deg, var(--primary-600), var(--primary-700));
          color: #ffffff;
          font-weight: 600;
          box-shadow: 0 2px 4px rgba(79, 70, 229, 0.3);
        }

        .sidebar-footer {
          padding: 1rem 1.25rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(15, 23, 42, 0.8);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          min-width: 0;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #818cf8);
          color: #ffffff;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .user-details {
          min-width: 0;
        }

        .user-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-role {
          font-size: 0.7rem;
          color: #818cf8;
          font-weight: 600;
          text-transform: uppercase;
        }

        .logout-btn {
          color: #94a3b8;
          padding: 0.4rem;
          border-radius: var(--radius-sm);
          transition: var(--transition-fast);
        }
        .logout-btn:hover {
          color: #ef4444;
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 1024px) {
          .sidebar {
            position: fixed;
            left: 0;
            top: 0;
            bottom: 0;
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
          .mobile-close-btn {
            display: block;
          }
        }
      `}</style>
    </aside>
  );
};
