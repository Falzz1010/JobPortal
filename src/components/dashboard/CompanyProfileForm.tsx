import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Building, Globe, MapPin, Briefcase } from 'lucide-react';

interface CompanyProfileFormProps {
  initialData: any;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const CompanyProfileForm: React.FC<CompanyProfileFormProps> = ({ 
  initialData, 
  onSubmit,
  onCancel
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      industry: initialData?.industry || '',
      website: initialData?.website || '',
      location: initialData?.location || '',
      logo_url: initialData?.logo_url || ''
    }
  });

  const handleFormSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Building className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="name"
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Your company name"
            {...register('name', { required: 'Company name is required' })}
          />
        </div>
        {errors.name && (
          <p className="mt-2 text-sm text-red-600">{errors.name.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            rows={4}
            className={`block w-full px-3 py-2 border ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="Describe your company..."
            {...register('description', { required: 'Description is required' })}
          />
        </div>
        {errors.description && (
          <p className="mt-2 text-sm text-red-600">{errors.description.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
          Industry
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Briefcase className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="industry"
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.industry ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="e.g. Technology, Healthcare, Finance"
            {...register('industry', { required: 'Industry is required' })}
          />
        </div>
        {errors.industry && (
          <p className="mt-2 text-sm text-red-600">{errors.industry.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="website"
            type="url"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.website ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="https://example.com"
            {...register('website')}
          />
        </div>
        {errors.website && (
          <p className="mt-2 text-sm text-red-600">{errors.website.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="location"
            type="text"
            className={`block w-full pl-10 pr-3 py-2 border ${
              errors.location ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="e.g. New York, NY"
            {...register('location')}
          />
        </div>
        {errors.location && (
          <p className="mt-2 text-sm text-red-600">{errors.location.message as string}</p>
        )}
      </div>

      <div>
        <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
          Logo URL
        </label>
        <div className="mt-1">
          <input
            id="logo_url"
            type="url"
            className={`block w-full px-3 py-2 border ${
              errors.logo_url ? 'border-red-300' : 'border-gray-300'
            } rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
            placeholder="https://example.com/logo.png"
            {...register('logo_url')}
          />
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Provide a URL to your company logo (optional)
        </p>
        {errors.logo_url && (
          <p className="mt-2 text-sm text-red-600">{errors.logo_url.message as string}</p>
        )}
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

export default CompanyProfileForm;