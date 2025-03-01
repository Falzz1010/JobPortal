import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { Briefcase, Search, MapPin, Filter, Clock, DollarSign, Building, X } from 'lucide-react';

const JobsList: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialSearchTerm = queryParams.get('search') || '';
  const initialLocation = queryParams.get('location') || '';
  const initialCategory = queryParams.get('category') || '';
  const initialCompany = queryParams.get('company') || '';

  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [locationFilter, setLocationFilter] = useState(initialLocation);
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);
  const [companyFilter, setCompanyFilter] = useState(initialCompany);
  const [jobTypeFilter, setJobTypeFilter] = useState<string>('');
  const [salaryFilter, setSalaryFilter] = useState<string>('');
  const [experienceFilter, setExperienceFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [totalJobs, setTotalJobs] = useState(0);

  useEffect(() => {
    fetchJobs();
  }, [initialSearchTerm, initialLocation, initialCategory, initialCompany]);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // First check if the jobs table exists and has data
      const { count: jobCount, error: countError } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('Error checking jobs table:', countError);
        setLoading(false);
        return;
      }
      
      if (jobCount === 0) {
        // No jobs exist yet
        setJobs([]);
        setTotalJobs(0);
        setLoading(false);
        return;
      }
      
      // Now fetch jobs with filters
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (locationFilter) {
        query = query.ilike('location', `%${locationFilter}%`);
      }

      if (jobTypeFilter) {
        query = query.eq('job_type', jobTypeFilter);
      }

      if (salaryFilter) {
        query = query.ilike('salary_range', `%${salaryFilter}%`);
      }

      if (categoryFilter) {
        query = query.ilike('description', `%${categoryFilter}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      
      // Fetch company data separately for each job
      if (data && data.length > 0) {
        const jobsWithCompanies = await Promise.all(
          data.map(async (job) => {
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
        
        // Filter by company name if needed
        let filteredJobs = jobsWithCompanies;
        if (companyFilter && companyFilter !== '') {
          filteredJobs = jobsWithCompanies.filter(job => 
            job.company && job.company.name.toLowerCase().includes(companyFilter.toLowerCase())
          );
        }
        
        setJobs(filteredJobs);
        setTotalJobs(filteredJobs.length);
      } else {
        setJobs([]);
        setTotalJobs(0);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchJobs();
    // Update URL with search params
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (locationFilter) params.append('location', locationFilter);
    if (categoryFilter) params.append('category', categoryFilter);
    if (companyFilter) params.append('company', companyFilter);
    window.history.pushState({}, '', `${location.pathname}?${params.toString()}`);
  };

  const handleFilterChange = () => {
    fetchJobs();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setLocationFilter('');
    setJobTypeFilter('');
    setSalaryFilter('');
    setCategoryFilter('');
    setCompanyFilter('');
    setExperienceFilter('');
    setTimeout(() => {
      fetchJobs();
    }, 0);
  };

  const categories = [
    'Information Technology',
    'Finance & Banking',
    'Marketing & Sales',
    'Design & Creative',
    'Customer Service',
    'Healthcare',
    'Education',
    'Engineering',
    'Human Resources',
    'Legal'
  ];

  const jobTypes = [
    'Full-time',
    'Part-time',
    'Contract',
    'Freelance',
    'Internship',
    'Remote'
  ];

  const experienceLevels = [
    'Entry Level',
    'Mid Level',
    'Senior Level',
    'Manager',
    'Director',
    'Executive'
  ];

  const salaryRanges = [
    '0-30k',
    '30k-60k',
    '60k-90k',
    '90k-120k',
    '120k+'
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Find Jobs</h1>
          <p className="mt-2 text-lg text-gray-600">Discover opportunities that match your skills and interests</p>
        </div>

        {/* Search Box */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Job title, keywords, or company"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Location"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              />
            </div>
            <button
              onClick={handleSearch}
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Filter className="h-5 w-5 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Active Filters */}
          {(categoryFilter || companyFilter || jobTypeFilter || salaryFilter || experienceFilter) && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm text-gray-700 mr-2 pt-1">Active filters:</span>
              
              {categoryFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Category: {categoryFilter}
                  <button 
                    onClick={() => {
                      setCategoryFilter('');
                      setTimeout(fetchJobs, 0);
                    }}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {companyFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Company: {companyFilter}
                  <button 
                    onClick={() => {
                      setCompanyFilter('');
                      setTimeout(fetchJobs, 0);
                    }}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {jobTypeFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Job Type: {jobTypeFilter}
                  <button 
                    onClick={() => {
                      setJobTypeFilter('');
                      setTimeout(fetchJobs, 0);
                    }}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {salaryFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Salary: {salaryFilter}
                  <button 
                    onClick={() => {
                      setSalaryFilter('');
                      setTimeout(fetchJobs, 0);
                    }}
                    className="ml-1 text-yellow-600 hover:text-yellow-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {experienceFilter && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Experience: {experienceFilter}
                  <button 
                    onClick={() => {
                      setExperienceFilter('');
                      setTimeout(fetchJobs, 0);
                    }}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-full text-xs font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Briefcase className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="category"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    {categories.map((category, index) => (
                      <option key={index} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700">
                  Job Type
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="jobType"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={jobTypeFilter}
                    onChange={(e) => setJobTypeFilter(e.target.value)}
                  >
                    <option value="">All Job Types</option>
                    {jobTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
                  Salary Range
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="salary"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={salaryFilter}
                    onChange={(e) => setSalaryFilter(e.target.value)}
                  >
                    <option value="">All Salary Ranges</option>
                    {salaryRanges.map((range, index) => (
                      <option key={index} value={range}>{range}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
                  Experience Level
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    id="experience"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={experienceFilter}
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <option value="">All Experience Levels</option>
                    {experienceLevels.map((level, index) => (
                      <option key={index} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="md:col-span-2 lg:col-span-4 flex items-end">
                <button
                  onClick={handleFilterChange}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {totalJobs} {totalJobs === 1 ? 'Job' : 'Jobs'} Found
            </h2>
            <div className="text-sm text-gray-500">
              Sorted by: Most Recent
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : jobs.length > 0 ? (
            <div className="space-y-6">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs found</h3>
              <p className="mt-1 text-gray-500">Try adjusting your search or filter criteria.</p>
              <button
                onClick={clearFilters}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobsList;