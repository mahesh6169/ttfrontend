'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from '@/utils/axiosConfig';
import { FaPlusCircle, FaEdit, FaTrash, FaPause, FaPlay, FaEye, FaClock } from 'react-icons/fa';

export default function ManageAdsPage() {
  const [ads, setAds] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, paused, expired

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch ads
      const adsRes = await axios.get('/admin/bannerAds/ads');
      const allAds = adsRes.data.ads || [];
      
      // Fetch businesses for mapping
      const businessRes = await axios.get('/admin/bannerAds/businesses');
      const businessesData = businessRes.data.businesses || [];
      
      // Fetch placements
      const placementsRes = await axios.get('/admin/bannerAds/placements');
      const placementsData = placementsRes.data.placements || [];
      
      // Create business map for quick lookup
      const businessMap = {};
      businessesData.forEach(b => {
        businessMap[b._id] = b;
      });
      
      // Transform ads to include business names and placement info
      const transformedAds = allAds.map(ad => ({
        ...ad,
        // Check if businessId is populated object or just ID string
        businessName: ad.businessId?.name || businessMap[ad.businessId]?.name || 'Unknown Business',
        businessStatus: ad.businessId?.status || businessMap[ad.businessId]?.status || 'unknown'
      }));
      
      setAds(transformedAds);
      setBusinesses(businessesData);
      setPlacements(placementsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/admin/bannerAds/ads/${adId}`);
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete ad. Please try again.');
    }
  };

  const handleToggleStatus = async (ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    
    try {
      await axios.put(`/admin/bannerAds/ads/${ad.adId}`, {
        status: newStatus
      });
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error updating ad status:', error);
      alert('Failed to update ad status. Please try again.');
    }
  };

  const handleCheckExpired = async () => {
    try {
      const response = await axios.post('/admin/bannerAds/check-expired');
      
      if (response.data.success) {
        if (response.data.count > 0) {
          alert(`${response.data.message}\n\nExpired ads:\n${response.data.expired.map(ad => `- ${ad.name} (${ad.adId})`).join('\n')}`);
        } else {
          alert(response.data.message);
        }
        fetchData(); // Refresh the data to show updated statuses
      }
    } catch (error) {
      console.error('Error checking expired ads:', error);
      alert('Failed to check expired ads. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`inline-flex px-2 text-xs leading-5 font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const filteredAds = ads.filter(ad => {
    if (filter === 'all') return true;
    return ad.status === filter;
  });

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
        <h1 className="text-2xl font-bold text-gray-900">Manage Banner Ads</h1>
        <div className="flex gap-2">
          <button
            onClick={handleCheckExpired}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <FaClock className="h-5 w-5 mr-2" />
            Check Expired Ads
          </button>
          <Link
            href="/admin/profile/banner-ads/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FaPlusCircle className="h-5 w-5 mr-2" />
            Create New Ad
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['all', 'active', 'paused', 'expired'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`
                whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize
                ${filter === status 
                  ? 'border-blue-500 text-blue-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {status} ({ads.filter(ad => status === 'all' || ad.status === status).length})
            </button>
          ))}
        </nav>
      </div>

      {/* Ads Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {filteredAds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No ads found</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredAds.map((ad) => (
              <li key={ad._id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {ad.name || ad.adId}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {ad.businessName} • {ad.placements.join(', ')}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(ad.status)}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span>Placements: {ad.placements.join(', ')}</span>
                      <span className="mx-2">•</span>
                      <span>States: {ad.targetStates.length > 0 ? ad.targetStates.join(', ') : 'All'}</span>
                    </div>
                    
                    <div className="mt-1 flex items-center text-sm text-gray-500">
                      <span>Schedule: {new Date(ad.schedule.startAt).toLocaleDateString()} - {new Date(ad.schedule.endAt).toLocaleDateString()}</span>
                      <span className="mx-2">•</span>
                      <span>Images: {(ad.creative?.desktop?.images?.length || 0) + (ad.creative?.mobile?.images?.length || 0)}</span>
                    </div>
                    
                    {ad.counters && (
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <FaEye className="mr-1" />
                        <span>{ad.counters.impressions.toLocaleString()} impressions</span>
                        <span className="mx-2">•</span>
                        <span>{ad.counters.clicks.toLocaleString()} clicks</span>
                        {ad.counters.impressions > 0 && (
                          <>
                            <span className="mx-2">•</span>
                            <span>{((ad.counters.clicks / ad.counters.impressions) * 100).toFixed(2)}% CTR</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex items-center space-x-2">
                    <button
                      onClick={() => handleToggleStatus(ad)}
                      className={`p-2 rounded-full ${
                        ad.status === 'active' 
                          ? 'text-yellow-600 hover:bg-yellow-50' 
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={ad.status === 'active' ? 'Pause ad' : 'Activate ad'}
                    >
                      {ad.status === 'active' ? <FaPause /> : <FaPlay />}
                    </button>
                    
                    <Link
                      href={`/admin/profile/banner-ads/edit/${ad.adId}`}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                      title="Edit ad"
                    >
                      <FaEdit />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteAd(ad.adId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                      title="Delete ad"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-gray-50 px-6 py-4 rounded-lg">
        <div className="text-sm text-gray-600">
          Total: {ads.length} ads • 
          Active: {ads.filter(a => a.status === 'active').length} • 
          Paused: {ads.filter(a => a.status === 'paused').length} • 
          Expired: {ads.filter(a => a.status === 'expired').length}
        </div>
      </div>
    </div>
  );
}