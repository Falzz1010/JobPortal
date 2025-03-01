import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Job } from '../types';
import JobCard from '../components/JobCard';
import { Briefcase, Search, MapPin, Users, Building, Star, ChevronRight, Mail, Phone, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Home: React.FC = () => {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState('');
  const [stats, setStats] = useState({
    jobs: 0,
    companies: 0,
    applicants: 0
  });

  useEffect(() => {
    const fetchFeaturedJobs = async () => {
      try {
        // First check if the jobs table exists and has data
        const { count, error: countError } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true });
        
        if (countError) {
          console.error('Error checking jobs table:', countError);
          setLoading(false);
          return;
        }
        
        if (count === 0) {
          // No jobs exist yet
          setFeaturedJobs([]);
          setLoading(false);
          return;
        }
        
        // Now try to fetch jobs with company data
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(6);

        if (error) throw error;
        
        // Fetch company data separately for each job
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
        
        setFeaturedJobs(jobsWithCompanies);
      } catch (error) {
        console.error('Error fetching featured jobs:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchStats = async () => {
      try {
        // Get job count
        const { count: jobCount } = await supabase
          .from('jobs')
          .select('*', { count: 'exact', head: true });
        
        // Get company count
        const { count: companyCount } = await supabase
          .from('companies')
          .select('*', { count: 'exact', head: true });
        
        // Get applicant count (profiles with user_type = 'applicant')
        const { count: applicantCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('user_type', 'applicant');
        
        setStats({
          jobs: jobCount || 0,
          companies: companyCount || 0,
          applicants: applicantCount || 0
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchFeaturedJobs();
    fetchStats();
  }, []);

  const handleSearch = () => {
    // This would navigate to the jobs page with search params
    window.location.href = `/jobs?search=${searchTerm}&location=${location}&category=${category}`;
  };

  const categories = [
    { name: 'Information Technology', icon: 'laptop-code', count: 120 },
    { name: 'Finance & Banking', icon: 'chart-line', count: 85 },
    { name: 'Marketing & Sales', icon: 'bullhorn', count: 64 },
    { name: 'Design & Creative', icon: 'paint-brush', count: 42 },
    { name: 'Customer Service', icon: 'headset', count: 38 },
    { name: 'Healthcare', icon: 'heartbeat', count: 56 }
  ];

  const testimonials = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Software Developer',
      company: 'TechCorp',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      quote: 'I found my dream job through JobPortal in just two weeks! The application process was seamless and I received updates every step of the way.'
    },
    {
      id: 2,
      name: 'Michael Chen',
      role: 'HR Manager',
      company: 'InnovateCo',
      image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      quote: 'As an employer, JobPortal has helped us find qualified candidates quickly. The filtering options make it easy to find the right talent for our needs.'
    },
    {
      id: 3,
      name: 'Emily Rodriguez',
      role: 'Marketing Specialist',
      company: 'BrandBoost',
      image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      quote: 'The platform is intuitive and user-friendly. I was able to showcase my portfolio and connect with companies that aligned with my career goals.'
    }
  ];

  const topCompanies = [
    {
      id: 1,
      name: 'TechGiant',
      logo: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&h=128&q=80',
      industry: 'Technology',
      description: 'Leading innovation in software and hardware solutions'
    },
    {
      id: 2,
      name: 'FinanceHub',
      logo: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&h=128&q=80',
      industry: 'Finance',
      description: 'Transforming the future of financial services'
    },
    {
      id: 3,
      name: 'CreativeStudio',
      logo: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&h=128&q=80',
      industry: 'Design',
      description: 'Award-winning design agency for digital products'
    },
    {
      id: 4,
      name: 'HealthPlus',
      logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-1.2.1&auto=format&fit=crop&w=128&h=128&q=80',
      industry: 'Healthcare',
      description: 'Innovative healthcare solutions for better living'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
              Find Your Dream Job Today
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl">
              Connect with top employers and discover opportunities that match your skills and career goals.
            </p>
            
            <div className="mt-8 flex justify-center space-x-4">
              <Link 
                to="/jobs" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Search className="h-5 w-5 mr-2" />
                Find Jobs
              </Link>
              <Link 
                to="/jobs/post" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                <Briefcase className="h-5 w-5 mr-2" />
                Post a Job
              </Link>
            </div>
            
            {/* Search Box */}
            <div className="mt-10 max-w-3xl mx-auto">
              <div className="bg-white p-4 rounded-lg shadow-md flex flex-col md:flex-row gap-4">
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
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </div>
                <div className="flex-1 relative">
                  <select
                    className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="">All Categories</option>
                    <option value="IT">Information Technology</option>
                    <option value="Finance">Finance & Banking</option>
                    <option value="Marketing">Marketing & Sales</option>
                    <option value="Design">Design & Creative</option>
                    <option value="Customer">Customer Service</option>
                    <option value="Healthcare">Healthcare</option>
                  </select>
                </div>
                <button
                  onClick={handleSearch}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-800 hover:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center p-6 bg-blue-50 rounded-lg">
              <Briefcase className="h-12 w-12 text-blue-600 mb-4" />
              <span className="text-3xl font-bold text-gray-900">{stats.jobs}+</span>
              <span className="text-lg text-gray-600">Active Jobs</span>
            </div>
            <div className="flex flex-col items-center p-6 bg-indigo-50 rounded-lg">
              <Building className="h-12 w-12 text-indigo-600 mb-4" />
              <span className="text-3xl font-bold text-gray-900">{stats.companies}+</span>
              <span className="text-lg text-gray-600">Companies</span>
            </div>
            <div className="flex flex-col items-center p-6 bg-purple-50 rounded-lg">
              <Users className="h-12 w-12 text-purple-600 mb-4" />
              <span className="text-3xl font-bold text-gray-900">{stats.applicants}+</span>
              <span className="text-lg text-gray-600">Job Seekers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Jobs Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Featured Jobs</h2>
          <p className="mt-2 text-lg text-gray-600">Discover opportunities from top employers</p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : featuredJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No jobs found</h3>
            <p className="mt-1 text-gray-500">Check back later for new opportunities.</p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            to="/jobs"
            className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            View All Jobs
          </Link>
        </div>
      </div>

      {/* Popular Job Categories */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Popular Job Categories</h2>
            <p className="mt-2 text-lg text-gray-600">Explore opportunities by industry</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                    <p className="mt-2 text-gray-600">{category.count} open positions</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <Link 
                    to={`/jobs?category=${encodeURIComponent(category.name)}`}
                    className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                  >
                    Browse Jobs <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">What Our Users Say</h2>
            <p className="mt-2 text-lg text-gray-600">Hear from job seekers and employers who found success</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.id} className="bg-gray-50 p-6 rounded-lg shadow-sm">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0">
                    <img 
                      className="h-12 w-12 rounded-full" 
                      src={testimonial.image} 
                      alt={testimonial.name} 
                    />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.role} at {testimonial.company}</p>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex text-yellow-400">
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                </div>
                <p className="text-gray-700 italic">"{testimonial.quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Companies */}
      <div className="bg-gray-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Top Companies Hiring Now</h2>
            <p className="mt-2 text-lg text-gray-600">Join industry leaders and grow your career</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {topCompanies.map((company) => (
              <div key={company.id} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center">
                  <img 
                    src={company.logo} 
                    alt={`${company.name} logo`} 
                    className="h-16 w-16 object-cover rounded-full mb-4"
                  />
                  <h3 className="text-xl font-semibold text-gray-900 text-center">{company.name}</h3>
                  <p className="text-sm text-blue-600 mb-2">{company.industry}</p>
                  <p className="text-gray-600 text-center text-sm">{company.description}</p>
                  <Link 
                    to={`/jobs?company=${encodeURIComponent(company.name)}`}
                    className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    View Open Positions
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">Ready to Take the Next Step in Your Career?</h2>
          <p className="mt-4 text-xl max-w-3xl mx-auto">
            Join thousands of job seekers and employers who trust JobPortal for their career and hiring needs.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
            <Link 
              to="/signup"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Create an Account
            </Link>
            <Link 
              to="/jobs"
              className="inline-flex items-center justify-center px-6 py-3 border border-white text-base font-medium rounded-md shadow-sm text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              Browse Jobs
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center">
                <Briefcase className="h-8 w-8 text-blue-400" />
                <span className="ml-2 text-xl font-bold">JobPortal</span>
              </div>
              <p className="mt-4 text-gray-400">
                Connecting talented professionals with great companies.
              </p>
              <div className="mt-6 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white">
                  <Facebook className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Twitter className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Instagram className="h-6 w-6" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white">
                  <Linkedin className="h-6 w-6" />
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">For Job Seekers</h3>
              <ul className="space-y-2">
                <li><Link to="/jobs" className="text-gray-400 hover:text-white">Browse Jobs</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white">My Applications</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white">Career Resources</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white">Resume Tips</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">For Employers</h3>
              <ul className="space-y-2">
                <li><Link to="/jobs/post" className="text-gray-400 hover:text-white">Post a Job</Link></li>
                <li><Link to="/dashboard" className="text-gray-400 hover:text-white">Manage Listings</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white">Pricing</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white">Recruitment Solutions</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact & Support</h3>
              <ul className="space-y-2">
                <li className="flex items-center text-gray-400">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>support@jobportal.com</span>
                </li>
                <li className="flex items-center text-gray-400">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>+1 (555) 123-4567</span>
                </li>
                <li><Link to="#" className="text-gray-400 hover:text-white">Help Center</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white">FAQ</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 JobPortal. All rights reserved.</p>
            <div className="mt-4 md:mt-0 flex space-x-6">
              <Link to="#" className="text-gray-400 hover:text-white text-sm">Privacy Policy</Link>
              <Link to="#" className="text-gray-400 hover:text-white text-sm">Terms of Service</Link>
              <Link to="#" className="text-gray-400 hover:text-white text-sm">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;