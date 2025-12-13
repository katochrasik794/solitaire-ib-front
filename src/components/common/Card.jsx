import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  header = null, 
  icon = null, 
  padding = 'p-6',
  hover = false,
  ...props 
}) => {
  const baseClasses = 'bg-white rounded-lg shadow-sm border border-gray-200';
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : '';
  
  return (
    <div 
      className={`${baseClasses} ${hoverClasses} ${className}`}
      {...props}
    >
      {header && (
        <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
          {icon && (
            <div className="flex items-center justify-center w-8 h-8 text-gray-600">
              {icon}
            </div>
          )}
          <h3 className="text-lg font-semibold text-gray-900">{header}</h3>
        </div>
      )}
      <div className={padding}>
        {children}
      </div>
    </div>
  );
};

export default Card;
