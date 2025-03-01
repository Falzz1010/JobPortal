export type UserType = 'applicant' | 'company';

export interface User {
  id: string;
  email: string;
  userType: UserType;
  profile?: Profile;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  company_id: string;
  location: string;
  salary_range: string;
  job_type: string;
  requirements: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  company?: Company;
  category?: string;
  experience_level?: string;
  application_deadline?: string;
  benefits?: string;
  remote_option?: boolean;
}

export interface Company {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
  description: string;
  industry: string;
  location?: string;
  founded_year?: number;
  company_size?: string;
  social_media?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  user_type: string;
  bio: string | null;
  resume_url?: string;
  skills?: string[];
  experience?: Experience[];
  education?: Education[];
  contact_info?: {
    email: string;
    phone?: string;
    address?: string;
  };
  social_links?: {
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description: string;
}

export interface Education {
  id: string;
  institution: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string | null;
  current: boolean;
  description?: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  resume_url: string;
  cover_letter: string;
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  job?: Job;
  applicant?: Profile;
  notes?: string;
  interview_date?: string;
}

export interface Review {
  id: string;
  company_id: string;
  reviewer_id: string;
  rating: number;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  created_at: string;
  reviewer?: Profile;
}

export interface Bookmark {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
  job?: Job;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'application' | 'message' | 'status' | 'system';
  read: boolean;
  created_at: string;
  related_id?: string;
}

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
  sender?: Profile;
  receiver?: Profile;
}