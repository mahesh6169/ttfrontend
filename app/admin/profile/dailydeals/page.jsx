'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import { MdAdd, MdEdit, MdDelete } from 'react-icons/md';
import { format } from 'date-fns';

const DAYS_SHORT = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
};

export default function DailyDealsPage() {
  const router = useRouter();
  const [deals, setDeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      const response = await axios.get('/admin/dailydeals');

      if (response.data.success) {
        setDeals(response.data.dailyDeals);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch deals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id, dealTitle) => {
    if (!confirm(`Are you sure you want to delete "${dealTitle}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await axios.delete(`/admin/dailydeals/${id}`);

      if (response.data.success) {
        toast.success('Deal deleted successfully');
        setDeals(deals.filter(d => d._id !== id));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete deal');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const response = await axios.put(`/admin/dailydeals/${id}`, {
        isActive: !currentStatus
      });

      if (response.data.success) {
        setDeals(deals.map(d =>
          d._id === id ? { ...d, isActive: !currentStatus } : d
        ));
        toast.success(`Deal ${!currentStatus ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      toast.error('Failed to update deal status');
    }
  };

  const filteredDeals = deals.filter(deal => {
    const matchesSearch = deal.dealTitle.toLowerCase().includes(searchText.toLowerCase());
    const matchesActive = filterActive === 'all' ||
      (filterActive === 'active' && deal.isActive) ||
      (filterActive === 'inactive' && !deal.isActive);
    return matchesSearch && matchesActive;
  });

  const formatValidDays = (validDays) => {
    if (!validDays || validDays.length === 0) return 'Every Day';
    return validDays.map(d => DAYS_SHORT[d] || d).join(', ');
  };

  const isExpired = (endDate) => new Date(endDate) < new Date();
  const isExpiringSoon = (endDate) => {
    const daysLeft = Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft <= 7 && daysLeft > 0;
  };

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
            <h1 className="text-3xl font-bold text-gray-800">Daily Deals</h1>
            <p className="text-gray-600 mt-2">Manage daily deals</p>
          </div>
          <button
            onClick={() => router.push('/admin/profile/dailydeals/add')}
            className="flex items-center gap-2 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700"
          >
            <MdAdd size={20} />
            Add Deal
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by deal title..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
          {filteredDeals.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No deals found</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deal Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Partner</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valid Days</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDeals.map((deal) => (
                  <tr key={deal._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {deal.images && deal.images.length > 0 ? (
                        <img
                          src={deal.images[0].url}
                          alt={deal.dealTitle}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{deal.dealTitle}</div>
                      {deal.featured?.isActive && (
                        <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded text-xs">Featured</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {deal.partnerstoreId?.businessName || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatValidDays(deal.validDays)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      <div>{format(new Date(deal.startDate), 'dd MMM')}</div>
                      <div className="text-gray-400">to</div>
                      <div className={isExpired(deal.endDate) ? 'text-red-600' : isExpiringSoon(deal.endDate) ? 'text-orange-600' : ''}>
                        {format(new Date(deal.endDate), 'dd MMM yyyy')}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(deal._id, deal.isActive)}
                        className={`px-2 py-1 rounded text-xs ${deal.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                      >
                        {deal.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/admin/profile/dailydeals/edit/${deal._id}`)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id, deal.dealTitle)}
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
