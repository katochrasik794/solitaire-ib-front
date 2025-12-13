import React from 'react';
import { FiEye, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import Button from '../common/Button';

const ActionButtons = ({ 
  onView, 
  onEdit, 
  onDelete, 
  onApprove, 
  onReject,
  item,
  className = '' 
}) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {onView && (
        <Button
          variant="ghost"
          size="sm"
          icon={<FiEye className="h-4 w-4" />}
          onClick={() => onView(item)}
          className="text-blue-600 hover:text-blue-700 p-1"
          title="View"
        />
      )}
      
      {onEdit && (
        <Button
          variant="ghost"
          size="sm"
          icon={<FiEdit className="h-4 w-4" />}
          onClick={() => onEdit(item)}
          className="text-green-600 hover:text-green-700 p-1"
          title="Edit"
        />
      )}
      
      {onApprove && (
        <Button
          variant="ghost"
          size="sm"
          icon={<FiCheck className="h-4 w-4" />}
          onClick={() => onApprove(item)}
          className="text-green-600 hover:text-green-700 p-1"
          title="Approve"
        />
      )}
      
      {onReject && (
        <Button
          variant="ghost"
          size="sm"
          icon={<FiX className="h-4 w-4" />}
          onClick={() => onReject(item)}
          className="text-red-600 hover:text-red-700 p-1"
          title="Reject"
        />
      )}
      
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          icon={<FiTrash2 className="h-4 w-4" />}
          onClick={() => onDelete(item)}
          className="text-red-600 hover:text-red-700 p-1"
          title="Delete"
        />
      )}
    </div>
  );
};

export default ActionButtons;
