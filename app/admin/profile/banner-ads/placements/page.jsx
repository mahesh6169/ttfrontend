'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { FaPencilAlt, FaSyncAlt, FaPlus, FaTrash } from 'react-icons/fa';

export default function PlacementsPage() {
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState(null);

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

  const handleEdit = (placement) => {
    setSelectedPlacement(placement);
    setShowEditModal(true);
  };

  const handleToggleStatus = async (placement) => {
    try {
      await axios.put(`/admin/bannerAds/placements/${placement.placementId}`, {
        status: placement.status === 'active' ? 'paused' : 'active'
      });
      fetchPlacements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update placement');
    }
  };

  const handleDelete = async (placement) => {
    if (!confirm(`Are you sure you want to delete placement ${placement.placementId}?`)) {
      return;
    }

    try {
      await axios.delete(`/admin/bannerAds/placements/${placement.placementId}`);
      fetchPlacements();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete placement');
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manage Placements</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlus className="h-5 w-5 mr-2" />
            Create Placement
          </button>
          <button
            onClick={fetchPlacements}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaSyncAlt className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Placements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Horizontal Placements */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Horizontal Placements</h2>
          {placements.filter(p => p.placementId.startsWith('H')).map(placement => (
            <PlacementCard 
              key={placement.placementId} 
              placement={placement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>

        {/* Vertical Placements */}
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-gray-900">Vertical Placements</h2>
          {placements.filter(p => p.placementId.startsWith('V')).map(placement => (
            <PlacementCard 
              key={placement.placementId} 
              placement={placement}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <PlacementEditModal
          placement={selectedPlacement}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchPlacements();
          }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <PlacementCreateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPlacements();
          }}
        />
      )}
    </div>
  );
}

// Placement Card Component
function PlacementCard({ placement, onEdit, onDelete, onToggleStatus }) {
  const isParent = !placement.placementId.includes('-');
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${!isParent ? 'ml-8' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {placement.placementId}
            </h3>
            <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              placement.status === 'active' 
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {placement.status}
            </span>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">{placement.name}</p>
          
          <div className="mt-2 space-y-1 text-sm">
            <div>
              <span className="text-gray-500">Visibility:</span>{' '}
              <span className="font-medium">{placement.visibility}</span>
            </div>
            {isParent && (
              <div>
                <span className="text-gray-500">Layout:</span>{' '}
                <span className="font-medium">{placement.layoutType}</span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Desktop:</span>{' '}
              <span className="font-medium">
                {placement.dimensions?.desktop?.width || placement.dimensions?.width || '?'} × {placement.dimensions?.desktop?.height || placement.dimensions?.height || '?'}
              </span>
            </div>
            {placement.dimensions?.mobile?.width && (
              <div>
                <span className="text-gray-500">Mobile:</span>{' '}
                <span className="font-medium">
                  {placement.dimensions.mobile.width} × {placement.dimensions.mobile.height}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Max Ads:</span>{' '}
              <span className="font-medium">{placement.maxAds || 1}</span>
            </div>
          </div>

          {placement.children && placement.children.length > 0 && (
            <div className="mt-2">
              <span className="text-sm text-gray-500">Children:</span>{' '}
              <span className="text-sm font-medium">{placement.children.join(', ')}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(placement)}
            className="text-blue-600 hover:text-blue-900"
          >
            <FaPencilAlt className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(placement)}
            className="text-red-600 hover:text-red-900"
          >
            <FaTrash className="h-5 w-5" />
          </button>
          <button
            onClick={() => onToggleStatus(placement)}
            className={`px-3 py-1 text-xs font-medium rounded-md ${
              placement.status === 'active'
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {placement.status === 'active' ? 'Pause' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Placement Edit Modal
function PlacementEditModal({ placement, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: placement.name,
    visibility: placement.visibility,
    layoutType: placement.layoutType || '',
    dimensions: placement.dimensions || { 
      desktop: { width: '', height: '' },
      mobile: { width: '', height: '' }
    },
    status: placement.status,
    maxAds: placement.maxAds || 1,
    defaultWeight: placement.defaultWeight || 10
  });
  const [saving, setSaving] = useState(false);

  const isParent = !placement.placementId.includes('-');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await axios.put(`/admin/bannerAds/placements/${placement.placementId}`, formData);
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update placement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Edit Placement: {placement.placementId}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Visibility
              </label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Devices</option>
                <option value="desktopOnly">Desktop Only</option>
                <option value="mobileOnly">Mobile Only</option>
              </select>
            </div>

            {/* Layout Type (only for parent) */}
            {isParent && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Layout Type
                </label>
                <select
                  value={formData.layoutType}
                  onChange={(e) => setFormData({ ...formData, layoutType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="full">Full (Single Ad)</option>
                  <option value="split">Split (Two Ads)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Warning: Changing layout type may affect active ads
                </p>
              </div>
            )}

            {/* Desktop Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Desktop Dimensions (pixels)
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Width"
                  value={formData.dimensions.desktop?.width || formData.dimensions.width || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      desktop: { 
                        ...formData.dimensions.desktop, 
                        width: parseInt(e.target.value) || '' 
                      }
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={formData.dimensions.desktop?.height || formData.dimensions.height || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      desktop: { 
                        ...formData.dimensions.desktop, 
                        height: parseInt(e.target.value) || '' 
                      }
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Mobile Dimensions */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Mobile Dimensions (pixels)
              </label>
              <div className="grid grid-cols-2 gap-2 mt-1">
                <input
                  type="number"
                  placeholder="Width"
                  value={formData.dimensions.mobile?.width || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      mobile: { 
                        ...formData.dimensions.mobile, 
                        width: parseInt(e.target.value) || '' 
                      }
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                <input
                  type="number"
                  placeholder="Height"
                  value={formData.dimensions.mobile?.height || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      mobile: { 
                        ...formData.dimensions.mobile, 
                        height: parseInt(e.target.value) || '' 
                      }
                    }
                  })}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Max Ads */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Max Rotating Ads
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={formData.maxAds}
                onChange={(e) => setFormData({ ...formData, maxAds: parseInt(e.target.value) || 1 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Default Weight */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Default Rotation Weight
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.defaultWeight}
                onChange={(e) => setFormData({ ...formData, defaultWeight: parseInt(e.target.value) || 10 })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Placement Create Modal Component  
function PlacementCreateModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    placementId: '',
    name: '',
    visibility: 'all',
    layoutType: 'full',
    dimensions: {
      desktop: {
        width: '',
        height: ''
      },
      mobile: {
        width: '',
        height: ''
      }
    },
    status: 'active',
    maxAds: 5,
    defaultWeight: 10
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate placement ID format
    if (!formData.placementId.match(/^[A-Z][0-9]$/)) {
      alert('Placement ID must be in format like H1, H2, V1, V2 (capital letter + number)');
      return;
    }
    
    setSaving(true);
    
    console.log('=== CREATING PLACEMENT ===');
    console.log('Form data:', formData);
    console.log('Layout type:', formData.layoutType);
    
    // Build the request data
    const requestData = { ...formData };
    
    // If creating a split placement, add children
    if (formData.layoutType === 'split') {
      console.log('Creating SPLIT placement, adding children...');
      requestData.children = [
        `${formData.placementId}-1`,
        `${formData.placementId}-2`
      ];
      console.log('Added children:', requestData.children);
    }
    
    console.log('Final request data:', requestData);
    
    try {
      const response = await axios.post('/admin/bannerAds/placements', requestData);
      console.log('Placement created successfully:', response.data);
      onSuccess();
    } catch (error) {
      console.error('Failed to create placement:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.message || 'Failed to create placement');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Create New Placement</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Placement ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Placement ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.placementId}
              onChange={(e) => setFormData({ ...formData, placementId: e.target.value.toUpperCase() })}
              placeholder="e.g. H3, V3"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
              pattern="[A-Z][0-9]"
              title="Format: Capital letter + number (e.g., H3)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Use H for horizontal, V for vertical, followed by a number
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Middle Banner"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Visibility
            </label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="all">All Devices</option>
              <option value="desktopOnly">Desktop Only</option>
              <option value="mobileOnly">Mobile Only</option>
            </select>
          </div>

          {/* Layout Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Layout Type
            </label>
            <select
              value={formData.layoutType}
              onChange={(e) => setFormData({ ...formData, layoutType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="full">Full (single ad)</option>
              <option value="split">Split (two half ads)</option>
            </select>
          </div>

          {/* Desktop Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Desktop Dimensions (px)
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                placeholder="Width"
                value={formData.dimensions.desktop.width}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { 
                    ...formData.dimensions, 
                    desktop: { ...formData.dimensions.desktop, width: parseInt(e.target.value) || '' }
                  }
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
              <input
                type="number"
                placeholder="Height"
                value={formData.dimensions.desktop.height}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { 
                    ...formData.dimensions, 
                    desktop: { ...formData.dimensions.desktop, height: parseInt(e.target.value) || '' }
                  }
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Horizontal: 728x90 (full), 720x90 (split parent)<br/>
              Vertical: 160x600 (full), 160x592 (split parent)
            </p>
          </div>

          {/* Mobile Dimensions */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Dimensions (px)
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                placeholder="Width"
                value={formData.dimensions.mobile.width}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { 
                    ...formData.dimensions, 
                    mobile: { ...formData.dimensions.mobile, width: parseInt(e.target.value) || '' }
                  }
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              <input
                type="number"
                placeholder="Height"
                value={formData.dimensions.mobile.height}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  dimensions: { 
                    ...formData.dimensions, 
                    mobile: { ...formData.dimensions.mobile, height: parseInt(e.target.value) || '' }
                  }
                })}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Horizontal: 320x50<br/>
              Vertical: Not shown on mobile
            </p>
          </div>

          {/* Max Ads */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Max Rotating Ads
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.maxAds}
              onChange={(e) => setFormData({ ...formData, maxAds: parseInt(e.target.value) || 1 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              How many ads can rotate in this placement
            </p>
          </div>

          {/* Default Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Rotation Weight
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={formData.defaultWeight}
              onChange={(e) => setFormData({ ...formData, defaultWeight: parseInt(e.target.value) || 10 })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Placement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}