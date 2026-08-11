import React from 'react';

interface StatusBadgeProps {
  status: any;
  type?: 'customerStatus' | 'customerType' | 'challanStatus' | 'movementType' | 'stockStatus';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const strStatus = status !== null && status !== undefined ? String(status) : '';
  const normalized = strStatus.toUpperCase();

  let badgeClass = 'badge-neutral';
  if (['ACTIVE', 'CONFIRMED', 'IN', 'IN_STOCK'].includes(normalized)) {
    badgeClass = 'badge-success';
  } else if (['LEAD', 'DRAFT', 'WHOLESALE', 'LOW_STOCK'].includes(normalized)) {
    badgeClass = 'badge-warning';
  } else if (['INACTIVE', 'CANCELLED', 'OUT', 'OUT_OF_STOCK'].includes(normalized)) {
    badgeClass = 'badge-danger';
  } else if (['DISTRIBUTOR', 'RETAIL'].includes(normalized)) {
    badgeClass = 'badge-info';
  }

  return (
    <span className={`badge ${badgeClass}`}>
      {normalized || 'UNKNOWN'}
    </span>
  );
};
