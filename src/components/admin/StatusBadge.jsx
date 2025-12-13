import React from 'react';

const StatusBadge = ({ 
  status, 
  size = 'md',
  className = '' 
}) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'success':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          dot: 'bg-green-400'
        };
      case 'pending':
      case 'processing':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          dot: 'bg-yellow-400'
        };
      case 'suspended':
      case 'rejected':
      case 'cancelled':
      case 'failed':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          dot: 'bg-red-400'
        };
      case 'inactive':
      case 'draft':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          dot: 'bg-gray-400'
        };
      default:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-800',
          dot: 'bg-blue-400'
        };
    }
  };

  const getSizeClasses = (size) => {
    switch (size) {
      case 'sm':
        return 'px-2 py-1 text-xs';
      case 'lg':
        return 'px-4 py-2 text-sm';
      default:
        return 'px-3 py-1 text-sm';
    }
  };

  const config = getStatusConfig(status);
  const sizeClasses = getSizeClasses(size);

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bg} ${config.text} ${sizeClasses} ${className}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`}></div>
      {status}
    </span>
  );
};

export default StatusBadge;
