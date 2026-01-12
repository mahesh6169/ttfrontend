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
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <p className="text-center text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Partner Stores</h1>
            <p className="text-gray-600 mt-2">Manage partner stores for daily deals</p>
          </div>
          <button
            onClick={() => router.push('/admin/profile/dailydeals/partners/add')}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
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
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredStores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No partner stores found</p>
          ) : (
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
                    <td className="px-4 py-3 text-sm text-gray-600">{store.category}</td>
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
                          onClick={() => router.push(`/admin/profile/dailydeals/partners/edit/${store._id}`)}
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
          )}
        </div>
      </div>
    </div>
  );
}
