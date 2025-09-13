'use client';
import { useState, useEffect } from 'react';
import axios from '@/utils/axiosConfig';
import { FaCalendarAlt, FaChartBar, FaDownload } from 'react-icons/fa';

export default function MetricsPage() {
  const [metrics, setMetrics] = useState([]);
  const [totals, setTotals] = useState({ impressions: 0, clicks: 0, ctr: 0 });
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState([]);
  const [placements, setPlacements] = useState([]);
  
  // Filters
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    businessId: '',
    placementId: '',
    state: ''
  });

  // Aggregated data for charts
  const [chartData, setChartData] = useState({
    daily: [],
    byPlacement: [],
    byState: [],
    byBusiness: []
  });

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
    const headers = ['Date', 'Ad ID', 'Business ID', 'Placement', 'State', 'Device', 'Impressions', 'Clicks', 'CTR'];
    const rows = metrics.map(m => [
      m.date,
      m.adId,
      m.businessId || '',
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
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Business</label>
            <select
              value={filters.businessId}
              onChange={(e) => setFilters({ ...filters, businessId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">All Businesses</option>
              {businesses.map(b => (
                <option key={b.businessId} value={b.businessId}>{b.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Placement</label>
            <select
              value={filters.placementId}
              onChange={(e) => setFilters({ ...filters, placementId: e.target.value })}
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
              onChange={(e) => setFilters({ ...filters, state: e.target.value })}
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
                const business = businesses.find(b => b.businessId === item.businessId);
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

      {/* Detailed Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
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
    </div>
  );
}