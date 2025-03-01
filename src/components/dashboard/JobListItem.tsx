import React from 'react';
import { Job } from '../../types';
import StatusBadge from './StatusBadge';

interface JobListItemProps {
  job: Job;
  formatDate: (dateString: string) => string;
  applicationCount: number;
  onView: (jobId: string) => void;
  onEdit: (jobId: string) => void;
  onToggleStatus: (jobId: string, isActive: boolean) => void;
}

const JobListItem: React.FC<JobListItemProps> = ({
  job,
  formatDate,
  applicationCount,
  onView,
  onEdit,
  onToggleStatus
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{job.title}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{job.location}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{formatDate(job.created_at)}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={job.is_active ? 'active' : 'inactive'} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-500">{applicationCount} applications</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button
          onClick={() => onView(job.id)}
          className="text-blue-600 hover:text-blue-900 mr-4"
        >
          View
        </button>
        <button
          onClick={() => onEdit(job.id)}
          className="text-indigo-600 hover:text-indigo-900 mr-4"
        >
          Edit
        </button>
        <button
          onClick={() => onToggleStatus(job.id, !job.is_active)}
          className={`${job.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
        >
          {job.is_active ? 'Deactivate' : 'Activate'}
        </button>
      </td>
    </tr>
  );
};

export default JobListItem;