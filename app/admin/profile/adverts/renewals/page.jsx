'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/axiosConfig';
import LoadingSpinner from '@/components/LoadingSpinner';
import Pagination from '@/components/Pagination';

const ManageAdvertsPage = () => {
  console.log('[RENEWALS] Component rendering...');
  
  // State management - replaces Redux store
  const [adverts, setAdverts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ 
    totalPages: 1, 
    totalItems: 0,
    currentPage: 1,
    itemsPerPage: 10
  });
  const [sendingReminders, setSendingReminders] = useState({});
  const [deletingAdverts, setDeletingAdverts] = useState({});
  
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
  console.log('[RENEWALS] BASE_URL:', BASE_URL);

  // Fetch adverts - replaces getManageAdverts Redux action
  const fetchAdverts = async (pageNum = 1) => {
    console.log('[RENEWALS] fetchAdverts called with page:', pageNum);
    setLoading(true);
    try {
      const url = `${BASE_URL}/admin/adverts/manage?page=${pageNum}&limit=10`;
      console.log('[RENEWALS] Fetching from URL:', url);
      
      const { data } = await axios.get(url, { withCredentials: true });
      
      console.log('[RENEWALS] Response received:', {
        success: data.success,
        advertCount: data.adverts?.length,
        meta: data.meta
      });
      
      if (data.success) {
        setAdverts(data.adverts || []);
        setMeta(data.meta || { 
          totalPages: 1, 
          totalItems: 0,
          currentPage: pageNum,
          itemsPerPage: 10
        });
        setPage(pageNum);
      }
    } catch (error) {
      console.error('[RENEWALS] Error fetching adverts:', error);
      console.error('[RENEWALS] Error details:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        // Could redirect to login if needed
      } else {
        toast.error('Failed to load adverts');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    console.log('[RENEWALS] useEffect - Initial load triggered');
    fetchAdverts(1);
  }, []);

  // Handle pagination - replaces updateAdminAdvertFilter Redux action
  const handlePageChange = (newPage) => {
    fetchAdverts(newPage);
  };

  // Send reminder - replaces sendAdvertReminder Redux action
  const handleReminder = async (advertId, type) => {
    const key = `${advertId}-${type}`;
    setSendingReminders(prev => ({ ...prev, [key]: true }));
    
    try {
      const { data } = await axios.post(
        `${BASE_URL}/admin/adverts/remind/${advertId}?type=${type}`,
        {},
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success(`${type}-day reminder sent successfully`);
        
        // Refresh the list after a small delay to ensure backend has updated
        setTimeout(() => {
          fetchAdverts(page);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to send reminder:', error);
      toast.error(error.response?.data?.message || 'Failed to send reminder');
    } finally {
      setSendingReminders(prev => ({ ...prev, [key]: false }));
    }
  };

  // Delete advert - replaces deleteAdvertById Redux action
  const handleDelete = async (advertId) => {
    if (!confirm('Are you sure you want to delete this advert?')) {
      return;
    }

    setDeletingAdverts(prev => ({ ...prev, [advertId]: true }));
    
    try {
      const { data } = await axios.delete(
        `${BASE_URL}/admin/adverts/byid/${advertId}`,
        { withCredentials: true }
      );
      
      if (data.success) {
        toast.success('Advert deleted successfully');
        
        // If we deleted the last item on a page, go to previous page
        if (adverts.length === 1 && page > 1) {
          fetchAdverts(page - 1);
        } else {
          fetchAdverts(page);
        }
      }
    } catch (error) {
      console.error('Error deleting advert:', error);
      toast.error(error.response?.data?.message || 'Failed to delete advert');
    } finally {
      setDeletingAdverts(prev => ({ ...prev, [advertId]: false }));
    }
  };

  // Helper function to get status text
  const getStatusText = (renewalStatus) => {
    switch (renewalStatus) {
      case 'notify1': 
        return 'Due (14d)';
      case 'notify2': 
        return 'Due (7d)';
      case 'pendingNotification2': 
        return 'Pending Notif (7d)';
      case 'expired': 
        return 'Expired';
      default: 
        return 'Valid';
    }
  };

  // Helper function to get row styling
  const getRowClassName = (renewalStatus) => {
    return renewalStatus === 'notify1' ? 'bg-gray-100 text-gray-400' : '';
  };

  // Render
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Manage Advert Renewals</h1>

      {loading && <LoadingSpinner />}
      
      {!loading && adverts.length === 0 && (
        <p className="text-gray-500">No adverts found.</p>
      )}

      {!loading && adverts.length > 0 && (
        <>
          <div className="mb-4 text-sm text-gray-600">
            Showing {adverts.length} of {meta.totalItems} adverts
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="border p-2">Title</th>
                  <th className="border p-2">Owner Email</th>
                  <th className="border p-2">Days Left</th>
                  <th className="border p-2">Status</th>
                  <th className="border p-2">Actions</th>
                  <th className="border p-2">Moderation</th>
                </tr>
              </thead>
              <tbody>
                {adverts.map((ad) => {
                  const reminderKey14 = `${ad._id}-14`;
                  const reminderKey7 = `${ad._id}-7`;

                  return (
                    <tr
                      key={ad._id}
                      className={getRowClassName(ad.renewalStatus)}
                    >
                      <td className="border p-2">{ad.title}</td>
                      <td className="border p-2">{ad.email}</td>
                      <td className="border p-2">
                        <span className={ad.daysLeft < 0 ? 'text-red-600 font-bold' : ''}>
                          {ad.daysLeft} days
                        </span>
                      </td>
                      <td className="border p-2">{getStatusText(ad.renewalStatus)}</td>
                      <td className="border p-2">
                        {ad.renewalStatus === 'notify1' && (
                          <button
                            className="px-2 py-1 text-xs rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleReminder(ad._id, '14')}
                            disabled={sendingReminders[reminderKey14]}
                          >
                            {sendingReminders[reminderKey14] ? 'Sending...' : 'Notify (14d)'}
                          </button>
                        )}

                        {ad.renewalStatus === 'notify2' && (
                          <button
                            className="px-2 py-1 text-xs rounded bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleReminder(ad._id, '7')}
                            disabled={sendingReminders[reminderKey7]}
                          >
                            {sendingReminders[reminderKey7] ? 'Sending...' : 'Notify (7d)'}
                          </button>
                        )}

                        {ad.renewalStatus === 'pendingNotification2' && (
                          <span className="inline-block px-2 py-1 text-xs rounded bg-gray-300 text-gray-700">
                            Waiting (7d)
                          </span>
                        )}
                        
                        {ad.renewalStatus === 'expired' && (
                          <button
                            className="ml-2 px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => handleDelete(ad._id)}
                            disabled={deletingAdverts[ad._id]}
                          >
                            {deletingAdverts[ad._id] ? 'Deleting...' : 'Delete'}
                          </button>
                        )}
                        
                        {ad.renewalStatus === 'valid' && (
                          <span className="text-xs text-gray-500">-</span>
                        )}
                      </td>
                      <td className="border p-2">
                        <button
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleDelete(ad._id)}
                          disabled={deletingAdverts[ad._id]}
                        >
                          {deletingAdverts[ad._id] ? 'Deleting...' : 'Delete'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={meta.totalPages || 1}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </div>
  );
};

export default ManageAdvertsPage;