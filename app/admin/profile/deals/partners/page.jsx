'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';

export default function PartnerStoresPage() {
  const router = useRouter();
  const [partnerStores, setPartnerStores] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchPartnerStores();
  }, []);

  const fetchPartnerStores = async () => {
    try {
      const response = await axios.get('/admin/dailydeals/partners');

      if (response.data.success) {
        setPartnerStores(response.data.partnerStores);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch partner stores');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, businessName) => {
    if (!confirm(`Are you sure you want to delete "${businessName}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/dailydeals/partners/${id}`);

      if (response.data.success) {
        toast.success('Partner store deleted successfully');
        setPartnerStores(partnerStores.filter(p => p._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete partner store');
    }
  };

  const filteredStores = partnerStores.filter(store =>
    store.businessName.toLowerCase().includes(searchText.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-6 sm:py-8">
        <p className="text-center text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto py-6 sm:py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Partner Stores</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Manage partner stores for daily deals</p>
        </div>
        <button
          onClick={() => router.push('/admin/profile/deals/partners/add')}
          className="flex items-center justify-center gap-2 bg-teal-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-teal-700 w-full sm:w-auto"
        >
          <MdAdd size={20} />
          Add Partner
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by business name..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="w-full sm:w-64 p-3 sm:p-2 text-base sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {filteredStores.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No partner stores found</p>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="sm:hidden space-y-4">
            {filteredStores.map((store) => (
              <div key={store._id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start gap-3">
                  {store.logo?.url ? (
                    <img
                      src={store.logo.url}
                      alt={store.businessName}
                      className="w-14 h-14 object-contain rounded"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                      No Logo
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{store.businessName}</div>
                    <div className="text-xs text-gray-500">{store.partnerstoreId}</div>
                    <div className="text-sm text-gray-600 mt-1">{store.subcategory ? `${store.category} › ${store.subcategory}` : store.category}</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs whitespace-nowrap ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {store.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mt-3 text-sm text-gray-600">
                  {store.isNationwide ? (
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Nationwide</span>
                  ) : (
                    `${store.address?.suburb || ''}, ${store.address?.state || ''}`
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-3 border-t">
                  <button
                    onClick={() => router.push(`/admin/profile/deals/partners/edit/${store._id}`)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 text-blue-600 bg-blue-50 rounded-lg"
                  >
                    <MdEdit size={18} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(store._id, store.businessName)}
                    className="flex-1 flex items-center justify-center gap-2 p-2 text-red-600 bg-red-50 rounded-lg"
                  >
                    <MdDelete size={18} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {store.logo?.url ? (
                        <img
                          src={store.logo.url}
                          alt={store.businessName}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Logo
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{store.businessName}</div>
                      <div className="text-xs text-gray-500">{store.partnerstoreId}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{store.subcategory ? `${store.category} › ${store.subcategory}` : store.category}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {store.isNationwide ? (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">Nationwide</span>
                      ) : (
                        `${store.address?.suburb || ''}, ${store.address?.state || ''}`
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${store.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {store.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/profile/deals/partners/edit/${store._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(store._id, store.businessName)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
