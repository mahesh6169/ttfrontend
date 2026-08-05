'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { FaPlus, FaPencilAlt, FaTrash, FaSearch } from 'react-icons/fa';

export default function BusinessesPage() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      const response = await axios.get('/admin/bannerAds/businesses', {
        params: { search }
      });
      setBusinesses(response.data.businesses || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedBusiness(null);
    setShowCreateModal(true);
  };

  const handleEdit = (business) => {
    setSelectedBusiness(business);
    setShowEditModal(true);
  };

  const handleDelete = async (businessId) => {
    if (!confirm('Are you sure you want to delete this business? This cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/admin/bannerAds/businesses/${businessId}`);
      fetchBusinesses();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete business');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBusinesses();
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
        <h1 className="text-2xl font-bold text-slate-900">Manage Businesses</h1>
        <button
          onClick={handleCreate}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaPlus className="h-5 w-5 mr-2" />
          Add Business
        </button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="Search by name, ID, or email..."
            />
          </div>
        </div>
        <button
          type="submit"
          className="px-4 py-2 border border-slate-300 rounded-md shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Search
        </button>
      </form>

      {/* Businesses Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Business ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Ads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {businesses.map((business) => (
              <tr key={business.businessId}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                  {business.businessId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                  {business.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <div>{business.contact.email}</div>
                  {business.contact.phone && (
                    <div className="text-xs">{business.contact.phone}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    business.status === 'active' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {business.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {business.adCount || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => handleEdit(business)}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    <FaPencilAlt className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(business.businessId)}
                    className="text-red-600 hover:text-red-900"
                    disabled={business.adCount > 0}
                  >
                    <FaTrash className={`h-5 w-5 ${business.adCount > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {businesses.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No businesses found. Create your first business to start advertising.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <BusinessModal
          business={selectedBusiness}
          isEdit={showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
          }}
          onSuccess={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            fetchBusinesses();
          }}
        />
      )}
    </div>
  );
}

// Business Create/Edit Modal Component
function BusinessModal({ business, isEdit, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: business?.name || '',
    contact: {
      email: business?.contact?.email || '',
      phone: business?.contact?.phone || ''
    },
    abn: business?.abn || '',
    billingAddress: {
      street: business?.billingAddress?.street || '',
      city: business?.billingAddress?.city || '',
      state: business?.billingAddress?.state || '',
      postalCode: business?.billingAddress?.postalCode || ''
    },
    status: business?.status || 'active',
    billing: {
      notes: business?.billing?.notes || ''
    }
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit) {
        await axios.put(`/admin/bannerAds/businesses/${business.businessId}`, formData);
      } else {
        await axios.post('/admin/bannerAds/businesses', formData);
      }
      onSuccess();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save business');
    } finally {
      setSaving(false);
    }
  };


  const states = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'];

  return (
    <div className="fixed inset-0 bg-slate-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="text-lg font-medium text-slate-900">
              {isEdit ? 'Edit Business' : 'Create New Business'}
            </h3>
          </div>

          <div className="px-6 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>


            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contact Email *
              </label>
              <input
                type="email"
                value={formData.contact.email}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact: { ...formData.contact, email: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Contact Phone
              </label>
              <input
                type="tel"
                value={formData.contact.phone}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  contact: { ...formData.contact, phone: e.target.value }
                })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* ABN */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                ABN (Australian Business Number)
              </label>
              <input
                type="text"
                value={formData.abn}
                onChange={(e) => setFormData({ ...formData, abn: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="12345678901"
              />
            </div>

            {/* Billing Address */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700">
                Billing Address
              </label>
              
              <input
                type="text"
                placeholder="Street Address"
                value={formData.billingAddress.street}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billingAddress: { ...formData.billingAddress, street: e.target.value }
                })}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
              
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="City"
                  value={formData.billingAddress.city}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, city: e.target.value }
                  })}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
                
                <select
                  value={formData.billingAddress.state}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    billingAddress: { ...formData.billingAddress, state: e.target.value }
                  })}
                  className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                >
                  <option value="">Select State</option>
                  {states.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <input
                type="text"
                placeholder="Postal Code"
                value={formData.billingAddress.postalCode}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billingAddress: { ...formData.billingAddress, postalCode: e.target.value }
                })}
                className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
              </select>
            </div>

            {/* Billing Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Billing Notes
              </label>
              <textarea
                value={formData.billing.notes}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  billing: { notes: e.target.value }
                })}
                rows={3}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Contract details, payment terms, etc."
              />
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
              {saving ? 'Saving...' : (isEdit ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}