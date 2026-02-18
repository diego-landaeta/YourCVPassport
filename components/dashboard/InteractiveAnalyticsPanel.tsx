import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useTranslations } from '../../hooks/useTranslations';

interface AnalyticsData {
  visitsData: { name: string; visits: number }[];
  countriesData: { country: string; visits: number; flag: string }[];
  trafficSourcesData: { name: string; value: number; color: string }[];
  stats: {
    visits: number;
    ctaClicks: number;
  };
  recentLeads: any[];
}

interface InteractiveAnalyticsPanelProps {
  data: AnalyticsData;
}

type DateRange = '7d' | '30d' | '90d' | 'all';
type ChartType = 'line' | 'bar' | 'area';

const InteractiveAnalyticsPanel: React.FC<InteractiveAnalyticsPanelProps> = ({ data }) => {
  const translations = useTranslations();
  const t = translations.dashboard;
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [chartType, setChartType] = useState<ChartType>('area');
  const [hoveredMetric, setHoveredMetric] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, 'all': 999 };
    const days = daysMap[dateRange];

    return {
      ...data,
      visitsData: data.visitsData.slice(-days)
    };
  }, [data, dateRange]);

  // Calculate trend percentages
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, isPositive: true };
    const change = ((current - previous) / previous) * 100;
    return { value: Math.abs(change), isPositive: change >= 0 };
  };

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-dark-bg-tertiary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-bold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Export functionality
  const exportToCSV = () => {
    const csvContent = [
      [t.analyticsPanel.csvDate, t.analyticsPanel.csvVisits],
      ...filteredData.visitsData.map(d => [d.name, d.visits])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics-${dateRange}.csv`;
    link.click();
    setShowExportMenu(false);
  };

  const exportToPDF = () => {
    window.print();
    setShowExportMenu(false);
  };

  // Metric cards data
  const metrics = [
    {
      id: 'visits',
      title: t.analyticsPanel.totalVisits,
      value: data.stats.visits,
      trend: calculateTrend(data.stats.visits, data.stats.visits * 0.85),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'blue',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-800'
    },
    {
      id: 'clicks',
      title: t.analyticsPanel.ctaClicksMetric,
      value: data.stats.ctaClicks,
      trend: calculateTrend(data.stats.ctaClicks, data.stats.ctaClicks * 0.75),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      color: 'green',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-800'
    },
    {
      id: 'leads',
      title: t.analyticsPanel.leadsGenerated,
      value: data.recentLeads.length,
      trend: calculateTrend(data.recentLeads.length, data.recentLeads.length * 0.9),
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      textColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800'
    },
    {
      id: 'conversion',
      title: t.analyticsPanel.conversionRate,
      value: data.stats.visits > 0 ? ((data.stats.ctaClicks / data.stats.visits) * 100).toFixed(1) + '%' : '0.0%',
      trend: data.stats.visits > 0 && data.stats.ctaClicks > 0
        ? calculateTrend(
            (data.stats.ctaClicks / data.stats.visits) * 100,
            ((data.stats.ctaClicks * 0.9) / (data.stats.visits * 0.85)) * 100
          )
        : { value: 0, isPositive: false },
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      color: 'orange',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-800'
    }
  ];

  const renderChart = () => {
    const commonProps = {
      data: filteredData.visitsData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="visits"
              stroke="#3B82F6"
              strokeWidth={3}
              dot={{ fill: '#3B82F6', r: 4 }}
              activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2 }}
              animationDuration={1000}
            />
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar
              dataKey="visits"
              fill="#3B82F6"
              radius={[8, 8, 0, 0]}
              animationDuration={1000}
            />
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" className="dark:stroke-gray-700" />
            <XAxis dataKey="name" stroke="#6B7280" />
            <YAxis stroke="#6B7280" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#3B82F6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorVisits)"
              animationDuration={1000}
            />
          </AreaChart>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t.analyticsPanel.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t.analyticsPanel.subtitle}
          </p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {/* Date Range Selector */}
          <div className="flex bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg overflow-hidden">
            {[
              { value: '7d' as DateRange, label: t.analyticsPanel.dateRange.days7 },
              { value: '30d' as DateRange, label: t.analyticsPanel.dateRange.days30 },
              { value: '90d' as DateRange, label: t.analyticsPanel.dateRange.days90 },
              { value: 'all' as DateRange, label: t.analyticsPanel.dateRange.all }
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setDateRange(value)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  dateRange === value
                    ? 'bg-cv-blue text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export Button */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t.analyticsPanel.export}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-lg shadow-lg z-10">
                <button
                  onClick={exportToCSV}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors rounded-t-lg"
                >
                  {t.analyticsPanel.exportCSV}
                </button>
                <button
                  onClick={exportToPDF}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-bg-tertiary transition-colors rounded-b-lg"
                >
                  {t.analyticsPanel.printPDF}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            onMouseEnter={() => setHoveredMetric(metric.id)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`${metric.bgColor} border-2 ${metric.borderColor} rounded-xl p-6 transition-all duration-300 cursor-pointer ${
              hoveredMetric === metric.id ? 'transform scale-105 shadow-lg' : 'shadow'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${metric.textColor} p-3 rounded-lg bg-white dark:bg-dark-bg-tertiary`}>
                {metric.icon}
              </div>
              <div className="flex items-center gap-1 text-sm">
                {metric.trend.isPositive ? (
                  <>
                    <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      +{metric.trend.value.toFixed(1)}%
                    </span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                    <span className="text-red-600 dark:text-red-400 font-semibold">
                      -{metric.trend.value.toFixed(1)}%
                    </span>
                  </>
                )}
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{metric.title}</p>
            <p className={`text-3xl font-bold ${metric.textColor}`}>{metric.value}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">{t.analyticsPanel.lastPeriod(dateRange)}</p>
          </div>
        ))}
      </div>

      {/* Main Chart */}
      <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.analyticsPanel.visitsTrend}</h3>

          {/* Chart Type Selector */}
          <div className="flex gap-2">
            {[
              { value: 'area' as ChartType, icon: '📊', label: t.analyticsPanel.chartArea },
              { value: 'line' as ChartType, icon: '📈', label: t.analyticsPanel.chartLine },
              { value: 'bar' as ChartType, icon: '📊', label: t.analyticsPanel.chartBar }
            ].map(({ value, icon, label }) => (
              <button
                key={value}
                onClick={() => setChartType(value)}
                title={label}
                className={`p-2 rounded-lg transition-all ${
                  chartType === value
                    ? 'bg-cv-blue text-white shadow-md'
                    : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Sources */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.analyticsPanel.trafficSources}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.trafficSourcesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationDuration={1000}
              >
                {data.trafficSourcesData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="mt-4 space-y-2">
            {data.trafficSourcesData.map((source, index) => (
              <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-dark-bg-tertiary hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: source.color }}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{source.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">{source.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white dark:bg-dark-bg-secondary rounded-xl p-6 border border-gray-200 dark:border-dark-border shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t.analyticsPanel.geoDistribution}</h3>
          <div className="space-y-3">
            {data.countriesData.slice(0, 5).map((country: any, index: number) => {
              const maxVisits = Math.max(...data.countriesData.map((c: any) => c.visits));
              const percentage = (country.visits / maxVisits) * 100;

              return (
                <div
                  key={index}
                  className="group p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg-tertiary transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{country.country}</span>
                    </div>
                    <span className="text-gray-600 dark:text-gray-400 font-bold group-hover:text-cv-blue transition-colors">
                      {country.visits}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cv-blue to-blue-400 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          {data.countriesData.length > 5 && (
            <button className="w-full mt-4 py-2 text-sm text-cv-blue hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors">
              {t.analyticsPanel.viewAllCountries} ({data.countriesData.length})
            </button>
          )}
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t.analyticsPanel.realTimeActivity}</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          {t.analyticsPanel.realTimeDescription}
        </p>
      </div>
    </div>
  );
};

export default InteractiveAnalyticsPanel;
