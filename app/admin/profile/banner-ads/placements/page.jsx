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
function PlacementCard({ placement, onEdit, onDelete }) {
  const isParent = !placement.placementId.includes('-');
  
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${!isParent ? 'ml-8' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {placement.placementId}
            </h3>
          </div>
          
          <p className="text-sm text-gray-500 mt-1">{placement.name}</p>
          
          <div className="mt-2 space-y-1 text-sm">
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
          </div>

          {placement.children && placement.children.length > 0 && (
            <div className="mt-3 space-y-2">
              <span className="text-sm font-medium text-gray-700">Children:</span>
              {placement.children.map(child => (
                <div key={child.placementId} className="ml-4 text-xs text-gray-600">
                  <span className="font-medium">{child.placementId}:</span>{' '}
                  Desktop {child.dimensions?.desktop?.width}×{child.dimensions?.desktop?.height},{' '}
                  Mobile {child.dimensions?.mobile?.width}×{child.dimensions?.mobile?.height}
                </div>
              ))}
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
        </div>
      </div>
    </div>
  );
}

// Placement Edit Modal
function PlacementEditModal({ placement, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: placement.name,
    layoutType: placement.layoutType || '',
    dimensions: placement.dimensions || { 
      desktop: { width: '', height: '' },
      mobile: { width: '', height: '' }
    },
    children: placement.children || [],
    mobileStackVertical: placement.mobileStackVertical !== undefined ? placement.mobileStackVertical : true
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

            {/* Mobile Stack Direction (only for split layout) */}
            {isParent && formData.layoutType === 'split' && (
              <div>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.mobileStackVertical}
                    onChange={(e) => setFormData({ ...formData, mobileStackVertical: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Stack children vertically on mobile
                  </span>
                </label>
              </div>
            )}

            {/* Children Dimensions (only for split layout) */}
            {isParent && formData.layoutType === 'split' && formData.children && formData.children.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">Children Placements</h4>
                {formData.children.map((child, index) => (
                  <div key={child.placementId} className="p-4 border border-gray-200 rounded-md space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{child.placementId} - {child.name}</span>
                    </div>
                    
                    {/* Child Desktop Dimensions */}
                    <div>
                      <label className="block text-xs text-gray-600">Desktop</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input
                          type="number"
                          placeholder="Width"
                          value={child.dimensions?.desktop?.width || ''}
                          onChange={(e) => {
                            const newChildren = [...formData.children];
                            newChildren[index] = {
                              ...child,
                              dimensions: {
                                ...child.dimensions,
                                desktop: {
                                  ...child.dimensions?.desktop,
                                  width: parseInt(e.target.value) || ''
                                }
                              }
                            };
                            setFormData({ ...formData, children: newChildren });
                          }}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm"
                        />
                        <input
                          type="number"
                          placeholder="Height"
                          value={child.dimensions?.desktop?.height || ''}
                          onChange={(e) => {
                            const newChildren = [...formData.children];
                            newChildren[index] = {
                              ...child,
                              dimensions: {
                                ...child.dimensions,
                                desktop: {
                                  ...child.dimensions?.desktop,
                                  height: parseInt(e.target.value) || ''
                                }
                              }
                            };
                            setFormData({ ...formData, children: newChildren });
                          }}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>

                    {/* Child Mobile Dimensions */}
                    <div>
                      <label className="block text-xs text-gray-600">Mobile</label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <input
                          type="number"
                          placeholder="Width"
                          value={child.dimensions?.mobile?.width || ''}
                          onChange={(e) => {
                            const newChildren = [...formData.children];
                            newChildren[index] = {
                              ...child,
                              dimensions: {
                                ...child.dimensions,
                                mobile: {
                                  ...child.dimensions?.mobile,
                                  width: parseInt(e.target.value) || ''
                                }
                              }
                            };
                            setFormData({ ...formData, children: newChildren });
                          }}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm"
                        />
                        <input
                          type="number"
                          placeholder="Height"
                          value={child.dimensions?.mobile?.height || ''}
                          onChange={(e) => {
                            const newChildren = [...formData.children];
                            newChildren[index] = {
                              ...child,
                              dimensions: {
                                ...child.dimensions,
                                mobile: {
                                  ...child.dimensions?.mobile,
                                  height: parseInt(e.target.value) || ''
                                }
                              }
                            };
                            setFormData({ ...formData, children: newChildren });
                          }}
                          className="block w-full text-sm rounded-md border-gray-300 shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
    children: [],
    mobileStackVertical: true
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
              onChange={(e) => {
                const id = e.target.value.toUpperCase();
                setFormData({ ...formData, placementId: id });
              }}
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


          {/* Layout Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Layout Type
            </label>
            <select
              value={formData.layoutType}
              onChange={(e) => {
                setFormData({ ...formData, layoutType: e.target.value });
              }}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="full">Full (single ad)</option>
              <option value="split">Split (two half ads)</option>
            </select>
          </div>

          {/* Desktop Dimensions */}
          <div className={formData.layoutType === 'split' ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-gray-700">
              Desktop Dimensions (px)
              {formData.layoutType === 'split' && (
                <span className="text-xs text-gray-500 ml-2">Not used for split layouts - configure children below</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                placeholder="Width"
                value={formData.dimensions.desktop.width}
                onChange={(e) => {
                  const newFormData = { 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      desktop: { ...formData.dimensions.desktop, width: parseInt(e.target.value) || '' }
                    }
                  };
                  setFormData(newFormData);
                  
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required={formData.layoutType !== 'split'}
                disabled={formData.layoutType === 'split'}
              />
              <input
                type="number"
                placeholder="Height"
                value={formData.dimensions.desktop.height}
                onChange={(e) => {
                  const newFormData = { 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      desktop: { ...formData.dimensions.desktop, height: parseInt(e.target.value) || '' }
                    }
                  };
                  setFormData(newFormData);
                  
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required={formData.layoutType !== 'split'}
                disabled={formData.layoutType === 'split'}
              />
            </div>
          </div>

          {/* Mobile Dimensions */}
          <div className={formData.layoutType === 'split' ? 'opacity-50' : ''}>
            <label className="block text-sm font-medium text-gray-700">
              Mobile Dimensions (px)
              {formData.layoutType === 'split' && (
                <span className="text-xs text-gray-500 ml-2">Not used for split layouts - configure children below</span>
              )}
            </label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <input
                type="number"
                placeholder="Width"
                value={formData.dimensions.mobile.width}
                onChange={(e) => {
                  const newFormData = { 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      mobile: { ...formData.dimensions.mobile, width: parseInt(e.target.value) || '' }
                    }
                  };
                  setFormData(newFormData);
                  
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={formData.layoutType === 'split'}
              />
              <input
                type="number"
                placeholder="Height"
                value={formData.dimensions.mobile.height}
                onChange={(e) => {
                  const newFormData = { 
                    ...formData, 
                    dimensions: { 
                      ...formData.dimensions, 
                      mobile: { ...formData.dimensions.mobile, height: parseInt(e.target.value) || '' }
                    }
                  };
                  setFormData(newFormData);
                  
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                disabled={formData.layoutType === 'split'}
              />
            </div>
          </div>


          {/* Mobile Stack Direction for Split Layout */}
          {formData.layoutType === 'split' && (
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.mobileStackVertical}
                  onChange={(e) => setFormData({ ...formData, mobileStackVertical: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Stack children vertically on mobile (uncheck for side-by-side)
                </span>
              </label>
            </div>
          )}

          {/* Editable Children Section for Split Layout */}
          {formData.layoutType === 'split' && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Children Placements</h3>
              <p className="text-xs text-gray-600">
                Expected format: {formData.placementId}-1, {formData.placementId}-2 (used by serving controller)
              </p>
              
              {formData.children.length === 0 && (
                <div className="text-sm text-gray-500">
                  No children defined. 
                  <button
                    type="button"
                    onClick={() => {
                      const newChildren = [...formData.children, {
                        placementId: '',
                        name: '',
                        dimensions: { desktop: { width: '', height: '' }, mobile: { width: '', height: '' } }
                      }];
                      setFormData({ ...formData, children: newChildren });
                    }}
                    className="ml-2 text-blue-600 hover:text-blue-800"
                  >
                    Add child
                  </button>
                </div>
              )}
              
              {formData.children.map((child, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-md space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Child {index + 1}</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const newChildren = formData.children.filter((_, i) => i !== index);
                        setFormData({ ...formData, children: newChildren });
                      }}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600">Placement ID</label>
                      <input
                        type="text"
                        value={child.placementId}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = { ...child, placementId: e.target.value };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600">Name</label>
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = { ...child, name: e.target.value };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="mt-1 block w-full text-sm rounded-md border-gray-300"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600">Desktop Dimensions</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        placeholder="Width"
                        value={child.dimensions?.desktop?.width || ''}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = {
                            ...child,
                            dimensions: {
                              ...child.dimensions,
                              desktop: { ...child.dimensions?.desktop, width: parseInt(e.target.value) || '' }
                            }
                          };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="block w-full text-sm rounded-md border-gray-300"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={child.dimensions?.desktop?.height || ''}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = {
                            ...child,
                            dimensions: {
                              ...child.dimensions,
                              desktop: { ...child.dimensions?.desktop, height: parseInt(e.target.value) || '' }
                            }
                          };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="block w-full text-sm rounded-md border-gray-300"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-600">Mobile Dimensions</label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <input
                        type="number"
                        placeholder="Width"
                        value={child.dimensions?.mobile?.width || ''}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = {
                            ...child,
                            dimensions: {
                              ...child.dimensions,
                              mobile: { ...child.dimensions?.mobile, width: parseInt(e.target.value) || '' }
                            }
                          };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="block w-full text-sm rounded-md border-gray-300"
                      />
                      <input
                        type="number"
                        placeholder="Height"
                        value={child.dimensions?.mobile?.height || ''}
                        onChange={(e) => {
                          const newChildren = [...formData.children];
                          newChildren[index] = {
                            ...child,
                            dimensions: {
                              ...child.dimensions,
                              mobile: { ...child.dimensions?.mobile, height: parseInt(e.target.value) || '' }
                            }
                          };
                          setFormData({ ...formData, children: newChildren });
                        }}
                        className="block w-full text-sm rounded-md border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              ))}
              
              {formData.children.length > 0 && formData.children.length < 4 && (
                <button
                  type="button"
                  onClick={() => {
                    const newChildren = [...formData.children, {
                      placementId: '',
                      name: '',
                      dimensions: { desktop: { width: '', height: '' }, mobile: { width: '', height: '' } }
                    }];
                    setFormData({ ...formData, children: newChildren });
                  }}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Add another child
                </button>
              )}
            </div>
          )}


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