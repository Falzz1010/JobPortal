import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserType } from '../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userType: UserType, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching profile:', error);
            }
            
            if (profileData) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                userType: profileData.user_type as UserType,
                profile: profileData
              });
              console.log('User authenticated and profile found:', profileData);
            } else {
              // User authenticated but no profile found
              console.log('User authenticated but no profile found');
              setUser(null);
            }
          } catch (error) {
            console.error('Error in fetchUser:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        if (session?.user) {
          try {
            const { data: profileData, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .maybeSingle();
            
            if (error && error.code !== 'PGRST116') {
              console.error('Error fetching profile on auth change:', error);
            }
            
            if (profileData) {
              setUser({
                id: session.user.id,
                email: session.user.email || '',
                userType: profileData.user_type as UserType,
                profile: profileData
              });
              console.log('Profile loaded on auth change:', profileData);
            } else {
              // User authenticated but no profile found
              console.log('User authenticated but no profile found on auth change');
              setUser(null);
            }
          } catch (error) {
            console.error('Error in auth state change handler:', error);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userType: UserType, fullName: string) => {
    try {
      // Step 1: Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (!data.user) {
        throw new Error('User creation failed');
      }

      const userId = data.user.id;

      // Step 2: Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: fullName,
          user_type: userType,
          bio: null,
          avatar_url: null
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        throw new Error(`Failed to create user profile: ${profileError.message}`);
      }

      // Step 3: If company, create company profile
      if (userType === 'company') {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            user_id: userId,
            name: fullName,
            description: 'Company description',
            industry: 'Technology',
            logo_url: null,
            website: null
          });

        if (companyError) {
          console.error('Company creation error:', companyError);
          throw new Error(`Failed to create company profile: ${companyError.message}`);
        }
      }
      
      // Step 4: Create welcome notification
      try {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            title: 'Welcome to JobPortal!',
            message: `Thank you for joining JobPortal. We're excited to help you ${userType === 'company' ? 'find great talent' : 'find your dream job'}!`,
            type: 'system',
            read: false
          });
      } catch (notificationError) {
        console.error('Error creating welcome notification:', notificationError);
        // We don't throw here as this is not critical to account creation
      }
      
      toast.success('Account created successfully! Please sign in.');
    } catch (error) {
      console.error('Error in signUp function:', error);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in with:', email);
      
      // Clear any existing session first to ensure a clean login
      await supabase.auth.signOut();
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        throw error;
      }

      console.log('Sign in successful, user:', data.user);

      // Fetch user profile after successful sign in
      if (data.user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();
        
        if (profileError) {
          console.error('Error fetching profile after sign in:', profileError);
          throw new Error('Failed to load user profile. Please try again.');
        }
        
        console.log('Profile data:', profileData);
        
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          userType: profileData.user_type as UserType,
          profile: profileData
        });
        
        toast.success('Signed in successfully!');
      }
    } catch (error) {
      console.error('Error in signIn function:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      setUser(null);
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};