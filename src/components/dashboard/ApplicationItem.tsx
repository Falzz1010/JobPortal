import React from 'react';
import { User, FileText, XCircle, CheckCircle, AlertCircle } from 'lucide-react';
import { Application } from '../../types';
import StatusBadge from './StatusBadge';

interface ApplicationItemProps {
  application: Application;
  onUpdateStatus?: (applicationId: string, status: string) => void;
  formatDate: (dateString: string) => string;
}

const ApplicationItem: React.FC<ApplicationItemProps> = ({ 
  application, 
  onUpdateStatus,
  formatDate
}) => {
  return (
    <div className="bg-gray-50 rounded-lg p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start">
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {application.job?.title}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Applied on {formatDate(application.created_at)}
          </p>
          <div className="mt-2">
            <StatusBadge status={application.status} />
          </div>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col md:items-end">
          <div className="flex items-center">
            <User className="h-5 w-5 text-gray-400 mr-2" />
            <span className="text-sm font-medium text-gray-900">
              {application.applicant?.full_name || 'Applicant'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900">Cover Letter</h4>
        <p className="mt-2 text-sm text-gray-600 whitespace-pre-line">
          {application.cover_letter}
        </p>
      </div>
      
      <div className="mt-4 border-t border-gray-200 pt-4">
        <h4 className="text-sm font-medium text-gray-900">Resume</h4>
        <a 
          href={application.resume_url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
        >
          <FileText className="h-4 w-4 mr-1" />
          View Resume
        </a>
      </div>
      
      {onUpdateStatus && (
        <div className="mt-4 border-t border-gray-200 pt-4 flex justify-end space-x-4">
          {application.status === 'pending' && (
            <>
              <button
                onClick={() => onUpdateStatus(application.id, 'reviewing')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                Mark as Reviewing
              </button>
              <button
                onClick={() => onUpdateStatus(application.id, 'rejected')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </button>
            </>
          )}
          
          {application.status === 'reviewing' && (
            <>
              <button
                onClick={() => onUpdateStatus(application.id, 'accepted')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                Accept
              </button>
              <button
                onClick={() => onUpdateStatus(application.id, 'rejected')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <XCircle className="h-3.5 w-3.5 mr-1" />
                Reject
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default ApplicationItem;