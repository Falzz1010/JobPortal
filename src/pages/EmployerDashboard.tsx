import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Job, Application } from '../types';
import { 
  Briefcase, FileText, User, Building, Clock, CheckCircle, XCircle, 
  AlertCircle, Edit, Upload, Plus, ChevronDown, ChevronUp, Users, 
  BarChart2, DollarSign, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import reusable components
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import DashboardCard from '../components/dashboard/DashboardCard';
import EmptyState from '../components/dashboard/EmptyState';
import ApplicationItem from '../components/dashboard/ApplicationItem';
import JobListItem from '../components/dashboard/JobListItem';
import CompanyProfileForm from '../components/dashboard/CompanyProfileForm';
import { ApplicationsStatusChart, JobsActivityChart, ApplicationTrendsChart } from '../components/dashboard/DashboardCharts';

const EmployerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [companyData, setCompanyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'jobs' | 'applications' | 'company'>('overview');
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
    pendingApplications: 0,
    reviewingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0
  });
  
  // Chart data
  const [chartData, setChartData] = useState({
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    jobsPosted: [2, 3, 1, 4, 2, 3],
    applications: [5, 10, 8, 15, 12, 20],
    dates: ['1 May', '8 May', '15 May', '22 May', '29 May', '5 Jun'],
    applicationTrend: [4, 6, 8, 10, 7, 12]
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (user.userType !== 'company') {
      navigate('/dashboard/job-seeker');
      return;
    }

    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchCompanyData(),
        fetchJobs(),
        fetchApplicationStats()
      ]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) throw error;
      setCompanyData(data);
      
      // After getting company data, fetch applications
      if (data) {
        fetchApplications(data.id);
      }
    } catch (error) {
      console.error('Error fetching company data:', error);
    }
  };

  const fetchJobs = async () => {
    if (!user) return;
    
    try {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!companyData) {
        setJobs([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('company_id', companyData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setJobs(data || []);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        totalJobs: data?.length || 0,
        activeJobs: data?.filter(job => job.is_active).length || 0
      }));
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async (companyId: string) => {
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
      const { data: applicationsData, error } = await supabase
        .from('applications')
        .select(`
          *,
          job:jobs(*)
        `)
        .in('job_id', jobIds)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Now fetch applicant profiles separately
      if (applicationsData && applicationsData.length > 0) {
        const applicationsWithProfiles = await Promise.all(
          applicationsData.map(async (application) => {
            // Get applicant profile
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', application.applicant_id)
              .single();
              
            if (profileError && profileError.code !== 'PGRST116') {
              console.error('Error fetching applicant profile:', profileError);
            }
            
            return {
              ...application,
              applicant: profileData || null
            };
          })
        );
        
        setApplications(applicationsWithProfiles);
      } else {
        setApplications([]);
      }
    } catch (error) {
      console.error('Error fetching job applications:', error);
    }
  };

  const fetchApplicationStats = async () => {
    if (!user) return;
    
    try {
      const { data: companyData } = await supabase
        . from('companies')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!companyData) return;
      
      // Get all jobs for this company
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id')
        .eq('company_id', companyData.id);
      
      if (!jobsData || jobsData.length === 0) {
        setStats(prev => ({
          ...prev,
          totalApplications: 0,
          pendingApplications: 0,
          reviewingApplications: 0,
          acceptedApplications: 0,
          rejectedApplications: 0
        }));
        return;
      }
      
      const jobIds = jobsData.map(job => job.id);
      
      // Get application counts
      const { count: totalCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds);
      
      const { count: pendingCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'pending');
      
      const { count: reviewingCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'reviewing');
      
      const { count: acceptedCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'accepted');
      
      const { count: rejectedCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .in('job_id', jobIds)
        .eq('status', 'rejected');
      
      setStats(prev => ({
        ...prev,
        totalApplications: totalCount || 0,
        pendingApplications: pendingCount || 0,
        reviewingApplications: reviewingCount || 0,
        acceptedApplications: acceptedCount || 0,
        rejectedApplications: rejectedCount || 0
      }));
    } catch (error) {
      console.error('Error fetching application stats:', error);
    }
  };

  const updateJobStatus = async (jobId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ is_active: isActive })
        .eq('id', jobId);

      if (error) throw error;
      
      // Update local state
      setJobs(jobs.map(job => 
        job.id === jobId ? { ...job, is_active: isActive } : job
      ));
      
      toast.success(`Job ${isActive ? 'activated' : 'deactivated'} successfully`);
      
      // Update stats
      setStats(prev => ({
        ...prev,
        activeJobs: isActive 
          ? prev.activeJobs + 1 
          : prev.activeJobs - 1
      }));
    } catch (error) {
      console.error('Error updating job status:', error);
      toast.error('Failed to update job status');
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
      
      // Update stats and refetch to get accurate counts
      fetchApplicationStats();
    } catch (error) {
      console.error('Error updating application status:', error);
      toast.error('Failed to update application status');
    }
  };

  const updateCompanyProfile = async (formData: any) => {
    if (!user || !companyData) return;
    
    try {
      const { error } = await supabase
        .from('companies')
        .update(formData)
        .eq('id', companyData.id);

      if (error) throw error;
      
      // Update local state
      setCompanyData({ ...companyData, ...formData });
      setIsEditingCompany(false);
      
      toast.success('Company profile updated successfully');
    } catch (error) {
      console.error('Error updating company profile:', error);
      toast.error('Failed to update company profile');
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

  const getApplicationCount = (jobId: string) => {
    return applications.filter(app => app.job_id === jobId).length;
  };

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
            <h1 className="text-2xl font-bold">Employer Dashboard</h1>
            <p className="mt-2">Manage your job listings, applications, and company profile</p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart2 className="h-5 w-5 inline-block mr-2" />
                Overview
              </button>
              <button
                onClick={() => setActiveTab('jobs')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'jobs'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Briefcase className="h-5 w-5 inline-block mr-2" />
                Job Listings
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {jobs.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'applications'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="h-5 w-5 inline-block mr-2" />
                Applications
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {applications.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('company')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'company'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Building className="h-5 w-5 inline-block mr-2" />
                Company Profile
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Overview</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <StatCard 
                    title="Total Jobs" 
                    value={stats.totalJobs} 
                    subtitle={`${stats.activeJobs} active jobs`}
                    icon={Briefcase}
                    color="blue"
                  />
                  
                  <StatCard 
                    title="Applications" 
                    value={stats.totalApplications} 
                    subtitle={`${stats.pendingApplications} pending`}
                    icon={Users}
                    color="green"
                  />
                  
                  <StatCard 
                    title="Hired" 
                    value={stats.acceptedApplications} 
                    subtitle="Accepted applications"
                    icon={CheckCircle}
                    color="purple"
                  />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                  <DashboardCard 
                    title="Applications by Status"
                    action={{
                      label: "View All",
                      onClick: () => setActiveTab('applications')
                    }}
                  >
                    <ApplicationsStatusChart 
                      pending={stats.pendingApplications}
                      reviewing={stats.reviewingApplications}
                      accepted={stats.acceptedApplications}
                      rejected={stats.rejectedApplications}
                    />
                  </DashboardCard>
                  
                  <DashboardCard 
                    title="Monthly Activity"
                  >
                    <JobsActivityChart 
                      months={chartData.months}
                      jobsPosted={chartData.jobsPosted}
                      applications={chartData.applications}
                    />
                  </DashboardCard>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DashboardCard 
                    title="Recent Job Listings"
                    action={{
                      label: "Post New Job",
                      onClick: () => navigate('/jobs/post')
                    }}
                  >
                    {jobs.length > 0 ? (
                      <div className="space-y-4">
                        {jobs.slice(0, 3).map((job) => (
                          <div key={job.id} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                            <div>
                              <h4 className="font-medium text-gray-900">{job.title}</h4>
                              <p className="text-sm text-gray-500">
                                Posted on {formatDate(job.created_at)}
                              </p>
                            </div>
                            <div>
                              <StatusBadge status={job.is_active ? 'active' : 'inactive'} />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <EmptyState 
                        icon={Briefcase}
                        title="No jobs posted"
                        description="Get started by creating a new job listing."
                        action={
                          <Link
                            to="/jobs/post"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Briefcase className="h-4 w-4 mr-2" />
                            Post a Job
                          </Link>
                        }
                      />
                    )}
                  </DashboardCard>
                  
                  <DashboardCard 
                    title="Application Trends"
                  >
                    <ApplicationTrendsChart 
                      dates={chartData.dates}
                      applications={chartData.applicationTrend}
                    />
                  </DashboardCard>
                </div>
              </div>
            )}

            {activeTab === 'jobs' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Your Job Listings</h2>
                  <Link
                    to="/jobs/post"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Post New Job
                  </Link>
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
                          <JobListItem 
                            key={job.id}
                            job={job}
                            formatDate={formatDate}
                            applicationCount={getApplicationCount(job.id)}
                            onView={(id) => navigate(`/jobs/${id}`)}
                            onEdit={(id) => navigate(`/jobs/edit/${id}`)}
                            onToggleStatus={updateJobStatus}
                          />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState 
                    icon={Briefcase}
                    title="No jobs posted yet"
                    description="Get started by creating a new job listing."
                    action={
                      <Link
                        to="/jobs/post"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Post a Job
                      </Link>
                    }
                  />
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Applications Received</h2>
                
                {applications.length > 0 ? (
                  <div className="space-y-6">
                    {applications.map((application) => (
                      <ApplicationItem 
                        key={application.id}
                        application={application}
                        onUpdateStatus={updateApplicationStatus}
                        formatDate={formatDate}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={FileText}
                    title="No applications yet"
                    description="Applications for your job listings will appear here."
                  />
                )}
              </div>
            )}

            {activeTab === 'company' && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Company Profile</h2>
                
                {companyData ? (
                  isEditingCompany ? (
                    <CompanyProfileForm 
                      initialData={companyData}
                      onSubmit={updateCompanyProfile}
                      onCancel={() => setIsEditingCompany(false)}
                    />
                  ) : (
                    <div className="bg-white overflow-hidden">
                      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center">
                          {companyData.logo_url ? (
                            <img
                              className="h-16 w-16 rounded-full mr-4 object-cover"
                              src={companyData.logo_url}
                              alt={companyData.name}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                              <Building className="h-8 w-8 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                              {companyData.name}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              {companyData.industry}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Company name</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {companyData.name}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Description</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {companyData.description}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Industry</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {companyData.industry}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Website</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {companyData.website ? (
                                <a 
                                  href={companyData.website} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {companyData.website}
                                </a>
                              ) : (
                                'Not provided'
                              )}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Location</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {companyData.location || 'Not provided'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                      <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
                        <button
                          onClick={() => setIsEditingCompany(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </button>
                      </div>
                    </div>
                  )
                ) : (
                  <EmptyState 
                    icon={Building}
                    title="Company profile not found"
                    description="Please create your company profile to get started."
                    action={
                      <button
                        onClick={() => setIsEditingCompany(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Create Profile
                      </button>
                    }
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployerDashboard;