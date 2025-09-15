'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import ImageUploader from '../components/ImageUploader';

const STEPS = [
  { id: 1, name: 'Business', description: 'Select or create advertiser' },
  { id: 2, name: 'Placement', description: 'Choose ad locations' },
  { id: 3, name: 'Targeting', description: 'Set states and schedule' },
  { id: 4, name: 'Creative', description: 'Upload images and links' },
  { id: 5, name: 'Controls', description: 'Set caps and limits' },
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
    
    // Step 2 - Placement
    placements: [],
    layout: 'full',
    
    // Step 3 - Targeting
    targetStates: [],
    schedule: {
      startAt: new Date().toISOString().split('T')[0],
      endAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    weight: 10,
    status: 'active',
    
    // Step 4 - Creative
    creative: {
      variants: {
        full: null,
        half: null
      }
    },
    destination: {
      url: ''
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
      submitFormData.append('layout', formData.layout);
      submitFormData.append('placements', JSON.stringify(formData.placements));
      submitFormData.append('targetStates', JSON.stringify(formData.targetStates));
      submitFormData.append('schedule', JSON.stringify(formData.schedule));
      submitFormData.append('status', formData.status);
      submitFormData.append('weight', formData.weight);
      
      // Add creative details
      const variant = formData.layout;
      submitFormData.append('altText', formData.creative.variants[variant]?.altText || '');
      submitFormData.append('destinationUrl', formData.creative.variants[variant]?.destination?.url || '');
      submitFormData.append('destinationType', formData.creative.variants[variant]?.destination?.type || 'external');
      
      // Add mobile creative details if exists
      if (formData.creative.variants[variant]?.mobile) {
        submitFormData.append('mobileAltText', formData.creative.variants[variant].mobile.altText || '');
        submitFormData.append('mobileDestinationUrl', formData.creative.variants[variant].mobile.destination?.url || '');
        submitFormData.append('mobileDestinationType', formData.creative.variants[variant].mobile.destination?.type || '');
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
      images.forEach((image) => {
        if (image.file && image.file instanceof File) {
          console.log(`Adding ${image.imageType} image:`, {
            name: image.file.name,
            size: image.file.size,
            type: image.file.type
          });
          submitFormData.append('images', image.file, image.imageType);
        }
      });
      
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
                    : 'bg-gray-200'
                }`}>
                  {step.id < currentStep ? (
                    <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className={`text-xs ${step.id === currentStep ? 'text-white' : 'text-gray-500'}`}>
                      {step.id}
                    </span>
                  )}
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${step.id <= currentStep ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {stepIdx !== STEPS.length - 1 && (
                <div className="absolute top-4 w-full -right-4">
                  <div className={`h-0.5 ${step.id < currentStep ? 'bg-blue-600' : 'bg-gray-200'}`} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Form Content */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        {currentStep === 1 && <BusinessStep formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <PlacementStep formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <TargetingStep formData={formData} setFormData={setFormData} />}
        {currentStep === 4 && <CreativeStep formData={formData} setFormData={setFormData} />}
        {currentStep === 5 && <ControlsStep formData={formData} setFormData={setFormData} />}
        {currentStep === 6 && <ReviewStep formData={formData} />}

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaChevronLeft className="h-5 w-5 mr-2" />
            Back
          </button>
          
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
  );
}

// Step 1: Business Selection
function BusinessStep({ formData, setFormData }) {
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
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Select Business</h2>
      <p className="text-sm text-gray-500">
        Choose the business that will be running this ad campaign.
      </p>
      
      <div className="space-y-2">
        {businesses.map(business => (
          <label key={business._id} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              name="business"
              value={business._id}
              checked={formData.businessId === business._id}
              onChange={(e) => setFormData({ ...formData, businessId: e.target.value })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">{business.name}</p>
              <p className="text-xs text-gray-500">{business.businessId} • {business.contact.email}</p>
            </div>
          </label>
        ))}
      </div>
      
      {businesses.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No active businesses found. Please create a business first.
        </div>
      )}
    </div>
  );
}

// Step 2: Placement Selection
function PlacementStep({ formData, setFormData }) {
  const [placements, setPlacements] = useState([]);
  const [usedPlacements, setUsedPlacements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlacements();
    fetchUsedPlacements();
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

  const fetchUsedPlacements = async () => {
    try {
      // Get all active ads to see which placements are in use
      const response = await axios.get('/admin/bannerAds/ads', {
        params: { status: 'active' }
      });
      const ads = response.data.ads || [];
      const used = new Set();
      ads.forEach(ad => {
        ad.placements.forEach(p => used.add(p));
      });
      setUsedPlacements(Array.from(used));
    } catch (error) {
      console.error('Error fetching used placements:', error);
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

  // Separate placements based on layout type
  // Full width: parent placements with layoutType 'full'
  const fullPlacements = placements.filter(p => 
    p.layoutType === 'full'
  );
  
  // Half width: extract children from split placements
  const halfPlacements = [];
  placements.forEach(p => {
    if (p.layoutType === 'split' && p.children) {
      p.children.forEach(child => {
        halfPlacements.push({
          ...child,
          parentId: p.placementId,
          parentName: p.name
        });
      });
    }
  });

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Select Placement & Layout</h2>
      
      {/* Layout Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Layout Type</label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="full"
              checked={formData.layout === 'full'}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  layout: e.target.value,
                  placements: [] // Clear selections when changing layout
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Full Width</p>
              <p className="text-xs text-gray-500">Single ad takes entire space</p>
            </div>
          </label>
          
          <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="radio"
              value="half"
              checked={formData.layout === 'half'}
              onChange={(e) => {
                setFormData({ 
                  ...formData, 
                  layout: e.target.value,
                  placements: [] // Clear selections when changing layout
                });
              }}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-900">Half Width</p>
              <p className="text-xs text-gray-500">Ad shares space with another</p>
            </div>
          </label>
        </div>
      </div>

      {/* Placement Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Placements ({formData.layout === 'full' ? 'Parent slots only' : 'Child slots only'})
        </label>
        <div className="space-y-2">
          {(formData.layout === 'full' ? fullPlacements : halfPlacements).map(placement => {
            const isUsed = usedPlacements.includes(placement.placementId);
            return (
              <label 
                key={placement.placementId} 
                className={`flex items-center p-4 border rounded-lg ${
                  isUsed ? 'bg-gray-50 border-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.placements.includes(placement.placementId)}
                  onChange={() => handlePlacementToggle(placement.placementId)}
                  disabled={isUsed}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm font-medium ${isUsed ? 'text-gray-500' : 'text-gray-900'}`}>
                      {placement.placementId} - {placement.name}
                    </p>
                    {isUsed && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        In Use
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    Desktop: {placement.dimensions?.desktop?.width || placement.dimensions?.width} × {placement.dimensions?.desktop?.height || placement.dimensions?.height}
                    {placement.dimensions?.mobile?.width && (
                      <span> • Mobile: {placement.dimensions.mobile.width} × {placement.dimensions.mobile.height}</span>
                    )}
                  </p>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Step 3: Targeting & Schedule
function TargetingStep({ formData, setFormData }) {
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'ALL'];

  const handleStateToggle = (state) => {
    if (state === 'ALL') {
      setFormData({ ...formData, targetStates: ['ALL'] });
    } else {
      const newStates = formData.targetStates.includes(state)
        ? formData.targetStates.filter(s => s !== state)
        : [...formData.targetStates.filter(s => s !== 'ALL'), state];
      
      setFormData({ ...formData, targetStates: newStates });
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Targeting & Schedule</h2>
      
      {/* State Targeting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Target States</label>
        <div className="grid grid-cols-3 gap-2">
          {states.map(state => (
            <label key={state} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.targetStates.includes(state)}
                onChange={() => handleStateToggle(state)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{state}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Schedule */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            value={formData.schedule.startAt}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, startAt: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            value={formData.schedule.endAt}
            onChange={(e) => setFormData({
              ...formData,
              schedule: { ...formData.schedule, endAt: e.target.value }
            })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
      </div>

      {/* Weight */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rotation Weight (1-100)
        </label>
        <input
          type="number"
          min="1"
          max="100"
          value={formData.weight}
          onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || 10 })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">Higher weight = more frequent display</p>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Initial Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="active">Active (Live immediately)</option>
          <option value="paused">Paused (Manual activation required)</option>
        </select>
      </div>
    </div>
  );
}

// Step 4: Creative Upload
function CreativeStep({ formData, setFormData }) {
  // Store images locally, not uploaded yet
  const [images, setImages] = useState(formData.creative?.images || []);
  const variant = formData.layout;

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    // Store images in formData for later submission
    setFormData({
      ...formData,
      creative: {
        ...formData.creative,
        images: newImages
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Upload Creative Assets</h2>
      
      {/* Image Uploader Component */}
      <ImageUploader
        images={images}
        onImagesChange={handleImagesChange}
        variant={variant}
        mode="add"
      />

      {/* Creative Details */}
      <div className="space-y-6">
        {/* Desktop Creative */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-900">Desktop Creative Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Alt Text *</label>
            <input
              type="text"
              placeholder="Describe the image for accessibility"
              value={formData.creative.variants[variant]?.altText || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  variants: {
                    ...formData.creative.variants,
                    [variant]: {
                      ...formData.creative.variants[variant],
                      altText: e.target.value
                    }
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Destination URL</label>
            <input
              type="url"
              placeholder="https://example.com (optional)"
              value={formData.creative.variants[variant]?.destination?.url || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  variants: {
                    ...formData.creative.variants,
                    [variant]: {
                      ...formData.creative.variants[variant],
                      destination: e.target.value ? {
                        type: e.target.value.startsWith('http') ? 'external' : 'internal',
                        url: e.target.value
                      } : null
                    }
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Creative (Optional) - only show if mobile image is uploaded */}
        {images.some(img => img.imageType === 'mobile') && (
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900">Mobile Creative Details (Optional)</h3>
            <p className="text-xs text-gray-500">Leave empty to use desktop values</p>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Alt Text</label>
              <input
                type="text"
                placeholder="Describe the mobile image (optional)"
                value={formData.creative.variants[variant]?.mobile?.altText || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  creative: {
                    ...formData.creative,
                    variants: {
                      ...formData.creative.variants,
                      [variant]: {
                        ...formData.creative.variants[variant],
                        mobile: {
                          ...formData.creative.variants[variant]?.mobile,
                          altText: e.target.value
                        }
                      }
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Mobile Destination URL</label>
              <input
                type="url"
                placeholder="https://example.com/mobile (optional)"
                value={formData.creative.variants[variant]?.mobile?.destination?.url || ''}
                onChange={(e) => setFormData({
                  ...formData,
                  creative: {
                    ...formData.creative,
                    variants: {
                      ...formData.creative.variants,
                      [variant]: {
                        ...formData.creative.variants[variant],
                        mobile: {
                          ...formData.creative.variants[variant]?.mobile,
                          destination: {
                            type: e.target.value.startsWith('http') ? 'external' : 'internal',
                            url: e.target.value
                          }
                        }
                      }
                    }
                  }
                })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 5: Controls
function ControlsStep({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Campaign Controls</h2>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Maximum Impressions (optional)
        </label>
        <input
          type="number"
          value={formData.caps.maxImpressions}
          onChange={(e) => setFormData({
            ...formData,
            caps: { ...formData.caps, maxImpressions: e.target.value }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Leave empty for unlimited"
        />
        <p className="mt-1 text-xs text-gray-500">Ad will pause after reaching this many views</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Maximum Clicks (optional)
        </label>
        <input
          type="number"
          value={formData.caps.maxClicks}
          onChange={(e) => setFormData({
            ...formData,
            caps: { ...formData.caps, maxClicks: e.target.value }
          })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          placeholder="Leave empty for unlimited"
        />
        <p className="mt-1 text-xs text-gray-500">Ad will pause after reaching this many clicks</p>
      </div>
    </div>
  );
}

// Step 6: Review
function ReviewStep({ formData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Review Ad Campaign</h2>
      
      <dl className="divide-y divide-gray-200">
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Business</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.businessId || 'Not selected'}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Placements</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {formData.placements.join(', ') || 'None selected'} ({formData.layout} layout)
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Target States</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.targetStates.join(', ') || 'None selected'}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Schedule</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {formData.schedule.startAt} to {formData.schedule.endAt}
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.status}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Caps</dt>
          <dd className="mt-1 text-sm text-gray-900">
            Impressions: {formData.caps.maxImpressions || 'Unlimited'}, 
            Clicks: {formData.caps.maxClicks || 'Unlimited'}
          </dd>
        </div>
      </dl>
    </div>
  );
}