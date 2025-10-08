'use client';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import BannerImageUploader from '../../components/BannerImageUploader';

const STEPS = [
  { id: 1, name: 'Business & Name', description: 'View business and edit ad name' },
  { id: 2, name: 'Target States', description: 'Update target states' },
  { id: 3, name: 'Creative', description: 'Update images and links' },
  { id: 4, name: 'Controls', description: 'Update schedule and limits' },
  { id: 5, name: 'Placement', description: 'Manage ad locations' },
  { id: 6, name: 'Review', description: 'Review changes' }
];

export default function EditAdPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ad, setAd] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1 - Business & Name
    businessId: '',
    businessName: '',
    businessHumanId: '',
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
      desktop: {
        altText: '',
        destination: {
          url: '',
          type: 'external'
        }
      },
      mobile: {
        altText: '',
        destination: {
          url: '',
          type: 'external'
        }
      },
      images: [], // For new image uploads
      existingImages: [], // Track existing images to keep
      removedImages: [] // Track removed existing images for Cloudinary cleanup
    },
    
    // Step 5 - Controls
    caps: {
      maxImpressions: '',
      maxClicks: ''
    },
    
    notes: ''
  });

  useEffect(() => {
    fetchAdData();
  }, [id]);

  const fetchAdData = async () => {
    try {
      const response = await axios.get(`/admin/bannerAds/ads/${id}`);
      const adData = response.data.ad;
      setAd(adData);
      
      // Populate form data with existing ad data
      setFormData({
        businessId: adData.businessId._id,
        businessName: adData.businessId.name,
        businessHumanId: adData.businessId.businessId, // The human-readable BIZ-XXXX ID
        name: adData.name || '',
        placements: adData.placements,
        targetStates: adData.targetStates,
        schedule: {
          startAt: new Date(adData.schedule.startAt).toISOString().split('T')[0],
          endAt: new Date(adData.schedule.endAt).toISOString().split('T')[0]
        },
        status: adData.status,
        creative: {
          desktop: adData.creative.desktop || {
            altText: '',
            destination: { url: '', type: 'external' }
          },
          mobile: adData.creative.mobile || {
            altText: '',
            destination: { url: '', type: 'external' }
          },
          images: [], // Empty initially for new uploads
          existingImages: [], // Will be populated by CreativeStep
          removedImages: [] // Track removed images
        },
        caps: {
          maxImpressions: adData.caps?.maxImpressions || '',
          maxClicks: adData.caps?.maxClicks || ''
        },
        notes: adData.notes || ''
      });
      
    } catch (error) {
      console.error('Error fetching ad:', error);
      alert('Failed to load ad details');
      router.push('/admin/profile/banner-ads');
    } finally {
      setLoading(false);
    }
  };

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
    setSaving(true);
    try {
      console.log('=== EDIT FORM SUBMISSION ===');
      console.log('Form data:', formData);
      console.log('Schedule being sent:', formData.schedule);
      console.log('New images:', formData.creative?.images);
      console.log('Existing images to keep:', formData.creative?.existingImages);
      
      // Check if we have new images to upload OR images to remove
      const hasNewImages = formData.creative.images.length > 0;
      const hasRemovedImages = formData.creative.removedImages && formData.creative.removedImages.length > 0;
      
      if (hasNewImages || hasRemovedImages) {
        // Create FormData for multipart upload
        const submitFormData = new FormData();
        
        // Add text fields
        submitFormData.append('name', formData.name);
        submitFormData.append('placements', JSON.stringify(formData.placements));
        submitFormData.append('targetStates', JSON.stringify(formData.targetStates));
        submitFormData.append('schedule', JSON.stringify(formData.schedule));
        submitFormData.append('status', formData.status);
        
        // Add notes if present
        if (formData.notes !== undefined) {
          submitFormData.append('notes', formData.notes);
        }
        
        // Add creative details
        submitFormData.append('altText', formData.creative.desktop?.altText || '');
        submitFormData.append('destinationUrl', formData.creative.desktop?.destination?.url || '');
        submitFormData.append('destinationType', formData.creative.desktop?.destination?.type || 'external');
        
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
        
        // Add notes
        submitFormData.append('notes', formData.notes);
        
        // Add existing images that should be kept (filter out removed ones)
        const imagesToKeep = formData.creative.existingImages.filter(img => 
          !formData.creative.removedImages.some(removed => 
            removed.id === img.id || 
            (removed.imageType === img.imageType && removed.index === img.index)
          )
        );
        
        if (imagesToKeep.length > 0) {
          console.log('\nExisting images to keep:', imagesToKeep.length);
          console.log('Filtered from:', formData.creative.existingImages.length, 'total existing images');
          submitFormData.append('existingImages', JSON.stringify(imagesToKeep));
        } else {
          console.log('\nNo existing images to keep');
        }
        
        // Add removed images for Cloudinary cleanup
        if (formData.creative.removedImages && formData.creative.removedImages.length > 0) {
          console.log('\n=== SUBMITTING REMOVED IMAGES ===');
          console.log('Number of images to remove:', formData.creative.removedImages.length);
          console.log('Removed images details:', JSON.stringify(formData.creative.removedImages, null, 2));
          submitFormData.append('removedImages', JSON.stringify(formData.creative.removedImages));
        } else {
          console.log('\nNo images marked for removal');
        }
        
        // Add image files
        console.log('\nProcessing new images for upload:');
        const imageMetadata = [];
        
        formData.creative.images.forEach((image) => {
          if (image.file && image.file instanceof File) {
            console.log(`Adding ${image.imageType} image:`, {
              name: image.file.name,
              size: image.file.size,
              type: image.file.type
            });
            // Append with imageType_index format for backend parsing
            submitFormData.append('images', image.file, `${image.imageType}_${image.index || 0}`);
            
            // Store metadata including original filename
            imageMetadata.push({
              type: image.imageType,
              index: image.index || 0,
              originalFilename: image.file.name
            });
          }
        });
        
        // Send image metadata
        if (imageMetadata.length > 0) {
          submitFormData.append('imageMetadata', JSON.stringify(imageMetadata));
        }
        
        // Send as multipart/form-data
        await axios.put(`/admin/bannerAds/ads/${id}`, submitFormData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        // Regular JSON update without new images
        const submitData = {
          name: formData.name,
          placements: formData.placements,
          targetStates: formData.targetStates,
          schedule: formData.schedule,
          status: formData.status,
          caps: {
            maxImpressions: formData.caps.maxImpressions ? parseInt(formData.caps.maxImpressions) : undefined,
            maxClicks: formData.caps.maxClicks ? parseInt(formData.caps.maxClicks) : undefined
          },
          notes: formData.notes,
          // Include creative structure with destination URLs
          creative: {
            desktop: {
              altText: formData.creative.desktop?.altText || '',
              destination: {
                type: formData.creative.desktop?.destination?.type || 'external',
                url: formData.creative.desktop?.destination?.url || ''
              }
            }
          }
        };
        
        // Add mobile creative if it exists
        if (formData.creative.mobile && (formData.creative.mobile.altText || formData.creative.mobile.destination?.url)) {
          submitData.creative.mobile = {
            altText: formData.creative.mobile.altText || '',
            destination: {
              type: formData.creative.mobile.destination?.type || 'external',
              url: formData.creative.mobile.destination?.url || ''
            }
          };
        }
        
        // Add removed images if any
        if (formData.creative.removedImages && formData.creative.removedImages.length > 0) {
          submitData.removedImages = formData.creative.removedImages;
          console.log('Adding removed images to JSON update:', submitData.removedImages);
        }
        
        // Clean up caps
        if (!submitData.caps.maxImpressions) delete submitData.caps.maxImpressions;
        if (!submitData.caps.maxClicks) delete submitData.caps.maxClicks;
        if (Object.keys(submitData.caps).length === 0) delete submitData.caps;
        
        await axios.put(`/admin/bannerAds/ads/${id}`, submitData);
      }
      
      router.push('/admin/profile/banner-ads');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update ad');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this ad? This will also delete all associated images. This cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/admin/bannerAds/ads/${id}`);
      router.push('/admin/profile/banner-ads');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete ad');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Ad: {ad.adId}</h1>
        <button
          onClick={handleDelete}
          className="px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
        >
          Delete Ad
        </button>
      </div>

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
        {currentStep === 1 && <BusinessNameStep formData={formData} setFormData={setFormData} />}
        {currentStep === 2 && <TargetStatesStep formData={formData} setFormData={setFormData} />}
        {currentStep === 3 && <CreativeStep formData={formData} setFormData={setFormData} existingAd={ad} />}
        {currentStep === 4 && <ControlsStep formData={formData} setFormData={setFormData} />}
        {currentStep === 5 && <PlacementStep formData={formData} setFormData={setFormData} />}
        {currentStep === 6 && <ReviewStep formData={formData} existingAd={ad} />}

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
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update Ad'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Step 1: Business Information (Read-only)
function BusinessNameStep({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Business & Ad Name</h2>
      
      {/* Business Info (read-only) */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-2">Business Information</h3>
        <p className="text-sm text-gray-500 mb-2">
          Business information cannot be changed after ad creation.
        </p>
        <div className="bg-gray-50 rounded-md p-4">
          <p className="text-sm font-medium text-gray-900">{formData.businessName}</p>
          <p className="text-xs text-gray-500">Business ID: {formData.businessHumanId || formData.businessId}</p>
        </div>
      </div>
      
      {/* Ad Name (editable) */}
      <div>
        <label htmlFor="adName" className="block text-sm font-medium text-gray-700">
          Ad Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="adName"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., Summer Sale 2024, New Store Opening"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          required
        />
        <p className="mt-1 text-xs text-gray-500">
          Give your ad a descriptive name for easy identification
        </p>
      </div>
    </div>
  );
}

// Step 5: Placement Selection
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
      <h2 className="text-lg font-medium text-gray-900">Select Placement & Layout</h2>
      
      {/* Info Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          Modify placement assignments to change where your ad appears. 
          At least one placement is required for the ad to be displayed.
        </p>
      </div>
      
      {/* Placement Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Placements
        </label>
        <div className="space-y-2">
          {placements.map(placement => {
            return (
              <label 
                key={placement.placementId} 
                className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={formData.placements.includes(placement.placementId)}
                  onChange={() => handlePlacementToggle(placement.placementId)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {placement.placementId} - {placement.name}
                    </p>
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

// Step 2: Target States
function TargetStatesStep({ formData, setFormData }) {
  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

  const handleStateToggle = (state) => {
    const newStates = formData.targetStates.includes(state)
      ? formData.targetStates.filter(s => s !== state)
      : [...formData.targetStates, state];
    
    setFormData({ ...formData, targetStates: newStates });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Target States</h2>
      
      {/* Info Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
        <p className="text-sm text-blue-700">
          Select specific states to target, or leave all unchecked to show ads everywhere.
        </p>
      </div>
      
      {/* State Targeting */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Target States 
          {formData.targetStates.length === 0 && (
            <span className="text-sm font-normal text-gray-500 ml-2">(Currently showing in all states)</span>
          )}
        </label>
        
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
    </div>
  );
}

// Step 4: Creative Assets
function CreativeStep({ formData, setFormData, existingAd }) {
  const [images, setImages] = useState(formData.creative?.images || []);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState(formData.creative?.removedImages || []);

  // Initialize existing images from new structure
  useEffect(() => {
    const existing = [];
    const existingCreative = existingAd.creative;
    
    // Handle desktop images
    if (existingCreative?.desktop?.images && Array.isArray(existingCreative.desktop.images)) {
      existingCreative.desktop.images.forEach((img, index) => {
        existing.push({
          url: img.imageUrl,
          publicId: extractPublicId(img.imageUrl),
          imageType: 'desktop',
          isNew: false,
          isExisting: true,
          id: `existing_desktop_${index}`,
          name: 'Current Desktop Image',
          originalFilename: img.originalFilename,
          index: index,
          order: img.order || index
        });
      });
    }
    
    // Handle mobile images
    if (existingCreative?.mobile?.images && Array.isArray(existingCreative.mobile.images)) {
      existingCreative.mobile.images.forEach((img, index) => {
        existing.push({
          url: img.imageUrl,
          publicId: extractPublicId(img.imageUrl),
          imageType: 'mobile',
          isNew: false,
          isExisting: true,
          id: `existing_mobile_${index}`,
          name: 'Current Mobile Image',
          originalFilename: img.originalFilename,
          index: index,
          order: img.order || index
        });
      });
    }
    
    setExistingImages(existing);
    
    // Initialize formData with existing destination and alt text data
    setFormData(prev => ({
      ...prev,
      creative: {
        ...prev.creative,
        existingImages: existing,
        desktop: {
          altText: existingCreative?.desktop?.altText || '',
          destination: existingCreative?.desktop?.destination || { type: 'external', url: '' }
        },
        mobile: {
          altText: existingCreative?.mobile?.altText || '',
          destination: existingCreative?.mobile?.destination || { type: 'external', url: '' }
        }
      }
    }));
  }, [existingAd, setFormData]);
  
  // Helper to extract Cloudinary public ID
  function extractPublicId(url) {
    if (!url) return null;
    const matches = url.match(/\/v\d+\/(.+)\.\w+$/);
    return matches ? matches[1] : null;
  }

  const handleImagesChange = (newImages) => {
    setImages(newImages);
    // Store images in formData for later submission
    setFormData({
      ...formData,
      creative: {
        ...formData.creative,
        images: newImages,
        useCarousel: newImages.length > 1 || existingImages.length > 1
      }
    });
  };

  const handleExistingImagesChange = (updatedExistingImages) => {
    // Find removed images - need to track their original position in the backend array
    const removedImageIds = existingImages
      .filter(img => !updatedExistingImages.find(updated => updated.id === img.id))
      .map(img => img.id);
    
    // Create properly indexed removed images based on their position in the original creative
    const newlyRemoved = [];
    
    // Check desktop images
    if (existingAd.creative?.desktop?.images) {
      existingAd.creative.desktop.images.forEach((img, idx) => {
        const existingImg = existingImages.find(ei => 
          ei.url === img.imageUrl && ei.imageType === 'desktop'
        );
        if (existingImg && removedImageIds.includes(existingImg.id)) {
          newlyRemoved.push({
            ...existingImg,
            index: idx // Use the actual backend array index
          });
        }
      });
    }
    
    // Check mobile images  
    if (existingAd.creative?.mobile?.images) {
      existingAd.creative.mobile.images.forEach((img, idx) => {
        const existingImg = existingImages.find(ei => 
          ei.url === img.imageUrl && ei.imageType === 'mobile'
        );
        if (existingImg && removedImageIds.includes(existingImg.id)) {
          newlyRemoved.push({
            ...existingImg,
            index: idx // Use the actual backend array index
          });
        }
      });
    }
    
    console.log('=== FRONTEND IMAGE REMOVAL ===');
    console.log('Existing images before:', existingImages);
    console.log('Updated existing images:', updatedExistingImages);
    console.log('Newly removed with correct indices:', newlyRemoved);
    
    // Update removed images list
    const updatedRemovedImages = [...removedImages, ...newlyRemoved];
    setRemovedImages(updatedRemovedImages);
    
    console.log('Total removed images:', updatedRemovedImages);
    
    // Update existing images
    setExistingImages(updatedExistingImages);
    
    // Update form data
    setFormData({
      ...formData,
      creative: {
        ...formData.creative,
        existingImages: updatedExistingImages,
        removedImages: updatedRemovedImages
      }
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Update Creative Assets</h2>
      
      {/* Image Uploader - handles both single and multiple images */}
      <BannerImageUploader
        images={images}
        existingImages={existingImages}
        onImagesChange={handleImagesChange}
        onExistingImagesChange={handleExistingImagesChange}
        mode="edit"
      />

      {/* Creative Details - Always show all fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Desktop Creative */}
        <div className="space-y-4 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900">Desktop Creative Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Desktop Alt Text <span className="text-red-500">*</span></label>
            <input
              type="text"
              placeholder="Describe the image for accessibility"
              value={formData.creative.desktop?.altText || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  desktop: {
                    ...formData.creative.desktop,
                    altText: e.target.value
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Desktop Destination URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.creative.desktop?.destination?.url || ''}
              onChange={(e) => setFormData({
                ...formData,
                creative: {
                  ...formData.creative,
                  desktop: {
                    ...formData.creative.desktop,
                    destination: {
                      type: e.target.value.startsWith('http') ? 'external' : 'internal',
                      url: e.target.value
                    }
                  }
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Mobile Creative */}
        <div className="space-y-4 border border-gray-200 rounded-lg p-4">
          <h3 className="font-medium text-gray-900">Mobile Creative Details</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Alt Text</label>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Destination URL</label>
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
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 4: Controls
function ControlsStep({ formData, setFormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Schedule & Controls</h2>
      
      {/* Schedule */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Campaign Schedule</h3>
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
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Caps */}
      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Performance Limits (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Maximum Impressions
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
              Maximum Clicks
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
      </div>
    </div>
  );
}

// Step 6: Review
function ReviewStep({ formData, existingAd }) {
  const hasNewImages = formData.creative.images.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Review Changes</h2>
      
      <dl className="divide-y divide-gray-200">
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Ad ID</dt>
          <dd className="mt-1 text-sm text-gray-900">{existingAd.adId}</dd>
        </div>

        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Business</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.businessName}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Ad Name</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.name || 'Not specified'}</dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Placements</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {formData.placements.join(', ') || 'None selected'}
          </dd>
        </div>
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Target States</dt>
          <dd className="mt-1 text-sm text-gray-900">{formData.targetStates.length === 0 ? 'All states' : formData.targetStates.join(', ')}</dd>
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

        {hasNewImages && (
          <div className="py-3">
            <dt className="text-sm font-medium text-gray-500">New Images</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formData.creative.images.map(img => img.imageType).join(', ')} will be uploaded
            </dd>
          </div>
        )}
        
        <div className="py-3">
          <dt className="text-sm font-medium text-gray-500">Statistics</dt>
          <dd className="mt-1 text-sm text-gray-900">
            Impressions: {existingAd.counters?.impressions || 0} | 
            Clicks: {existingAd.counters?.clicks || 0} |
            CTR: {existingAd.counters?.impressions > 0 
              ? ((existingAd.counters.clicks / existingAd.counters.impressions) * 100).toFixed(2) 
              : 0}%
          </dd>
        </div>
      </dl>
    </div>
  );
}