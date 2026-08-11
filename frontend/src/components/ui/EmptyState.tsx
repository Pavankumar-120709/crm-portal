import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No data found',
  description = 'There are no records to display at this time.',
  action,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3.5rem 1.5rem', textAlign: 'center', background: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', marginBottom: '1rem' }}>
        <Inbox size={28} />
      </div>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.35rem' }}>{title}</h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', maxWidth: '380px', marginBottom: action ? '1.25rem' : '0' }}>{description}</p>
      {action}
    </div>
  );
};
