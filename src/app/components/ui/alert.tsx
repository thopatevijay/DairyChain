import React from 'react';

interface AlertProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'success' | 'error' | 'info';
}

export const Alert: React.FC<AlertProps> = ({ children, className = '', variant = 'info' }) => {
  const variantClasses = {
    success: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className={`p-4 rounded-lg shadow-md ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

export const AlertTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <h4 className="font-bold mb-2">{children}</h4>;
};

export const AlertDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="text-sm">{children}</div>;
};