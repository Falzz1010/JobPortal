import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Application, Bookmark, Job } from '../types';
import { 
  Briefcase, FileText, User, Building, Clock, CheckCircle, XCircle, 
  AlertCircle, Edit, Upload, BookmarkIcon, Star, MessageCircle, Plus,
  MapPin, DollarSign, BarChart2
} from 'lucide-react';
import toast from 'react-hot-toast';

// Import reusable components
import StatCard from '../components/dashboard/StatCard';
import StatusBadge from '../components/dashboard/StatusBadge';
import DashboardCard from '../components/dashboard/DashboardCard';
import EmptyState from '../components/dashboard/EmptyState';
import ProfileForm from '../components/dashboard/ProfileForm';
import { ApplicationTrendsChart } from '../components/dashboard/DashboardCharts';

const JobSeekerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<Application[]>([]);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'applications' | 'bookmarks' | 'recommended'>('profile');
  const [profile, setProfile] = useState<any>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<string>('all');
  
  // Stats
  const [stats, setStats] = useState({
    totalApplications: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    bookmarkedJobs: 0
  });
  
  // Chart data
  const [chartData, setChartData] = useState({
    dates: ['1 May', '8 May', '15 May', '22 May', '29 May', '5 Jun'],
    applicationTrend: [1, 0, 2, 1, 0, 1]
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (user.userType !== 'applicant') {
      navigate('/dashboard/employer');
      return;
    }

    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchProfile(),
        fetchApplications(),
        fetchBookmarks(),
        fetchRecommendedJobs()
      ]);
    } catch (error) {
      console.error('Error fetching user data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const fetchApplications = async () => {
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
        
        // Update stats
        const pending = applicationsWithCompanies.filter(app => app.status === 'pending').length;
        const accepted = applicationsWithCompanies.filter(app => app.status === 'accepted').length;
        
        setStats(prev => ({
          ...prev,
          totalApplications: applicationsWithCompanies.length,
          pendingApplications: pending,
          acceptedApplications: accepted
        }));
      } else {
        setApplications([]);
        setStats(prev => ({
          ...prev,
          totalApplications: 0,
          pendingApplications: 0,
          acceptedApplications: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching user applications:', error);
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select(`
          *,
          job:jobs(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch company data for each job
      if (data && data.length > 0) {
        const bookmarksWithCompanies = await Promise.all(
          data.map(async (bookmark) => {
            if (bookmark.job && bookmark.job.company_id) {
              const { data: companyData, error: companyError } = await supabase
                .from('companies')
                .select('*')
                .eq('id', bookmark.job.company_id)
                .single();
                
              if (!companyError && companyData) {
                return {
                  ...bookmark,
                  job: {
                    ...bookmark.job,
                    company: companyData
                  }
                };
              }
            }
            return bookmark;
          })
        );
        
        setBookmarks(bookmarksWithCompanies);
        setStats(prev => ({
          ...prev,
          bookmarkedJobs: bookmarksWithCompanies.length
        }));
      } else {
        setBookmarks([]);
        setStats(prev => ({
          ...prev,
          bookmarkedJobs: 0
        }));
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchRecommendedJobs = async () => {
    if (!user) return;
    
    try {
      // First get user skills
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('skills')
        .eq('user_id', user.id)
        .single();
        
      if (profileError) throw profileError;
      
      const userSkills = profileData?.skills || [];
      
      if (userSkills.length === 0) {
        // If no skills, just get recent jobs
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (error) throw error;
        
        // Fetch company data for each job
        const jobsWithCompanies = await Promise.all(
          (data || []).map(async (job) => {
            const { data: companyData } = await supabase
              .from('companies')
              .select('*')
              .eq('id', job.company_id)
              .single();
            
            return {
              ...job,
              company: companyData || null
            };
          })
        );
        
        setRecommendedJobs(jobsWithCompanies);
        return;
      }
      
      // Get jobs that match user skills
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
        
      if (jobsError) throw jobsError;
      
      // Filter jobs based on skills match in description or requirements
      const filteredJobs = (jobsData || []).filter(job => {
        const jobText = `${job.title} ${job.description} ${job.requirements}`.toLowerCase();
        return userSkills.some(skill => 
          jobText.includes(skill.toLowerCase())
        );
      }).slice(0, 5); // Limit to 5 jobs
      
      // Fetch company data for each job
      const jobsWithCompanies = await Promise.all(
        filteredJobs.map(async (job) => {
          const { data: companyData } = await supabase
            .from('companies')
            .select('*')
            .eq('id', job.company_id)
            .single();
          
          return {
            ...job,
            company: companyData || null
          };
        })
      );
      
      setRecommendedJobs(jobsWithCompanies);
    } catch (error) {
      console.error('Error fetching recommended jobs:', error);
    }
  };

  const updateProfile = async (formData: any) => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success('Profile updated successfully');
      setIsEditingProfile(false);
      await fetchProfile();
      
      // Refresh recommended jobs if skills were updated
      fetchRecommendedJobs();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const removeBookmark = async (bookmarkId: string) => {
    try {
      const { error } = await supabase
        .from('bookmarks')
        .delete()
        .eq('id', bookmarkId);

      if (error) throw error;
      
      setBookmarks(bookmarks.filter(bookmark => bookmark.id !== bookmarkId));
      setStats(prev => ({
        ...prev,
        bookmarkedJobs: prev.bookmarkedJobs - 1
      }));
      
      toast.success('Job removed from bookmarks');
    } catch (error) {
      console.error('Error removing bookmark:', error);
      toast.error('Failed to remove bookmark');
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

  const filteredApplications = applicationStatusFilter === 'all' 
    ? applications 
    : applications.filter(app => app.status === applicationStatusFilter);

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
            <h1 className="text-2xl font-bold">Job Seeker Dashboard</h1>
            <p className="mt-2">Manage your profile, applications, and job search</p>
          </div>

          <div className="border-b border-gray-200">
            <nav className="flex -mb-px overflow-x-auto">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <User className="h-5 w-5 inline-block mr-2" />
                My Profile
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
                My Applications
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {applications.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'bookmarks'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BookmarkIcon className="h-5 w-5 inline-block mr-2" />
                Saved Jobs
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {bookmarks.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('recommended')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === 'recommended'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Star className="h-5 w-5 inline-block mr-2" />
                Recommended Jobs
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  <button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {isEditingProfile ? 'Cancel' : (
                      <>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </>
                    )}
                  </button>
                </div>

                {isEditingProfile ? (
                  <ProfileForm 
                    initialData={profile}
                    onSubmit={updateProfile}
                    onCancel={() => setIsEditingProfile(false)}
                  />
                ) : (
                  <div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                      <StatCard 
                        title="Applications" 
                        value={stats.totalApplications} 
                        subtitle={`${stats.pendingApplications} pending`}
                        icon={FileText}
                        color="blue"
                      />
                      
                      <StatCard 
                        title="Accepted" 
                        value={stats.acceptedApplications} 
                        subtitle="Job offers"
                        icon={CheckCircle}
                        color="green"
                      />
                      
                      <StatCard 
                        title="Saved Jobs" 
                        value={stats.bookmarkedJobs} 
                        subtitle="Bookmarked positions"
                        icon={BookmarkIcon}
                        color="purple"
                      />
                    </div>
                    
                    <div className="bg-white overflow-hidden">
                      <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center">
                          {profile?.avatar_url ? (
                            <img
                              className="h-16 w-16 rounded-full mr-4"
                              src={profile.avatar_url}
                              alt={profile.full_name}
                            />
                          ) : (
                            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                              <User className="h-8 w-8 text-blue-600" />
                            </div>
                          )}
                          <div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">
                              {profile?.full_name}
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-500">
                              Job Seeker
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                        <dl className="sm:divide-y sm:divide-gray-200">
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Bio</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {profile?.bio || 'No bio provided'}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Email address</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {user?.email}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Resume</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              {profile?.resume_url ? (
                                <a
                                  href={profile.resume_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  View Resume
                                </a>
                              ) : (
                                'No resume uploaded'
                              )}
                            </dd>
                          </div>
                          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                            <dt className="text-sm font-medium text-gray-500">Skills</dt>
                            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                              <div className="flex flex-wrap gap-2">
                                {profile?.skills && profile.skills.length > 0 ? (
                                  profile.skills.map((skill: string, index: number) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                      {skill}
                                    </span>
                                  ))
                                ) : (
                                  'No skills added'
                                )}
                              </div>
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <DashboardCard title="Application Activity">
                        <div className="h-64">
                          <ApplicationTrendsChart 
                            dates={chartData.dates}
                            applications={chartData.applicationTrend}
                          />
                        </div>
                      </DashboardCard>
                    </div>
                   </div>
                )}
              </div>
            )}

            {activeTab === 'applications' && (
              <div>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 md:mb-0">My Applications</h2>
                  <div className="flex items-center">
                    <label htmlFor="statusFilter" className="mr-2 text-sm font-medium text-gray-700">
                      Filter by status:
                    </label>
                    <select
                      id="statusFilter"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                      value={applicationStatusFilter}
                      onChange={(e) => setApplicationStatusFilter(e.target.value)}
                    >
                      <option value="all">All Applications</option>
                      <option value="pending">Pending</option>
                      <option value="reviewing">Reviewing</option>
                      <option value="accepted">Accepted</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {filteredApplications.length > 0 ? (
                  <div className="space-y-6">
                    {filteredApplications.map((application) => (
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
                            <StatusBadge status={application.status} />
                          </div>
                        </div>
                        
                        <div className="mt-4 flex justify-end">
                          <Link
                            to={`/jobs/${application.job_id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            View Job
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={FileText}
                    title="No applications found"
                    description={applicationStatusFilter === 'all' 
                      ? "You haven't applied to any jobs yet." 
                      : `You don't have any ${applicationStatusFilter} applications.`}
                    action={
                      <Link
                        to="/jobs"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Browse Jobs
                      </Link>
                    }
                  />
                )}
              </div>
            )}

            {activeTab === 'bookmarks' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Saved Jobs</h2>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse More Jobs
                  </Link>
                </div>

                {bookmarks.length > 0 ? (
                  <div className="space-y-6">
                    {bookmarks.map((bookmark) => (
                      <div key={bookmark.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {bookmark.job?.title}
                              </h3>
                              <div className="flex items-center mt-1">
                                <Building className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-600">
                                  {bookmark.job?.company?.name || 'Company'}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeBookmark(bookmark.id)}
                              className="text-gray-400 hover:text-red-500"
                              title="Remove bookmark"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          </div>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {bookmark.job?.job_type}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {bookmark.job?.salary_range}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              {bookmark.job?.location}
                            </span>
                          </div>
                          
                          <div className="mt-4 flex justify-end space-x-3">
                            <Link
                              to={`/jobs/${bookmark.job_id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Details
                            </Link>
                            <Link
                              to={`/jobs/${bookmark.job_id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Apply Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={BookmarkIcon}
                    title="No saved jobs"
                    description="You haven't saved any jobs yet."
                    action={
                      <Link
                        to="/jobs"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Briefcase className="h-4 w-4 mr-2" />
                        Browse Jobs
                      </Link>
                    }
                  />
                )}
              </div>
            )}

            {activeTab === 'recommended' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Recommended Jobs</h2>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    Browse All Jobs
                  </Link>
                </div>

                {recommendedJobs.length > 0 ? (
                  <div className="space-y-6">
                    {recommendedJobs.map((job) => (
                      <div key={job.id} className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="text-lg font-medium text-gray-900">
                                {job.title}
                              </h3>
                              <div className="flex items-center mt-1">
                                <Building className="h-4 w-4 text-gray-400 mr-1" />
                                <span className="text-sm text-gray-600">
                                  {job.company?.name || 'Company'}
                                </span>
                              </div>
                            </div>
                            {job.company?.logo_url ? (
                              <img 
                                src={job.company.logo_url} 
                                alt={`${job.company.name} logo`} 
                                className="h-10 w-10 object-contain"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <Building className="h-6 w-6 text-gray-500" />
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {job.job_type}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {job.salary_range}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <MapPin className="h-3 w-3 mr-1" />
                              {job.location}
                            </span>
                          </div>
                          
                          <div className="mt-4">
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {job.description}
                            </p>
                          </div>
                          
                          <div className="mt-4 flex justify-end space-x-3">
                            <Link
                              to={`/jobs/${job.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              View Details
                            </Link>
                            <Link
                              to={`/jobs/${job.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              Apply Now
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState 
                    icon={Star}
                    title="No recommended jobs"
                    description="Add skills to your profile to get personalized job recommendations."
                    action={
                      <button
                        onClick={() => {
                          setActiveTab('profile');
                          setIsEditingProfile(true);
                        }}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Update Profile
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

export default JobSeekerDashboard;