'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from '@/utils/axiosConfig';
import { FaPlusCircle, FaBuilding, FaLayerGroup, FaChartBar, FaImage } from 'react-icons/fa';

export default function BannerAdsPage() {
  const [stats, setStats] = useState({
    totalBusinesses: 0,
    activeBusinesses: 0,
    totalAds: 0,
    activeAds: 0,
    totalImpressions: 0,
    totalClicks: 0
  });
  const [recentAds, setRecentAds] = useState([]);
  const [unassignedAds, setUnassignedAds] = useState([]);
  const [placements, setPlacements] = useState([]);
  const [placementAds, setPlacementAds] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDeleteAd = async (adId) => {
    if (!window.confirm('Are you sure you want to delete this ad?')) {
      return;
    }
    
    try {
      await axios.delete(`/admin/bannerAds/ads/${adId}`);
      // Refresh the data after deletion
      fetchDashboardData();
    } catch (error) {
      console.error('Error deleting ad:', error);
      alert('Failed to delete ad. Please try again.');
    }
  };


  const fetchDashboardData = async () => {
    try {
      // Fetch businesses
      const businessRes = await axios.get('/admin/bannerAds/businesses');
      const businesses = businessRes.data.businesses || [];
      
      // Fetch ads
      const adsRes = await axios.get('/admin/bannerAds/ads');
      const ads = adsRes.data.ads || [];
      
      // Fetch placements
      const placementsRes = await axios.get('/admin/bannerAds/placements');
      const placementsData = placementsRes.data.placements || [];
      setPlacements(placementsData);
      
      // Group ads by placement
      const adsByPlacement = {};
      ads.forEach(ad => {
        ad.placements.forEach(placement => {
          if (!adsByPlacement[placement]) {
            adsByPlacement[placement] = [];
          }
          adsByPlacement[placement].push(ad);
        });
      });
      setPlacementAds(adsByPlacement);
      
      // Transform ads to show split placements properly
      const transformedAds = ads.map(ad => {
        const transformedPlacements = [];
        ad.placements.forEach(placementCode => {
          const placementInfo = placementsData.find(p => p.placementId === placementCode);
          if (placementInfo?.layoutType === 'split' && placementInfo.children) {
            // For split placements, determine which child slot(s) this ad occupies
            const placementAdsForThisCode = adsByPlacement[placementCode] || [];
            const adIndex = placementAdsForThisCode.findIndex(a => a.adId === ad.adId);
            
            if (adIndex >= 0 && adIndex < placementInfo.children.length) {
              transformedPlacements.push(placementInfo.children[adIndex].placementId);
            } else if (placementAdsForThisCode.length === 1) {
              // If only one ad in split placement, it might occupy both slots
              placementInfo.children.forEach(child => {
                transformedPlacements.push(child.placementId);
              });
            }
          } else {
            transformedPlacements.push(placementCode);
          }
        });
        return {
          ...ad,
          displayPlacements: transformedPlacements
        };
      });
      
      // Fetch metrics for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const metricsRes = await axios.get('/admin/bannerAds/metrics', {
        params: {
          startDate: thirtyDaysAgo.toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0]
        }
      });
      
      setStats({
        totalBusinesses: businesses.length,
        activeBusinesses: businesses.filter(b => b.status === 'active').length,
        totalAds: ads.length,
        activeAds: ads.filter(a => a.status === 'active').length,
        totalImpressions: metricsRes.data.totals?.impressions || 0,
        totalClicks: metricsRes.data.totals?.clicks || 0
      });
      
      // Get 5 most recent ads with transformed placements
      setRecentAds(transformedAds.slice(0, 5));
      
      // Identify unassigned ads (ads with no placements)
      const unassigned = ads.filter(ad => !ad.placements || ad.placements.length === 0);
      setUnassignedAds(unassigned);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
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
        <h1 className="text-2xl font-bold text-gray-900">Banner Ads Management</h1>
        <Link
          href="/admin/profile/banner-ads/create"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaPlusCircle className="h-5 w-5 mr-2" />
          Create New Ad
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaBuilding className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Businesses</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeBusinesses}/{stats.totalBusinesses}</p>
              <p className="text-xs text-gray-500">Active/Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaImage className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Ads</p>
              <p className="text-2xl font-bold text-gray-900">{stats.activeAds}/{stats.totalAds}</p>
              <p className="text-xs text-gray-500">Active/Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaChartBar className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Performance (30 days)</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalImpressions.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">
                {stats.totalClicks.toLocaleString()} clicks ({stats.totalImpressions > 0 ? ((stats.totalClicks / stats.totalImpressions) * 100).toFixed(2) : 0}% CTR)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/profile/banner-ads/businesses"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <FaBuilding className="h-8 w-8 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900">Manage Businesses</h3>
          <p className="text-sm text-gray-500">Add, edit, or pause advertisers</p>
        </Link>

        <Link
          href="/admin/profile/banner-ads/placements"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <FaLayerGroup className="h-8 w-8 text-green-600 mb-2" />
          <h3 className="font-medium text-gray-900">Manage Placements</h3>
          <p className="text-sm text-gray-500">Configure ad slots and layouts</p>
        </Link>

        <Link
          href="/admin/profile/banner-ads/create"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <FaPlusCircle className="h-8 w-8 text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-900">Create New Ad</h3>
          <p className="text-sm text-gray-500">Launch a new ad campaign</p>
        </Link>

        <Link
          href="/admin/profile/banner-ads/metrics"
          className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
        >
          <FaChartBar className="h-8 w-8 text-orange-600 mb-2" />
          <h3 className="font-medium text-gray-900">View Metrics</h3>
          <p className="text-sm text-gray-500">Detailed performance reports</p>
        </Link>
      </div>

      {/* Placements */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Placements</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placements
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  AD-ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Schedule
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {['H1', 'H2', 'V1', 'V2'].flatMap((placementCode) => {
                const placementInfo = placements.find(p => p.placementId === placementCode);
                const isSplit = placementInfo?.layoutType === 'split';
                const ads = placementAds[placementCode] || [];
                
                // Show all ads assigned to this placement
                if (ads.length > 0) {
                  return ads.map((ad, index) => {
                    // For split placements, determine which child slot to show
                    let displayPlacement = placementCode;
                    if (isSplit && placementInfo.children && placementInfo.children.length > 0) {
                      // Distribute ads across child slots
                      const childIndex = index % placementInfo.children.length;
                      displayPlacement = placementInfo.children[childIndex].placementId;
                    }
                    
                    return (
                        <tr key={`${placementCode}-${ad.adId}`}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ad.businessId?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {displayPlacement}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ad.name || 'Untitled Ad'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {ad.adId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {ad.targetStates?.length > 0 ? ad.targetStates.join(', ') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              ad.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : ad.status === 'paused'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {ad.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(ad.schedule.startAt).toLocaleDateString()} - {new Date(ad.schedule.endAt).toLocaleDateString()}
                          </td>
                        </tr>
                    );
                  });
                } else {
                  // No ads assigned - show empty rows
                  if (isSplit && placementInfo?.children) {
                    // For split placements, show empty rows for each child
                    return placementInfo.children.map(child => (
                      <tr key={`${child.placementId}-empty`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 italic">
                          No ads assigned
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {child.placementId}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                      </tr>
                    ));
                  } else {
                    // For full placements, show single empty row
                    return (
                      <tr key={`${placementCode}-empty`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 italic">
                          No ads assigned
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {placementCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                          -
                        </td>
                      </tr>
                    );
                  }
                }
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ads */}
      {recentAds.length > 0 && (
        <div className="bg-white rounded-lg shadow mt-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Ads</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Business
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placements
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AD-ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    State
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Schedule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentAds.map((ad) => (
                  <tr key={ad.adId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.businessId?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.displayPlacements?.join(', ') || ad.placements.join(', ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ad.name || 'Untitled Ad'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {ad.adId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {ad.targetStates?.length > 0 ? ad.targetStates.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        ad.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : ad.status === 'paused'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {ad.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ad.schedule.startAt).toLocaleDateString()} - {new Date(ad.schedule.endAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-3">
                      <Link
                        href={`/admin/profile/banner-ads/edit/${ad.adId}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteAd(ad.adId)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}