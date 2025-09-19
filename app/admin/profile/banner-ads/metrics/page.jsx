'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from '@/utils/axiosConfig';
import { FaCalendarAlt, FaChartBar, FaDownload } from 'react-icons/fa';

export default function MetricsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [metrics, setMetrics] = useState([]);
  const [totals, setTotals] = useState({ impressions: 0, clicks: 0, ctr: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const [placements, setPlacements] = useState([]);
  
  // Initialize filters from URL params
  const getInitialFilters = () => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      startDate: searchParams.get('startDate') || today,
      endDate: searchParams.get('endDate') || today,
      businessId: searchParams.get('businessId') || '',
      placementId: searchParams.get('placementId') || '',
      state: searchParams.get('state') || ''
    };
  };
  
  const [filters, setFilters] = useState(getInitialFilters());

  // Aggregated data for charts
  const [chartData, setChartData] = useState({
    daily: [],
    byPlacement: [],
    byState: [],
    byBusiness: []
  });

  // Update URL when filters change
  const updateURL = (newFilters) => {
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    router.replace(`/admin/profile/banner-ads/metrics?${params.toString()}`);
  };

  // Custom filter setter that also updates URL
  const updateFilters = (newFilters) => {
    setFilters(newFilters);
    updateURL(newFilters);
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!loading) {
      fetchMetrics();
    }
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const [businessesRes, placementsRes] = await Promise.all([
        axios.get('/admin/bannerAds/businesses'),
        axios.get('/admin/bannerAds/placements')
      ]);
      
      setBusinesses(businessesRes.data.businesses || []);
      setPlacements(placementsRes.data.placements || []);
      
      await fetchMetrics();
    } catch (error) {
      console.error('Error fetching initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      if (filters.businessId) params.businessId = filters.businessId;
      if (filters.placementId) params.placementId = filters.placementId;
      if (filters.state) params.state = filters.state;
      
      const response = await axios.get('/admin/bannerAds/metrics', { params });
      
      setMetrics(response.data.metrics || []);
      setTotals(response.data.totals || { impressions: 0, clicks: 0, ctr: 0 });
      
      // Process data for charts
      processChartData(response.data.metrics || []);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoadingMetrics(false);
    }
  };

  const processChartData = (metricsData) => {
    // Group by date
    const dailyMap = {};
    const placementMap = {};
    const stateMap = {};
    const businessMap = {};
    
    metricsData.forEach(metric => {
      // Daily aggregation
      if (!dailyMap[metric.date]) {
        dailyMap[metric.date] = { date: metric.date, impressions: 0, clicks: 0 };
      }
      dailyMap[metric.date].impressions += metric.impressions;
      dailyMap[metric.date].clicks += metric.clicks;
      
      // Placement aggregation
      if (!placementMap[metric.placementId]) {
        placementMap[metric.placementId] = { placementId: metric.placementId, impressions: 0, clicks: 0 };
      }
      placementMap[metric.placementId].impressions += metric.impressions;
      placementMap[metric.placementId].clicks += metric.clicks;
      
      // State aggregation
      if (!stateMap[metric.state]) {
        stateMap[metric.state] = { state: metric.state, impressions: 0, clicks: 0 };
      }
      stateMap[metric.state].impressions += metric.impressions;
      stateMap[metric.state].clicks += metric.clicks;
      
      // Business aggregation
      if (metric.businessId && !businessMap[metric.businessId]) {
        businessMap[metric.businessId] = { businessId: metric.businessId, impressions: 0, clicks: 0 };
      }
      if (metric.businessId) {
        businessMap[metric.businessId].impressions += metric.impressions;
        businessMap[metric.businessId].clicks += metric.clicks;
      }
    });
    
    setChartData({
      daily: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      byPlacement: Object.values(placementMap).sort((a, b) => b.impressions - a.impressions),
      byState: Object.values(stateMap).sort((a, b) => b.impressions - a.impressions),
      byBusiness: Object.values(businessMap).sort((a, b) => b.impressions - a.impressions)
    });
  };

  const handleExport = () => {
    // Convert metrics to CSV
    const headers = ['Date', 'Ad ID', 'Business ID', 'Business Name', 'Placement', 'State', 'Device', 'Impressions', 'Clicks', 'CTR'];
    const rows = metrics.map(m => [
      m.date,
      m.adId,
      m.businessId || '',
      businesses.find(b => b._id === m.businessId || b.businessId === m.businessId)?.name || '',
      m.placementId,
      m.state,
      m.device || '',
      m.impressions,
      m.clicks,
      m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) + '%' : '0%'
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `banner-ad-metrics-${filters.startDate}-${filters.endDate}.csv`;
    a.click();
  };

  const states = ['', 'NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'ALL', 'UNKNOWN'];

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
        <h1 className="text-2xl font-bold text-gray-900">Banner Ad Metrics</h1>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <FaDownload className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Filters</h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                const today = new Date().toISOString().split('T')[0];
                updateFilters({ ...filters, startDate: today, endDate: today });
              }}
              className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Today
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 7);
                updateFilters({ 
                  ...filters, 
                  startDate: start.toISOString().split('T')[0],
                  endDate: end.toISOString().split('T')[0]
                });
              }}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Last 7 Days
            </button>
            <button
              onClick={() => {
                const end = new Date();
                const start = new Date();
                start.setDate(start.getDate() - 30);
                updateFilters({ 
                  ...filters, 
                  startDate: start.toISOString().split('T')[0],
                  endDate: end.toISOString().split('T')[0]
                });
              }}
              className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
            >
              Last 30 Days
            </button>
            {(filters.businessId || filters.placementId || filters.state) && (
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  updateFilters({
                    startDate: today,
                    endDate: today,
                    businessId: '',
                    placementId: '',
                    state: ''
                  });
                }}
                className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Business {filters.businessId && <span className="text-blue-600 text-xs">(filtered)</span>}
            </label>
            <select
              value={filters.businessId}
              onChange={(e) => updateFilters({ ...filters, businessId: e.target.value })}
              className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                filters.businessId ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
              }`}
            >
              <option value="">All Businesses</option>
              {businesses.map(b => (
                <option key={b.businessId} value={b.businessId}>
                  {b.name} ({b.businessId})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Placement</label>
            <select
              value={filters.placementId}
              onChange={(e) => updateFilters({ ...filters, placementId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Placements</option>
              {placements.map(p => (
                <option key={p.placementId} value={p.placementId}>
                  {p.placementId} - {p.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select
              value={filters.state}
              onChange={(e) => updateFilters({ ...filters, state: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All States</option>
              {states.slice(1).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Detailed Table - Moved here to be close to filters */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Detailed Metrics</h3>
            {filters.businessId && (
              <span className="text-sm text-gray-500">
                Filtered by: <span className="font-medium">{businesses.find(b => b.businessId === filters.businessId)?.name}</span>
              </span>
            )}
          </div>
        </div>
        <div className="overflow-x-auto relative">
          {loadingMetrics && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ad ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Placement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  State
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Device
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impressions
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Clicks
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CTR
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.slice(0, 50).map((metric, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(metric.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.adId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {businesses.find(b => b._id === metric.businessId || b.businessId === metric.businessId)?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.placementId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.device || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {metric.impressions.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {metric.clicks.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                    {metric.impressions > 0 
                      ? ((metric.clicks / metric.impressions) * 100).toFixed(2) + '%'
                      : '0%'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {metrics.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No metrics found for the selected filters.
          </div>
        )}
        {metrics.length > 50 && (
          <div className="px-6 py-4 bg-gray-50 text-sm text-gray-500 text-center">
            Showing first 50 of {metrics.length} records. Export CSV for full data.
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaChartBar className="h-10 w-10 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Impressions</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.impressions.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaChartBar className="h-10 w-10 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Clicks</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.clicks.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <FaChartBar className="h-10 w-10 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average CTR</p>
              <p className="text-2xl font-bold text-gray-900">
                {totals.ctr}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Performance</h3>
          <div className="space-y-2">
            {chartData.daily.slice(-7).map(day => (
              <div key={day.date} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {new Date(day.date).toLocaleDateString()}
                </span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    {day.impressions.toLocaleString()} imp
                  </span>
                  <span className="text-sm text-gray-900">
                    {day.clicks.toLocaleString()} clicks
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {day.impressions > 0 ? ((day.clicks / day.impressions) * 100).toFixed(2) : 0}% CTR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Placement */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Placement</h3>
          <div className="space-y-2">
            {chartData.byPlacement.slice(0, 8).map(item => (
              <div key={item.placementId} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.placementId}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    {item.impressions.toLocaleString()} imp
                  </span>
                  <span className="text-sm text-gray-900">
                    {item.clicks.toLocaleString()} clicks
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0}% CTR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By State */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by State</h3>
          <div className="space-y-2">
            {chartData.byState.map(item => (
              <div key={item.state} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{item.state}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-900">
                    {item.impressions.toLocaleString()} imp
                  </span>
                  <span className="text-sm text-gray-900">
                    {item.clicks.toLocaleString()} clicks
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0}% CTR
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Business */}
        {chartData.byBusiness.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Performance by Business</h3>
            <div className="space-y-2">
              {chartData.byBusiness.map(item => {
                const business = businesses.find(b => b._id === item.businessId || b.businessId === item.businessId);
                return (
                  <div key={item.businessId} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {business?.name || item.businessId}
                    </span>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-900">
                        {item.impressions.toLocaleString()} imp
                      </span>
                      <span className="text-sm text-gray-900">
                        {item.clicks.toLocaleString()} clicks
                      </span>
                      <span className="text-sm font-medium text-blue-600">
                        {item.impressions > 0 ? ((item.clicks / item.impressions) * 100).toFixed(2) : 0}% CTR
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}