import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Briefcase, DollarSign, MapPin, Clock, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

interface JobFormData {
  title: string;
  description: string;
  location: string;
  salary_range: string;
  job_type: string;
  requirements: string;
}

const PostJob: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors } } = useForm<JobFormData>();

  useEffect(() => {
    // Fetch the company ID for the current user
    const fetchCompanyId = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching company ID:', error);
          return;
        }
        
        if (data) {
          setCompanyId(data.id);
        }
      } catch (error) {
        console.error('Error in fetchCompanyId:', error);
      }
    };
    
    fetchCompanyId();
  }, [user]);

  const onSubmit = async (data: JobFormData) => {
    if (!user || !companyId) {
      toast.error('Company profile not found. Please contact support.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const { data: job, error } = await supabase
        .from('jobs')
        .insert({
          title: data.title,
          description: data.description,
          company_id: companyId,
          location: data.location,
          salary_range: data.salary_range,
          job_type: data.job_type,
          requirements: data.requirements,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Job posted successfully!');
      navigate(`/jobs/${job.id}`);
    } catch (error) {
      console.error('Error posting job:', error);
      toast.error('Failed to post job');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Redirect if not logged in or not a company
  if (!user || user.userType !== 'company') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
        <p className="mt-2 text-gray-600">You need to be logged in as an employer to post jobs.</p>
        <button
          onClick={() => navigate('/signin')}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="text-center">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Setting up your company profile</h3>
          <p className="mt-1 text-gray-500">Please wait while we prepare your account...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Post a New Job</h1>
            <p className="mt-2">Fill out the form below to create a new job listing</p>
          </div>

          <div className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Job Title
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="title"
                    type="text"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.title ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="e.g. Senior React Developer"
                    {...register('title', {
                      required: 'Job title is required',
                    })}
                  />
                </div>
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="location"
                      type="text"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.location ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g. New York, NY or Remote"
                      {...register('location', {
                        required: 'Location is required',
                      })}
                    />
                  </div>
                  {errors.location && (
                    <p className="mt-2 text-sm text-red-600">{errors.location.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="salary_range" className="block text-sm font-medium text-gray-700">
                    Salary Range
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="salary_range"
                      type="text"
                      className={`block w-full pl-10 pr-3 py-2 border ${
                        errors.salary_range ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="e.g. $80,000 - $100,000"
                      {...register('salary_range', {
                        required: 'Salary range is required',
                      })}
                    />
                  </div>
                  {errors.salary_range && (
                    <p className="mt-2 text-sm text-red-600">{errors.salary_range.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label htmlFor="job_type" className="block text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="job_type"
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.job_type ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    {...register('job_type', {
                      required: 'Job type is required',
                    })}
                  >
                    <option value="">Select Job Type</option>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                    <option value="Freelance">Freelance</option>
                    <option value="Internship">Internship</option>
                  </select>
                </div>
                {errors.job_type && (
                  <p className="mt-2 text-sm text-red-600">{errors.job_type.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Job Description
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="description"
                    rows={6}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.description ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="Describe the role, responsibilities, and ideal candidate..."
                    {...register('description', {
                      required: 'Job description is required',
                      minLength: {
                        value: 100,
                        message: 'Description should be at least 100 characters',
                      },
                    })}
                  />
                </div>
                {errors.description && (
                  <p className="mt-2 text-sm text-red-600">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                  Requirements
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute top-3 left-3 flex items-center pointer-events-none">
                    <FileText className="h-5 w-5 text-gray-400" />
                  </div>
                  <textarea
                    id="requirements"
                    rows={4}
                    className={`block w-full pl-10 pr-3 py-2 border ${
                      errors.requirements ? 'border-red-300' : 'border-gray-300'
                    } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="List the skills, qualifications, and experience required..."
                    {...register('requirements', {
                      required: 'Requirements are required',
                    })}
                  />
                </div>
                {errors.requirements && (
                  <p className="mt-2 text-sm text-red-600">{errors.requirements.message}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="mr-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Posting...
                    </span>
                  ) : (
                    'Post Job'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostJob;