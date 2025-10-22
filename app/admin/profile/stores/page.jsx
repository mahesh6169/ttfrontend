'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdAdd, MdEdit, MdDelete, MdStore, MdCampaign } from 'react-icons/md';

export default function AdminStoresPage() {
  const router = useRouter();
  const [stores, setStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await axios.get('/admin/stores');
        
        if (response.data.success) {
          setStores(response.data.stores);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to fetch stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  const handleDelete = async (storeId, storeName) => {
    if (!confirm(`Are you sure you want to delete "${storeName}"?\n\nThis action cannot be undone. Stores with active campaigns cannot be deleted.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/stores/${storeId}`);
      
      if (response.data.success) {
        toast.success('Store deleted successfully');
        setStores(stores.filter(s => s._id !== storeId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete store');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Store Management</h1>
            <p className="text-gray-600 mt-2">Manage discount stores and campaigns</p>
          </div>
          
          <button
            onClick={() => router.push('/admin/profile/stores/add')}
            className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors flex items-center gap-2"
          >
            <MdAdd className="w-5 h-5" />
            Add Store
          </button>
        </div>

        {stores.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <MdStore className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No stores yet</h2>
            <p className="text-gray-500 mb-6">
              Create your first store to start managing discount campaigns
            </p>
            <button
              onClick={() => router.push('/admin/profile/stores/add')}
              className="bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-teal-700 transition-colors inline-flex items-center gap-2"
            >
              <MdAdd className="w-5 h-5" />
              Add Store
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Store ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stores.map((store) => (
                    <tr key={store._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {store.logo ? (
                            <img
                              src={store.logo}
                              alt={store.storeName}
                              className="w-10 h-10 object-contain rounded border"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                              <MdStore className="text-gray-400 w-6 h-6" />
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900">{store.storeName}</div>
                            {store.contactInfo?.email && (
                              <div className="text-sm text-gray-500">{store.contactInfo.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-mono text-sm font-semibold text-gray-900">
                          {store.storeIdentifier}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-700">{store.category}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {store.isNationwide ? (
                          <span className="text-sm text-gray-700">Nationwide</span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            {store.address?.state || 'N/A'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          store.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {store.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => router.push(`/admin/profile/stores/${store._id}/campaigns`)}
                            className="text-teal-600 hover:text-teal-900 p-2 hover:bg-teal-50 rounded transition-colors"
                            title="Manage campaigns"
                          >
                            <MdCampaign className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => router.push(`/admin/profile/stores/${store._id}`)}
                            className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                            title="Edit store"
                          >
                            <MdEdit className="w-5 h-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDelete(store._id, store.storeName)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors"
                            title="Delete store"
                          >
                            <MdDelete className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
