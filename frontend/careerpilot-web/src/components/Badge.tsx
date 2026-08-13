import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'brand' | 'surface' | 'emerald' | 'amber' | 'blue';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'brand',
  className = '',
}) => {
  const variantStyles = {
    brand: 'bg-brand-50 text-brand-700 border-brand-200',
    surface: 'bg-surface-100 text-surface-700 border-surface-200',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
