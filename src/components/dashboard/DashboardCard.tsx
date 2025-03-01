import React, { ReactNode } from 'react';

interface DashboardCardProps {
  title: string;
  children: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, action }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {action && (
          <button 
            onClick={action.onClick}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

export default DashboardCard;