import React from 'react';

const AdminCard = ({ 
  children, 
  className = '', 
  header, 
  icon,
  contentClassName,
  ...props 
}) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`} {...props}>
      {header && (
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {icon && <span className="text-gray-600">{icon}</span>}
            <h3 className="text-sm sm:text-base font-medium text-gray-900">{header}</h3>
          </div>
        </div>
      )}
      <div className={contentClassName || "p-3 sm:p-4 lg:p-6"}>
        {children}
      </div>
    </div>
  );
};

export default AdminCard;
