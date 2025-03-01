import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, FileText, Plus, XCircle } from 'lucide-react';

interface ProfileFormProps {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  initialData, 
  onSubmit,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [newSkill, setNewSkill] = useState('');
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      full_name: initialData?.full_name || '',
      bio: initialData?.bio || '',
      resume_url: initialData?.resume_url || '',
      avatar_url: initialData?.avatar_url || ''
    }
  });

  const addSkill = () => {
    if (!newSkill.trim()) return;
    
    if (!skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
    }
    
    setNewSkill('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...data,
        skills
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <User className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="full_name"
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.full_name ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Your full name"
            {...register('full_name', { required: 'Full name is required' })}
          />
        </div>
        {errors.full_name && (
          <p className="mt-2 text-sm text-red-600">{errors.full_name.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Bio
        </label>
        <div className="mt-1">
          <textarea
            id="bio"
            rows={4}
            className={`block w-full px-3 py-2 border ${
              errors.bio ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Tell us about yourself..."
            {...register('bio')}
          />
        </div>
        {errors.bio && (
          <p className="mt-2 text-sm text-red-600">{errors.bio.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="resume_url" className="block text-sm font-medium text-gray-700">
          Resume URL
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="resume_url"
            type="url"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.resume_url ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="https://example.com/your-resume.pdf"
            {...register('resume_url')}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Link to your resume (Google Drive, Dropbox, etc.)
        </p>
        {errors.resume_url && (
          <p className="mt-2 text-sm text-red-600">{errors.resume_url.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
          Profile Picture URL
        </label>
        <div className="mt-1">
          <input
            id="avatar_url"
            type="url"
            className={`block w-full px-3 py-2 border ${
              errors.avatar_url ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="https://example.com/avatar.jpg"
            {...register('avatar_url')}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Provide a URL to your profile picture (optional)
        </p>
        {errors.avatar_url && (
          <p className="mt-2 text-sm text-red-600">{errors.avatar_url.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Skills
        </label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            className="flex-1 min-w-0 block w-full rounded-none rounded-l-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="Add a skill..."
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
          />
          <button
            type="button"
            onClick={addSkill}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <span key={index} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {skill}
              <button
                type="button"
                onClick={() => removeSkill(skill)}
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-blue-400 hover:text-blue-600 focus:outline-none"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

export default ProfileForm;