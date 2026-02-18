import React, { useState } from 'react';
import { useTranslations } from '../hooks/useTranslations';

const AnalyticsDashboard: React.FC = () => {
    const [hoveredDay, setHoveredDay] = useState<number | null>(null);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const t = useTranslations();
    const ap = t.dashboard.analyticsPreview;

    const weekData = [
        { day: ap.days.mon, visits: 45, label: ap.days.monFull },
        { day: ap.days.tue, visits: 62, label: ap.days.tueFull },
        { day: ap.days.wed, visits: 78, label: ap.days.wedFull },
        { day: ap.days.thu, visits: 71, label: ap.days.thuFull },
        { day: ap.days.fri, visits: 95, label: ap.days.friFull },
        { day: ap.days.sat, visits: 83, label: ap.days.satFull },
        { day: ap.days.sun, visits: 112, label: ap.days.sunFull }
    ];

    const maxVisits = Math.max(...weekData.map(d => d.visits));

    return (
        <div className="w-full">
            {/* Cards with metrics - Colorful & Engaging */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                {/* Card 1 - Total Views - Blue Theme */}
                <div
                    className="bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                    onMouseEnter={() => setHoveredCard(0)}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <p className="text-xs uppercase tracking-wider text-blue-100 font-semibold mb-3">{ap.totalViews}</p>
                    <p className="text-4xl font-bold text-white mb-2">
                        1,247
                    </p>
                    <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        <span className="text-blue-100 font-semibold">+17.6% {ap.vsLastMonth}</span>
                    </div>
                </div>

                {/* Card 2 - This Week - Purple Theme */}
                <div
                    className="bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                    onMouseEnter={() => setHoveredCard(1)}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <p className="text-xs uppercase tracking-wider text-purple-100 font-semibold mb-3">{ap.thisWeek}</p>
                    <p className="text-4xl font-bold text-white mb-2">
                        +156
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-purple-100 font-semibold">{ap.last7Days}</span>
                    </div>
                </div>

                {/* Card 3 - Average Time - Indigo Theme */}
                <div
                    className="bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer"
                    onMouseEnter={() => setHoveredCard(2)}
                    onMouseLeave={() => setHoveredCard(null)}
                >
                    <p className="text-xs uppercase tracking-wider text-indigo-100 font-semibold mb-3">{ap.avgTime}</p>
                    <p className="text-4xl font-bold text-white mb-2">
                        2:34
                    </p>
                    <div className="flex items-center gap-1 text-sm">
                        <span className="text-indigo-100 font-semibold">{ap.minutesPerSession}</span>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">{ap.visitsLast7Days}</h3>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
                        <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">+23%</span>
                    </div>
                </div>

                <svg viewBox="0 0 600 220" className="w-full h-auto" style={{ maxHeight: '220px' }}>
                    {/* Gradient Definitions */}
                    <defs>
                        <linearGradient id="barGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#6366f1', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 1 }} />
                        </linearGradient>
                        <linearGradient id="barGradientHover" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#4f46e5', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#7c3aed', stopOpacity: 1 }} />
                        </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="20" y1="50" x2="580" y2="50" stroke="currentColor" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1"/>
                    <line x1="20" y1="100" x2="580" y2="100" stroke="currentColor" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1"/>
                    <line x1="20" y1="150" x2="580" y2="150" stroke="currentColor" className="stroke-gray-200 dark:stroke-gray-700" strokeWidth="1"/>

                    {/* Interactive bars for each day */}
                    {weekData.map((data, index) => {
                        const x = 40 + (index * 80);
                        const barHeight = (data.visits / maxVisits) * 130;
                        const y = 180 - barHeight;
                        const isHovered = hoveredDay === index;

                        return (
                            <g key={index}>
                                {/* Bar with gradient */}
                                <rect
                                    x={x - 20}
                                    y={y}
                                    width="40"
                                    height={barHeight}
                                    rx="6"
                                    fill={isHovered ? "url(#barGradientHover)" : "url(#barGradient)"}
                                    className="cursor-pointer transition-all duration-200"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 4px 6px rgba(99, 102, 241, 0.3))' : 'none'
                                    }}
                                    onMouseEnter={() => setHoveredDay(index)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                />

                                {/* Data point with glow */}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? "7" : "5"}
                                    fill="#6366f1"
                                    className="cursor-pointer transition-all duration-200"
                                    style={{
                                        filter: isHovered ? 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.8))' : 'drop-shadow(0 0 4px rgba(99, 102, 241, 0.4))'
                                    }}
                                    onMouseEnter={() => setHoveredDay(index)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                />

                                {/* Tooltip on hover */}
                                {isHovered && (
                                    <g>
                                        <rect
                                            x={x - 40}
                                            y={y - 50}
                                            width="80"
                                            height="38"
                                            rx="6"
                                            fill="#111827"
                                            opacity="0.96"
                                        />
                                        <text
                                            x={x}
                                            y={y - 34}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fill="#9ca3af"
                                            fontWeight="500"
                                        >
                                            {data.label}
                                        </text>
                                        <text
                                            x={x}
                                            y={y - 20}
                                            textAnchor="middle"
                                            fontSize="13"
                                            fill="white"
                                            fontWeight="600"
                                        >
                                            {data.visits} {ap.visits}
                                        </text>
                                    </g>
                                )}

                                {/* X-axis labels */}
                                <text
                                    x={x}
                                    y="205"
                                    textAnchor="middle"
                                    fontSize="11"
                                    fill={isHovered ? "#374151" : "#6b7280"}
                                    fontWeight={isHovered ? "600" : "500"}
                                >
                                    {data.day}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};

export default AnalyticsDashboard;
