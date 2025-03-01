import React from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';
import { Briefcase, MapPin, Clock, DollarSign, Building } from 'lucide-react';

interface JobCardProps {
  job: Job;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getJobTypeClass = (jobType: string) => {
    switch (jobType) {
      case 'Full-time':
        return 'bg-blue-100 text-blue-800';
      case 'Part-time':
        return 'bg-green-100 text-green-800';
      case 'Contract':
        return 'bg-purple-100 text-purple-800';
      case 'Freelance':
        return 'bg-orange-100 text-orange-800';
      case 'Internship':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">{job.title}</h3>
          <p className="text-gray-600 mt-1 flex items-center">
            <Building className="h-4 w-4 mr-1" />
            {job.company?.name || 'Company'}
          </p>
        </div>
        {job.company?.logo_url ? (
          <img 
            src={job.company.logo_url} 
            alt={`${job.company.name} logo`} 
            className="h-12 w-12 object-contain rounded"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
            <Briefcase className="h-6 w-6 text-gray-500" />
          </div>
        )}
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getJobTypeClass(job.job_type)}`}>
          {job.job_type}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <DollarSign className="h-3 w-3 mr-1" />
          {job.salary_range}
        </span>
      </div>
      
      <div className="mt-4 space-y-2">
        <div className="flex items-center text-gray-600">
          <MapPin className="h-4 w-4 mr-2" />
          <span>{job.location}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <Clock className="h-4 w-4 mr-2" />
          <span>Posted on {formatDate(job.created_at)}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <p className="text-gray-700 line-clamp-2">{job.description}</p>
      </div>
      
      <div className="mt-6">
        <Link 
          to={`/jobs/${job.id}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default JobCard;