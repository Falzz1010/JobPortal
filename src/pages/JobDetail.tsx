import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Job, Bookmark, Review, Company } from '../types';
import { useAuth } from '../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Briefcase, MapPin, Clock, DollarSign, Building, Calendar, FileText, Send, Star, Heart, Share, Bookmark as BookmarkIcon, MessageCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

interface ApplicationFormData {
  coverLetter: string;
  resumeUrl: string;
}

interface ReviewFormData {
  rating: number;
  title: string;
  content: string;
  pros: string;
  cons: string;
}

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [showFullRequirements, setShowFullRequirements] = useState(false);
  const [similarJobs, setSimilarJobs] = useState<Job[]>([]);
  const [companyReviews, setCompanyReviews] = useState<Review[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm<ApplicationFormData>();
  const { register: registerReview, handleSubmit: handleSubmitReview, formState: { errors: reviewErrors }, setValue } = useForm<ReviewFormData>();

  useEffect(() => {
    if (id) {
      fetchJob(id);
      if (user) {
        if (user.userType === 'applicant') {
          checkIfApplied(id);
        }
        checkIfBookmarked(id);
      }
    }
  }, [id, user]);

  const fetchJob = async (jobId: string) => {
    try {
      // First fetch the job
      const { data: jobData, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (jobError) throw jobError;
      
      if (!jobData) {
        setLoading(false);
        return;
      }
      
      // Then fetch the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', jobData.company_id)
        .single();
        
      if (companyError) {
        console.error('Error fetching company:', companyError);
      }
      
      // Combine the data
      const fullJobData = {
        ...jobData,
        company: companyData || null
      };
      
      setJob(fullJobData);
      
      // Fetch similar jobs and company reviews
      if (jobData) {
        fetchSimilarJobs(jobData);
        if (companyData) {
          fetchCompanyReviews(companyData.id);
        }
      }
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const fetchSimilarJobs = async (currentJob: Job) => {
    try {
      // First get jobs with similar job type
      const { data: similarJobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .eq('job_type', currentJob.job_type)
        .neq('id', currentJob.id)
        .limit(3);

      if (error) throw error;
      
      if (!similarJobsData || similarJobsData.length === 0) {
        setSimilarJobs([]);
        return;
      }
      
      // Then fetch company data for each job
      const jobsWithCompanies = await Promise.all(
        similarJobsData.map(async (job) => {
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
      
      setSimilarJobs(jobsWithCompanies);
    } catch (error) {
      console.error('Error fetching similar jobs:', error);
    }
  };

  const fetchCompanyReviews = async (companyId: string) => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Manually fetch reviewer data for each review
      if (data && data.length > 0) {
        const reviewsWithProfiles = await Promise.all(
          data.map(async (review) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', review.reviewer_id)
              .single();
              
            return {
              ...review,
              reviewer: profileData || null
            };
          })
        );
        
        setCompanyReviews(reviewsWithProfiles);
      } else {
        setCompanyReviews([]);
      }
    } catch (error) {
      console.error('Error fetching company reviews:', error);
    }
  };

  const checkIfApplied = async (jobId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('job_id', jobId)
        .eq('applicant_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasApplied(!!data);
    } catch (error) {
      console.error('Error checking application status:', error);
    }
  };

  const checkIfBookmarked = async (jobId: string) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookmarks')
        .select('*')
        .eq('job_id', jobId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setIsBookmarked(!!data);
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }
  };

  const toggleBookmark = async () => {
    if (!user || !job) return;
    
    try {
      if (isBookmarked) {
        // Remove bookmark
        const { error } = await supabase
          .from('bookmarks')
          .delete()
          .eq('job_id', job.id)
          .eq('user_id', user.id);
          
        if (error) throw error;
        setIsBookmarked(false);
        toast.success('Job removed from bookmarks');
      } else {
        // Add bookmark
        const { error } = await supabase
          .from('bookmarks')
          .insert({
            job_id: job.id,
            user_id: user.id
          });
          
        if (error) throw error;
        setIsBookmarked(true);
        toast.success('Job added to bookmarks');
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      toast.error('Failed to update bookmarks');
    }
  };

  const onSubmit = async (data: ApplicationFormData) => {
    if (!user || !job) return;
    
    setApplying(true);
    try {
      const { error } = await supabase
        .from('applications')
        .insert({
          job_id: job.id,
          applicant_id: user.id,
          resume_url: data.resumeUrl,
          cover_letter: data.coverLetter,
          status: 'pending',
        });

      if (error) throw error;
      
      // Create notification for the company
      if (job.company) {
        const { data: companyData } = await supabase
          .from('companies')
          .select('user_id')
          .eq('id', job.company_id)
          .single();
          
        if (companyData && companyData.user_id) {
          await supabase.from('notifications').insert({
            user_id: companyData.user_id,
            title: 'New Job Application',
            message: `Someone has applied for the ${job.title} position.`,
            type: 'application',
            read: false,
            related_id: job.id
          });
        }
      }
      
      toast.success('Application submitted successfully!');
      setHasApplied(true);
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const onSubmitReview = async (data: ReviewFormData) => {
    if (!user || !job || !job.company) return;
    
    setSubmittingReview(true);
    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          company_id: job.company_id,
          reviewer_id: user.id,
          rating: data.rating,
          title: data.title,
          content: data.content,
          pros: data.pros,
          cons: data.cons
        });

      if (error) throw error;
      
      // Create notification for the company
      const { data: companyData } = await supabase
        .from('companies')
        .select('user_id')
        .eq('id', job.company_id)
        .single();
        
      if (companyData && companyData.user_id) {
        await supabase.from('notifications').insert({
          user_id: companyData.user_id,
          title: 'New Company Review',
          message: `Someone has left a ${data.rating}-star review for your company.`,
          type: 'review',
          read: false
        });
      }
      
      toast.success('Review submitted successfully!');
      setShowReviewForm(false);
      // Refresh reviews
      fetchCompanyReviews(job.company_id);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const shareJob = () => {
    if (navigator.share) {
      navigator.share({
        title: job?.title,
        text: `Check out this job: ${job?.title} at ${job?.company?.name}`,
        url: window.location.href,
      })
      .catch((error) => console.log('Error sharing', error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        className={`h-5 w-5 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
      />
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
        <Briefcase className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Job not found</h2>
        <p className="mt-2 text-gray-600">The job you're looking for doesn't exist or has been removed.</p>
        <button
          onClick={() => navigate('/jobs')}
          className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Browse Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Job Header */}
              <div className="bg-blue-600 text-white p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{job.title}</h1>
                    <div className="mt-2 flex items-center">
                      <Building className="h-5 w-5 mr-2" />
                      <span className="text-lg">{job.company?.name || 'Company'}</span>
                    </div>
                  </div>
                  {user && user.userType === 'applicant' && (
                    <div className="mt-4 md:mt-0">
                      {hasApplied ? (
                        <div className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md bg-green-500 text-white">
                          <FileText className="h-5 w-5 mr-2" />
                          Applied
                        </div>
                      ) : (
                        <button
                          onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-blue-600 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                        >
                          <Send className="h-5 w-5 mr-2" />
                          Apply Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Job Actions */}
              <div className="bg-gray-50 p-4 border-b border-gray-200">
                <div className="flex flex-wrap gap-2">
                  {user && (
                    <button
                      onClick={toggleBookmark}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                        isBookmarked 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {isBookmarked ? (
                        <>
                          <BookmarkIcon className="h-4 w-4 mr-1.5 fill-current" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookmarkIcon className="h-4 w-4 mr-1.5" />
                          Save Job
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    onClick={shareJob}
                    className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    <Share className="h-4 w-4 mr-1.5" />
                    Share
                  </button>
                  
                  {job.company?.website && (
                    <a
                      href={job.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-3 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      <ExternalLink className="h-4 w-4 mr-1.5" />
                      Company Website
                    </a>
                  )}
                </div>
              </div>

              {/* Job Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">{job.location}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">{job.job_type}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">{job.salary_range}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center mb-4">
                    <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                    <span className="text-gray-700">Posted on {formatDate(job.created_at)}</span>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Job Description</h2>
                  <div className={`prose max-w-none text-gray-700 mb-6 ${!showFullDescription && 'line-clamp-6'}`}>
                    {job.description}
                  </div>
                  {job.description.length > 300 && (
                    <button
                      onClick={() => setShowFullDescription(!showFullDescription)}
                      className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Read More
                        </>
                      )}
                    </button>
                  )}

                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                  <div className={`prose max-w-none text-gray-700 mb-6 ${!showFullRequirements && 'line-clamp-6'}`}>
                    {job.requirements}
                  </div>
                  {job.requirements.length > 300 && (
                    <button
                      onClick={() => setShowFullRequirements(!showFullRequirements)}
                      className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
                    >
                      {showFullRequirements ? (
                        <>
                          <ChevronUp className="h-4 w-4 mr-1" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-4 w-4 mr-1" />
                          Read More
                        </>
                      )}
                    </button>
                  )}

                  {job.company && (
                    <div className="mt-8 border-t border-gray-200 pt-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Company</h2>
                      <div className="flex items-start">
                        {job.company.logo_url ? (
                          <img 
                            src={job.company.logo_url} 
                            alt={`${job.company.name} logo`} 
                            className="h-16 w-16 object-contain rounded mr-4"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-gray-200 rounded flex items-center justify-center mr-4">
                            <Building className="h-8 w-8 text-gray-500" />
                          </div>
                        )}
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{job.company.name}</h3>
                          {job.company.website && (
                            <a 
                              href={job.company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {job.company.website}
                            </a>
                          )}
                          <p className="mt-2 text-gray-700">{job.company.description}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Company Reviews */}
            {job.company && (
              <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">Company Reviews</h2>
                  {user && user.userType === 'applicant' && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                    >
                      <Star className="h-4 w-4 mr-1.5" />
                      Write a Review
                    </button>
                  )}
                </div>

                {showReviewForm && (
                  <div className="mb-8 bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Share Your Experience</h3>
                    <form onSubmit={handleSubmitReview(onSubmitReview)} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rating
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setValue('rating', star)}
                              className="focus:outline-none"
                            >
                              <Star className={`h-6 w-6 ${star <= (reviewErrors.rating?.ref?.value || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                            </button>
                          ))}
                        </div>
                        <input
                          type="hidden"
                          {...registerReview('rating', { required: 'Please select a rating' })}
                        />
                        {reviewErrors.rating && (
                          <p className="mt-1 text-sm text-red-600">{reviewErrors.rating.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Review Title
                        </label>
                        <input
                          id="title"
                          type="text"
                          className={`mt-1 block w-full rounded-md border ${
                            reviewErrors.title ? 'border-red-300' : 'border-gray-300'
                          } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Summarize your experience"
                          {...registerReview('title', { required: 'Title is required' })}
                        />
                        {reviewErrors.title && (
                          <p className="mt-1 text-sm text-red-600">{reviewErrors.title.message}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Review
                        </label>
                        <textarea
                          id="content"
                          rows={4}
                          className={`mt-1 block w-full rounded-md border ${
                            reviewErrors.content ? 'border-red-300' : 'border-gray-300'
                          } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                          placeholder="Share details of your experience working here"
                          {...registerReview('content', { required: 'Review content is required' })}
                        />
                        {reviewErrors.content && (
                          <p className="mt-1 text-sm text-red-600">{reviewErrors.content.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="pros" className="block text-sm font-medium text-gray-700">
                            Pros
                          </label>
                          <textarea
                            id="pros"
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="What did you like about working here?"
                            {...registerReview('pros')}
                          />
                        </div>
                        <div>
                          <label htmlFor="cons" className="block text-sm font-medium text-gray-700">
                            Cons
                          </label>
                          <textarea
                            id="cons"
                            rows={3}
                            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="What didn't you like about working here?"
                            {...registerReview('cons')}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowReviewForm(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingReview}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {submittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {companyReviews.length > 0 ? (
                  <div className="space-y-6">
                    {companyReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">{review.title}</h3>
                            <div className="flex items-center mt-1">
                              <div className="flex text-yellow-400 mr-2">
                                {renderStars(review.rating)}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(review.created_at)}
                              </span>
                            </div>
                          </div>
                          {review.reviewer && (
                            <div className="flex items-center">
                              {review.reviewer.avatar_url ? (
                                <img 
                                  src={review.reviewer.avatar_url} 
                                  alt={review.reviewer.full_name} 
                                  className="h-8 w-8 rounded-full mr-2"
                                />
                              ) : (
                                <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                  <User className="h-4 w-4 text-gray-500" />
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-700">
                                {review.reviewer.full_name}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="mt-3 text-gray-700">{review.content}</p>
                        
                        {(review.pros || review.cons) && (
                          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {review.pros && (
                              <div className="bg-green-50 p-3 rounded">
                                <h4 className="text-sm font-medium text-green-800">Pros</h4>
                                <p className="mt-1 text-sm text-green-700">{review.pros}</p>
                              </div>
                            )}
                            {review.cons && (
                              <div className="bg-red-50 p-3 rounded">
                                <h4 className="text-sm font-medium text-red-800">Cons</h4>
                                <p className="mt-1 text-sm text-red-700">{review.cons}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Star className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No reviews yet</h3>
                    <p className="mt-1 text-gray-500">Be the first to review this company</p>
                  </div>
                )}
              </div>
            )}

            {/* Application Form */}
            {user && user.userType === 'applicant' && !hasApplied && (
              <div id="application-form" className="mt-8 bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Apply for this position</h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div>
                    <label htmlFor="resumeUrl" className="block text-sm font-medium text-gray-700">
                      Resume URL
                    </label>
                    <input
                      id="resumeUrl"
                      type="url"
                      className={`mt-1 block w-full rounded-md border ${
                        errors.resumeUrl ? 'border-red-300' : 'border-gray-300'
                      } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="https://example.com/your-resume.pdf"
                      {...register('resumeUrl', {
                        required: 'Resume URL is required',
                        pattern: {
                          value: /^https?:\/\/.+/i,
                          message: 'Please enter a valid URL',
                        },
                      })}
                    />
                    {errors.resumeUrl && (
                      <p className="mt-2 text-sm text-red-600">{errors.resumeUrl.message}</p>
                    )}
                    <p className="mt-1 text-sm text-gray-500">
                      Please provide a link to your resume (Google Drive, Dropbox, etc.)
                    </p>
                  </div>

                  <div>
                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                      Cover Letter
                    </label>
                    <textarea
                      id="coverLetter"
                      rows={6}
                      className={`mt-1 block w-full rounded-md border ${
                        errors.coverLetter ? 'border-red-300' : 'border-gray-300'
                      } shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                      placeholder="Tell us why you're a good fit for this position..."
                      {...register('coverLetter', {
                        required: 'Cover letter is required',
                        minLength: {
                          value: 100,
                          message: 'Cover letter should be at least 100 characters',
                        },
                      })}
                    />
                    {errors.coverLetter && (
                      <p className="mt-2 text-sm text-red-600">{errors.coverLetter.message}</p>
                    )}
                  </div>

                  <div>
                    <button
                      type="submit"
                      disabled={applying}
                      className="w-full md:w-auto flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {applying ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Submitting...
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <Send className="h-4 w-4 mr-2" />
                          Submit Application
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-8">
            {/* Job Summary */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h2>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Location</h3>
                    <p className="text-gray-900">{job.location}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Job Type</h3>
                    <p className="text-gray-900">{job.job_type}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <DollarSign className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Salary Range</h3>
                    <p className="text-gray-900">{job.salary_range}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Calendar className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Posted Date</h3>
                    <p className="text-gray-900">{formatDate(job.created_at)}</p>
                  </div>
                </div>
                {job.application_deadline && (
                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-gray-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700">Application Deadline</h3>
                      <p className="text-gray-900">{formatDate(job.application_deadline)}</p>
                    </div>
                  </div>
                )}
              </div>
              
              {user && user.userType === 'applicant' && !hasApplied && (
                <div className="mt-6">
                  <button
                    onClick={() => document.getElementById('application-form')?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Apply Now
                  </button>
                </div>
              )}
            </div>

            {/* Company Info */}
            {job.company && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h2>
                <div className="flex items-center mb-4">
                  {job.company.logo_url ? (
                    <img 
                      src={job.company.logo_url} 
                      alt={`${job.company.name} logo`} 
                      className="h-12 w-12 object-contain rounded mr-3"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center mr-3">
                      <Building className="h-6 w-6 text-gray-500" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-md font-medium text-gray-900">{job.company.name}</h3>
                    <p className="text-sm text-gray-600">{job.company.industry}</p>
                  </div>
                </div>
                
                <div className="space-y-3 text-sm">
                  {job.company.website && (
                    <div className="flex items-center">
                      <ExternalLink className="h-4 w-4 text-gray-500 mr-2" />
                      <a 
                        href={job.company.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Company Website
                      </a>
                    </div>
                  )}
                  
                  <div className="flex items-center">
                    <MessageCircle className="h-4 w-4 text-gray-500 mr-2" />
                    <button
                      onClick={() => setShowReviewForm(true)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Write a Review
                    </button>
                  </div>
                  
                  <div className="flex items-center">
                    <Building className="h-4 w-4 text-gray-500 mr-2" />
                    <Link
                      to={`/companies/${job.company_id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      View Company Profile
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Similar Jobs */}
            {similarJobs.length > 0 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Similar Jobs</h2>
                <div className="space-y-4">
                  {similarJobs.map((similarJob) => (
                    <div key={similarJob.id} className="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
                      <h3 className="text-md font-medium text-gray-900">
                        <Link to={`/jobs/${similarJob.id}`} className="hover:text-blue-600">
                          {similarJob.title}
                        </Link>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">{similarJob.company?.name}</p>
                      <div className="flex items-center mt-2 text-sm text-gray-500">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{similarJob.location}</span>
                        <span className="mx-2">•</span>
                        <DollarSign className="h-4 w-4 mr-1" />
                        <span>{similarJob.salary_range}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;