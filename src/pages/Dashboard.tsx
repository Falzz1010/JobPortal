import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Job, Application, Company } from '../types';
import { Briefcase, FileText, User, Building, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>(
    tabFromUrl === 'applications' ? 'applications' : 'jobs'
  );

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      try {
        if (user.userType === 'company') {
          // First fetch company data
          const { data: company, error: companyError } = await supabase
            .from('companies')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (companyError) {
            console.error('Error fetching company data:', companyError);
            toast.error('Failed to load company data');
            setLoading(false);
            return;
          }
          
          setCompanyData(company);
          
          // Then fetch jobs using company ID
          await fetchCompanyJobs(company.id);
          await fetchJobApplications(company.id);
        } else {
          await fetchUserApplications();
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast.error('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const fetchCompanyJobs = async (companyId: string) => {
    if (!companyId) return;
    
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching company jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobApplications = async (companyId: string) => {
    if (!companyId) return;
    
    try {
      // First get all jobs for this company
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyId);
        
      if (jobsError) throw jobsError;
      
      if (!jobsData || jobsData.length === 0) {
        setApplications([]);
        return;
      }
      
      const jobIds = jobsData.map(job => job.id);
      
      // Then get applications for these jobs
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*),
          applicant:profiles(*)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching job applications:', error);
      toast.error('Failed to load applications');
    }
  };

  const fetchUserApplications = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('applicant_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch company data for each job
      if (data && data.length > 0) {
        const applicationsWithCompanies = await Promise.all(
          data.map(async (application) => {
            if (application.job && application.job.company_id) {
              const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', application.job.company_id)
                .single();
                
              if (!companyError && companyData) {
                return {
                  ...application,
                  job: {
                    ...application.job,
                    company: companyData
                  }
                };
              }
            }
            return application;
          })
        );
        
        setApplications(applicationsWithCompanies);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching user applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('applications')
        .update({ status })
        .eq('id', applicationId);

      if (error) throw error;
      
      // Update local state
      setApplications(applications.map(app => 
        app.id === applicationId ? { ...app, status } : app
      ));
      
      // Create notification for the applicant
      const application = applications.find(app => app.id === applicationId);
      if (application) {
        const statusMessages = {
          reviewing: 'Your application is now being reviewed.',
          accepted: 'Congratulations! Your application has been accepted.',
          rejected: 'Your application has been rejected. Thank you for your interest.'
        };
        
        const statusTitles = {
          reviewing: 'Application Under Review',
          accepted: 'Application Accepted',
          rejected: 'Application Status Update'
        };
        
        await supabase.from('notifications').insert({
          user_id: application.applicant_id,
          title: statusTitles[status as keyof typeof statusTitles] || 'Application Status Update',
          message: `${statusMessages[status as keyof typeof statusMessages] || `Your application status has been updated to: ${status}`} for the position of ${application.job?.title}.`,
          type: 'status',
          read: false,
          related_id: application.job_id
        });
      }
      
      toast.success(`Application ${status}`);
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" /> Pending</span>;
      case 'reviewing':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><AlertCircle className="h-3 w-3 mr-1" /> Reviewing</span>;
      case 'accepted':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" /> Accepted</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" /> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="bg-blue-600 text-white p-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-2">
              {user.userType === 'company' 
                ? 'Manage your job listings and applications' 
                : 'Track your job applications'}
            </p>
          </div>

          {user.userType === 'company' && (
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('jobs')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'jobs'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Briefcase className="h-5 w-5 inline-block mr-2" />
                  My Job Listings
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                    activeTab === 'applications'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <FileText className="h-5 w-5 inline-block mr-2" />
                  Applications
                </button>
              </nav>
            </div>
          )}

          <div className="p-6">
            {user.userType === 'company' && activeTab === 'jobs' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Job Listings</h2>
                  <button
                    onClick={() => navigate('/jobs/post')}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Post New Job
                  </button>
                </div>

                {jobs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Job Title
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posted Date
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Applications
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-gray-50">
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
                              {job.is_active ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {applications.filter(app => app.job_id === job.id).length} applications
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => navigate(`/jobs/${job.id}`)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View
                              </button>
                              <button
                                onClick={() => navigate(`/jobs/edit/${job.id}`)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs posted yet</h3>
                    <p className="mt-1 text-gray-500">Get started by creating a new job listing.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/jobs/post')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Post a Job
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : user.userType === 'company' && activeTab === 'applications' ? (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Applications Received</h2>
                
                {applications.length > 0 ? (
                  <div className="space-y-6">
                    {applications.map((application) => (
                      <div key={application.id} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {application.job?.title}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied on {formatDate(application.created_at)}
                            </p>
                            <div className="mt-2">
                              {getStatusBadge(application.status)}
                            </div>
                          </div>
                          <div className="mt-4 md:mt-0 flex flex-col md:items-end">
                            <div className="flex items-center">
                              <User className="h-5 w-5 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900">
                                {application.applicant?.full_name}
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
                        
                        <div className="mt-4 border-t border-gray-200 pt-4 flex justify-end space-x-4">
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'reviewing')}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <AlertCircle className="h-3.5 w-3.5 mr-1" />
                                Mark as Reviewing
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
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
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                              >
                                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                Accept
                              </button>
                              <button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                <XCircle className="h-3.5 w-3.5 mr-1" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-gray-500">Applications for your job listings will appear here.</p>
                  </div>
                )}
              </div>
            ) : (
              // Job seeker dashboard
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Applications</h2>
                
                {applications.length > 0 ? (
                  <div className="space-y-6">
                    {applications.map((application) => (
                      <div key={application.id} className="bg-gray-50 rounded-lg p-6 shadow-sm">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {application.job?.title}
                            </h3>
                            <div className="flex items-center mt-1">
                              <Building className="h-4 w-4 text-gray-400 mr-1" />
                              <span className="text-sm text-gray-600">
                                {application.job?.company?.name || 'Company'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Applied on {formatDate(application.created_at)}
                            </p>
                          </div>
                          <div className="mt-4 md:mt-0">
                            {getStatusBadge(application.status)}
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <button
                            onClick={() => navigate(`/jobs/${application.job_id}`)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Job
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No applications yet</h3>
                    <p className="mt-1 text-gray-500">You haven't applied to any jobs yet.</p>
                    <div className="mt-6">
                      <button
                        onClick={() => navigate('/jobs')}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Browse Jobs
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;