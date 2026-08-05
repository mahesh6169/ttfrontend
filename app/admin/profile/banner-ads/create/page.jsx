'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import BannerImageUploader from '../components/BannerImageUploader';

const STEPS = [
  { id: 1, name: 'Business & Name', description: 'Select business and name your ad' },
  { id: 2, name: 'Target States', description: 'Select target states (required)' },
  { id: 3, name: 'Creative', description: 'Upload images and links' },
  { id: 4, name: 'Controls', description: 'Set schedule and limits' },
  { id: 5, name: 'Placement', description: 'Choose ad locations' },
  { id: 6, name: 'Review', description: 'Review and submit' }
];

export default function CreateAdPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1 - Business
    businessId: '',
    name: '',
    
    // Step 2 - Placement
    placements: [],
    
    // Step 3 - Targeting
    targetStates: [],
    schedule: {
      startAt: new Date().toISOString().split('T')[0],
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    status: 'active',
    
    // Step 4 - Creative
    creative: {
      altText: '',
      destination: {
        url: '',
        type: 'external'
      },
      mobile: {
        altText: '',
        destination: {
          url: '',
          type: 'external'
        }
      }
    },
    
    // Step 5 - Controls
    caps: {
      maxImpressions: '',
      maxClicks: ''
    }
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      console.log('=== CREATE FORM SUBMISSION ===');
      console.log('Form data:', formData);
      console.log('Images to upload:', formData.creative?.images);
      
      // Create FormData to handle file uploads
      const submitFormData = new FormData();
      
      // Add text fields
      submitFormData.append('businessId', formData.businessId);
      submitFormData.append('name', formData.name);
      submitFormData.append('placements', JSON.stringify(formData.placements));
      submitFormData.append('targetStates', JSON.stringify(formData.targetStates));
      submitFormData.append('schedule', JSON.stringify(formData.schedule));
      submitFormData.append('status', formData.status);
      submitFormData.append('useCarousel', formData.creative?.useCarousel || false);
      
      // Add creative details
      submitFormData.append('altText', formData.creative.altText || '');
      submitFormData.append('destinationUrl', formData.creative.destination?.url || '');
      submitFormData.append('destinationType', formData.creative.destination?.type || 'external');
      
      // Add mobile creative details if exists
      if (formData.creative.mobile) {
        submitFormData.append('mobileAltText', formData.creative.mobile.altText || '');
        submitFormData.append('mobileDestinationUrl', formData.creative.mobile.destination?.url || '');
        submitFormData.append('mobileDestinationType', formData.creative.mobile.destination?.type || 'external');
      }
      
      // Add caps if specified
      if (formData.caps.maxImpressions) {
        submitFormData.append('maxImpressions', formData.caps.maxImpressions);
      }
      if (formData.caps.maxClicks) {
        submitFormData.append('maxClicks', formData.caps.maxClicks);
      }
      
      // Add image files
      const images = formData.creative?.images || [];
      console.log('\nProcessing images for upload:');
      
      // Prepare image metadata
      const imageMetadata = [];
      
      // Send images with index information
      images.forEach((image) => {
        if (image.file && image.file instanceof File) {
          const filename = `${image.imageType}_${image.index}`;
          console.log(`Adding ${image.imageType} image ${image.index}:`, {
            name: image.file.name,
            size: image.file.size,
            type: image.file.type,
            filename: filename
          });
          submitFormData.append('images', image.file, filename);
          
          // Store metadata including original filename
          imageMetadata.push({
            type: image.imageType,
            index: image.index,
            originalFilename: image.file.name
          });
        }
      });
      
      // Send image metadata
      if (imageMetadata.length > 0) {
        submitFormData.append('imageMetadata', JSON.stringify(imageMetadata));
      }
      
      // Send as multipart/form-data
      await axios.post('/admin/bannerAds/ads', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      router.push('/admin/profile/banner-ads');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create ad');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between">
          {STEPS.map((step, stepIdx) => (
            <li key={step.id} className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''}`}>
              <div className="flex items-center">
                <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                  step.id < currentStep
                    ? 'bg-blue-600'
                    : step.id === currentStep
                    ? 'bg-blue-600'
                    : 'bg-slate-200'
                }`}>
                  {step.id < currentStep ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-xs ${step.id === currentStep ? 'text-white' : 'text-slate-500'}`}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${step.id <= currentStep ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-slate-500">{step.description}</p>
                </div>
              </div>
              {stepIdx !== STEPS.length - 1 && (
                <div className="absolute top-4 w-full -right-4">
                  <div className={`h-0.5 ${step.id < currentStep ? 'bg-blue-600' : 'bg-slate-200'}`} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        {currentStep === 1 && <BusinessNameStep formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <TargetingStep formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <CreativeStep formData={formData} setFormData={setFormData} />}
        {currentStep === 4 && <ControlsStep formData={formData} setFormData={setFormData} />}
        {currentStep === 5 && <PlacementStep formData={formData} setFormData={setFormData} />}
        {currentStep === 6 && <ReviewStep formData={formData} />}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
          <div className="flex gap-2">
            {currentStep < STEPS.length ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Next
                <FaChevronRight className="h-5 w-5 ml-2" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Ad'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 1: Business Selection & Ad Name
function BusinessNameStep({ formData, setFormData }) {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/admin/bannerAds/businesses', {
        params: { status: 'active' }
      });
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading businesses...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-slate-900">Business & Ad Name</h2>
        <p className="text-sm text-slate-500">
          Select the business and name your advertisement.
        </p>
      </div>
      
      <div className="space-y-2">
        <label htmlFor="business" className="block text-sm font-medium text-slate-700">
          Select Business <span className="text-red-500">*</span>
        </label>
        <select
          id="business"
          value={formData.businessId}
          onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
          className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        >
          <option value="">Choose a business...</option>
          {businesses.map(business => (
            <option key={business._id} value={business._id}>
              {business.name} ({business.businessId})
            </option>
          ))}
        </select>
      </div>
      
      {businesses.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          No active businesses found. Please create a business first.
        </div>
      )}
      
      {/* Ad Name Input - Always visible */}
      <div className="mt-6 space-y-2">
        <label htmlFor="adName" className="block text-sm font-medium text-slate-700">
          Ad Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="adName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Summer Sale 2024, New Store Opening"
          className="block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="mt-1 text-xs text-slate-500">
          Give your ad a descriptive name for easy identification
        </p>
      </div>
    </div>
  );
}

// Step 2: Placement Selection
function PlacementStep({ formData, setFormData }) {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
  }, []);

  const fetchPlacements = async () => {
    try {
      const response = await axios.get('/admin/bannerAds/placements');
      setPlacements(response.data.placements || []);
    } catch (error) {
      console.error('Error fetching placements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlacementToggle = (placementId) => {
    const newPlacements = formData.placements.includes(placementId)
      ? formData.placements.filter(p => p !== placementId)
      : [...formData.placements, placementId];
    
    setFormData({ ...formData, placements: newPlacements });
  };

  if (loading) {
    return <div className="text-center py-8">Loading placements...</div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-slate-900">Select Placements</h2>
      
      {/* Required Note */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm text-yellow-700">
          Select at least one placement where your ad will be displayed. Check the dimensions to ensure your ad images match.
        </p>
      </div>
      
      {/* Placement Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Available Placements
        </label>
        <div className="space-y-2">
          {placements.map(placement => {
            const desktopDim = placement.dimensions?.desktop || {};
            const mobileDim = placement.dimensions?.mobile || {};
            const hasAds = placement.assignedAds?.length > 0;
            
            return (
              <label 
                key={placement.placementId} 
                className="flex items-start p-4 border rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={formData.placements.includes(placement.placementId)}
                  onChange={() => handlePlacementToggle(placement.placementId)}
                  className="h-4 w-4 mt-1 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-slate-900">
                      {placement.placementId} - {placement.name}
                    </p>
                    {hasAds && (
                      <span className="text-xs text-slate-500">
                        {placement.assignedAds.length} ad{placement.assignedAds.length > 1 ? 's' : ''} assigned
                      </span>
                    )}
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Desktop:</span> {desktopDim.width || '?'} × {desktopDim.height || '?'} pixels
                    </p>
                    <p className="text-xs text-slate-600">
                      <span className="font-medium">Mobile:</span> {mobileDim.width || '?'} × {mobileDim.height || '?'} pixels
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    ℹ️ Ensure your ad images match these dimensions
                  </p>
                </div>
              </label>
            );
          })}
        </div>
        
        {placements.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No placements found. Please create placements first.
          </div>
        )}
      </div>
    </div>
  );
}

// Step 2: Target States (Required)
function TargetingStep({ formData, setFormData }) {
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

  const handleStateToggle = (state) => {
    const newStates = formData.targetStates.includes(state)
      ? formData.targetStates.filter(s => s !== state)
      : [...formData.targetStates, state];
    
    setFormData({ ...formData, targetStates: newStates });
  };


  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-slate-900">Target States</h2>
      
      {/* Info Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          Select specific states to target, or leave all unchecked to show ads everywhere.
        </p>
      </div>
      
      {/* State Targeting */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Target States 
          {formData.targetStates.length === 0 && (
            <span className="text-sm font-normal text-slate-500 ml-2">(Currently showing in all states)</span>
          )}
        </label>
        
        <div className="grid grid-cols-3 gap-2">
          {states.map(state => (
            <label key={state} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.targetStates.includes(state)}
                onChange={() => handleStateToggle(state)}
                className="rounded border-slate-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-slate-700">{state}</span>
            </label>
          ))}
        </div>
      </div>

    </div>
  );
}

// Step 4: Creative Upload
function CreativeStep({ formData, setFormData }) {
  // Store images locally, not uploaded yet
  const [images, setImages] = useState(formData.creative?.images || []);

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    // Store images in formData for later submission
    setFormData({
      ...formData,
      creative: {
        ...formData.creative,
        images: newImages,
        useCarousel: newImages.length > 1 // Auto-detect carousel based on image count
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-slate-900">Upload Creative Assets</h2>
      
      {/* Image Uploader - handles both single and multiple images */}
      <BannerImageUploader
        images={images}
        onImagesChange={handleImagesChange}
        mode="add"
      />

      {/* Creative Details - Always show all fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Desktop Creative */}
        <div className="space-y-4 border border-slate-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900">Desktop Creative Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700">Desktop Alt Text <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Describe the image for accessibility"
              value={formData.creative.altText || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  altText: e.target.value
                }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Desktop Destination URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.creative.destination?.url || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  destination: {
                    type: e.target.value.startsWith('http') ? 'external' : 'internal',
                    url: e.target.value
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Creative */}
        <div className="space-y-4 border border-slate-200 rounded-lg p-4">
          <h3 className="font-medium text-slate-900">Mobile Creative Details</h3>
          <div>
            <label className="block text-sm font-medium text-slate-700">Mobile Alt Text</label>
            <input
              type="text"
              placeholder="Leave empty to use desktop alt text"
              value={formData.creative.mobile?.altText || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  mobile: {
                    ...formData.creative.mobile,
                    altText: e.target.value
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Mobile Destination URL</label>
            <input
              type="url"
              placeholder="Leave empty to use desktop URL"
              value={formData.creative.mobile?.destination?.url || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  mobile: {
                    ...formData.creative.mobile,
                    destination: {
                      type: e.target.value.startsWith('http') ? 'external' : 'internal',
                      url: e.target.value
                    }
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 5: Controls
function ControlsStep({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-slate-900">Schedule & Controls</h2>
      
      {/* Schedule */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Campaign Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Start Date</label>
            <input
              type="date"
              value={formData.schedule.startAt}
              onChange={(e) => setFormData({
                ...formData,
                schedule: { ...formData.schedule, startAt: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">End Date</label>
            <input
              type="date"
              value={formData.schedule.endAt}
              onChange={(e) => setFormData({
                ...formData,
                schedule: { ...formData.schedule, endAt: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700">Initial Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="active">Active (Live immediately)</option>
          <option value="paused">Paused (Manual activation required)</option>
        </select>
      </div>

      {/* Caps */}
      <div>
        <h3 className="text-sm font-medium text-slate-700 mb-3">Performance Limits (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Maximum Impressions
            </label>
            <input
              type="number"
              value={formData.caps.maxImpressions}
              onChange={(e) => setFormData({
                ...formData,
                caps: { ...formData.caps, maxImpressions: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Leave empty for unlimited"
            />
            <p className="mt-1 text-xs text-slate-500">Ad will pause after reaching this many views</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Maximum Clicks
            </label>
            <input
              type="number"
              value={formData.caps.maxClicks}
              onChange={(e) => setFormData({
                ...formData,
                caps: { ...formData.caps, maxClicks: e.target.value }
              })}
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Leave empty for unlimited"
            />
            <p className="mt-1 text-xs text-slate-500">Ad will pause after reaching this many clicks</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 6: Review
function ReviewStep({ formData }) {
  const [businessName, setBusinessName] = useState('');
  
  useEffect(() => {
    // Fetch business name
    const fetchBusinessName = async () => {
      if (formData.businessId) {
        try {
          const response = await axios.get('/admin/bannerAds/businesses');
          const business = response.data.businesses?.find(b => b._id === formData.businessId);
          if (business) {
            setBusinessName(business.name);
          }
        } catch (error) {
          console.error('Error fetching business:', error);
        }
      }
    };
    fetchBusinessName();
  }, [formData.businessId]);
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-slate-900">Review Ad Campaign</h2>
      
      <dl className="divide-y divide-slate-200">
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Business</dt>
          <dd className="mt-1 text-sm text-slate-900">{businessName || formData.businessId || 'Not selected'}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Ad Name</dt>
          <dd className="mt-1 text-sm text-slate-900">{formData.name || 'Not specified'}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Placements</dt>
          <dd className="mt-1 text-sm text-slate-900">
            {formData.placements.join(', ') || 'None selected'}
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Target States</dt>
          <dd className="mt-1 text-sm text-slate-900">{formData.targetStates.length === 0 ? 'All states' : formData.targetStates.join(', ')}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Schedule</dt>
          <dd className="mt-1 text-sm text-slate-900">
            {formData.schedule.startAt} to {formData.schedule.endAt}
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Status</dt>
          <dd className="mt-1 text-sm text-slate-900">{formData.status}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Caps</dt>
          <dd className="mt-1 text-sm text-slate-900">
            Impressions: {formData.caps.maxImpressions || 'Unlimited'}, 
            Clicks: {formData.caps.maxClicks || 'Unlimited'}
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-slate-500">Images</dt>
          <dd className="mt-1 text-sm text-slate-900">
            {formData.creative?.images?.length || 0} image(s) uploaded
          </dd>
        </div>
      </dl>
    </div>
  );
}