import React from 'react';

export const Card = ({ children, className = '' }) => {
  return <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>{children}</div>;
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <h3 className={`font-bold text-xl mb-2 ${className}`}>{children}</h3>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={`px-6 pb-6 ${className}`}>{children}</div>;
};