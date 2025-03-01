export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          company_id: string
          location: string
          salary_range: string
          job_type: string
          requirements: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          title: string
          description: string
          company_id: string
          location: string
          salary_range: string
          job_type: string
          requirements: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          title?: string
          description?: string
          company_id?: string
          location?: string
          salary_range?: string
          job_type?: string
          requirements?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      applications: {
        Row: {
          id: string
          job_id: string
          applicant_id: string
          resume_url: string
          cover_letter: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          job_id: string
          applicant_id: string
          resume_url: string
          cover_letter: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          applicant_id?: string
          resume_url?: string
          cover_letter?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          avatar_url: string | null
          user_type: string
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          avatar_url?: string | null
          user_type: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          avatar_url?: string | null
          user_type?: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          user_id: string
          name: string
          logo_url: string | null
          website: string | null
          description: string
          industry: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          logo_url?: string | null
          website?: string | null
          description: string
          industry: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          logo_url?: string | null
          website?: string | null
          description?: string
          industry?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}