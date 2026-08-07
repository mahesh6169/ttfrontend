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
    // Check if ads are assigned
    if (placement.assignedAds && placement.assignedAds.length > 0) {
      alert(`Cannot delete placement ${placement.placementId}: ${placement.assignedAds.length} ad${placement.assignedAds.length > 1 ? 's are' : ' is'} assigned to this placement. Please remove all ads first.`);
      return;
    }

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
        <h1 className="text-2xl font-bold text-slate-900">Manage Placements</h1>
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
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md shadow-sm text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaSyncAlt className="h-5 w-5 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Placements Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Placement ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Placement Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Dimensions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ads Assigned
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {placements.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-slate-500">
                  No placements found. Create one to get started.
                </td>
              </tr>
            ) : (
              placements.map(placement => (
                <tr key={placement.placementId} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {placement.placementId}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {placement.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-900">
                      <div>
                        <span className="text-slate-500">Desktop:</span>{' '}
                        {placement.dimensions?.desktop?.width || placement.dimensions?.width || '?'} × {placement.dimensions?.desktop?.height || placement.dimensions?.height || '?'}
                      </div>
                      {placement.dimensions?.mobile?.width && (
                        <div>
                          <span className="text-slate-500">Mobile:</span>{' '}
                          {placement.dimensions.mobile.width} × {placement.dimensions.mobile.height}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {placement.assignedAds?.length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {placement.assignedAds.length} ad{placement.assignedAds.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                          None
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(placement)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <FaPencilAlt className="inline h-5 w-5" />
                      <span className="sr-only">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(placement)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <FaTrash className="inline h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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


// Placement Edit Modal
function PlacementEditModal({ placement, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: placement.name,
    dimensions: placement.dimensions || { 
      desktop: { width: '', height: '' },
      mobile: { width: '', height: '' }
    }
  });
  const [saving, setSaving] = useState(false);

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
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">
              Edit Placement: {placement.placementId}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Display Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>


            {/* Desktop Dimensions */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
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
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Mobile Dimensions */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
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
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-slate-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
    dimensions: {
      desktop: {
        width: '',
        height: ''
      },
      mobile: {
        width: '',
        height: ''
      }
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // No validation needed - allow any format the user wants
    if (!formData.placementId.trim()) {
      alert('Placement ID is required');
      return;
    }
    
    setSaving(true);
    
    console.log('=== CREATING PLACEMENT ===');
    console.log('Form data:', formData);
    
    try {
      const response = await axios.post('/admin/bannerAds/placements', formData);
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
            <label className="block text-sm font-medium text-slate-700">
              Placement ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.placementId}
              onChange={(e) => {
                const id = e.target.value.toUpperCase();
                setFormData({ ...formData, placementId: id });
              }}
              placeholder="e.g. TOP-P1, MIDDLE-S1"
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
            <p className="mt-1 text-xs text-slate-500">
              Use descriptive names like TOP-P1 (Top Primary 1), MIDDLE-S1 (Middle Secondary 1)
            </p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Top Primary Banner #1"
              className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>

          {/* Desktop Dimensions */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Desktop Dimensions (px)
            </label>
            <p className="mt-1 text-xs text-slate-500">Standard: DH-728×90, DV-160×600, DH-Half-364×90</p>
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
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Mobile Dimensions */}
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Mobile Dimensions (px)
            </label>
            <p className="mt-1 text-xs text-slate-500">Standard: MH-320×50, MH-Half-160×50</p>
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
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
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
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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