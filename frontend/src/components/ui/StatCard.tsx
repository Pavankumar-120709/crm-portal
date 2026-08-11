import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'primary',
}) => {
  const colorMap = {
    primary: { bg: 'rgba(99, 102, 241, 0.1)', text: '#4f46e5' },
    success: { bg: 'rgba(16, 185, 129, 0.1)', text: '#10b981' },
    warning: { bg: 'rgba(245, 158, 11, 0.1)', text: '#d97706' },
    danger: { bg: 'rgba(239, 68, 68, 0.1)', text: '#dc2626' },
    info: { bg: 'rgba(2, 132, 199, 0.1)', text: '#0284c7' },
  };

  const style = colorMap[color];

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {title}
        </div>
        <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.35rem', color: 'var(--text-main)', letterSpacing: '-0.03em' }}>
          {value}
        </div>
        {subtitle && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {subtitle}
          </div>
        )}
      </div>
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: style.bg,
          color: style.text,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={26} />}
      </div>
    </div>
  );
};
