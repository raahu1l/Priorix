import { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = 'http://localhost:3001/api';

function AnalyticsPage() {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch(`${API_BASE}/analytics`);
            const data = await res.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="empty-state">
                <div className="loading-spinner"></div>
                <p>Loading analytics...</p>
            </div>
        );
    }

    if (!analytics || analytics.totals?.total === 0) {
        return (
            <>
                <div className="page-header">
                    <h2 className="page-title">Analytics</h2>
                    <p className="page-subtitle">Insights to help prioritization decisions</p>
                </div>
                <div className="empty-state glass-solid" style={{ padding: '60px', borderRadius: '24px' }}>
                    <div className="empty-state-icon">📊</div>
                    <p>No feedback data available</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                        Import some feedback data to see analytics
                    </p>
                </div>
            </>
        );
    }

    // Prepare category trend data for chart
    const categoryTrendData = {};
    analytics.categoryTrends?.forEach(item => {
        if (!categoryTrendData[item.date]) {
            categoryTrendData[item.date] = { date: item.date };
        }
        categoryTrendData[item.date][item.category] = item.count;
    });
    const categoryTrendArray = Object.values(categoryTrendData);

    // Prepare resolution velocity data
    const velocityData = analytics.resolutionVelocity?.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        resolved: item.resolved
    })) || [];

    // Fill in missing dates for velocity
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = velocityData.find(d => d.date === dateStr);
        last7Days.push(existing || { date: dateStr, resolved: 0 });
    }

    return (
        <>
            <div className="page-header">
                <h2 className="page-title">Analytics</h2>
                <p className="page-subtitle">Read-only insights derived from feedback data to help prioritization decisions</p>
            </div>

            <div className="analytics-grid">
                {/* Summary Stats */}
                <div className="analytics-card glass-solid">
                    <h3 className="analytics-card-title">Feedback Summary</h3>
                    <div className="stat-row">
                        <span className="stat-label">Total Feedback</span>
                        <span className="stat-value">{analytics.totals?.total || 0}</span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Pending</span>
                        <span className="stat-value" style={{ color: 'var(--status-pending)' }}>
                            {analytics.totals?.pending || 0}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">In Progress</span>
                        <span className="stat-value" style={{ color: 'var(--status-in-progress)' }}>
                            {analytics.totals?.in_progress || 0}
                        </span>
                    </div>
                    <div className="stat-row">
                        <span className="stat-label">Resolved</span>
                        <span className="stat-value" style={{ color: 'var(--status-resolved)' }}>
                            {analytics.totals?.resolved || 0}
                        </span>
                    </div>
                </div>

                {/* Priority Distribution */}
                <div className="analytics-card glass-solid">
                    <h3 className="analytics-card-title">Priority Distribution</h3>
                    {analytics.priorityDistribution?.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.priorityDistribution} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                    <XAxis type="number" stroke="var(--text-muted)" fontSize={12} />
                                    <YAxis
                                        type="category"
                                        dataKey="priority_range"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        width={100}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(255,255,255,0.95)',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '8px'
                                        }}
                                    />
                                    <Bar
                                        dataKey="count"
                                        fill="url(#priorityGradient)"
                                        radius={[0, 4, 4, 0]}
                                    />
                                    <defs>
                                        <linearGradient id="priorityGradient" x1="0" y1="0" x2="1" y2="0">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#60a5fa" />
                                        </linearGradient>
                                    </defs>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
                            No priority data available
                        </p>
                    )}
                </div>

                {/* Category Distribution */}
                <div className="analytics-card glass-solid">
                    <h3 className="analytics-card-title">Category Breakdown</h3>
                    {analytics.categoryDistribution?.map(cat => {
                        const total = analytics.totals?.total || 1;
                        const percentage = Math.round((cat.count / total) * 100);
                        const categoryColors = {
                            'System Failure': 'var(--category-system-failure)',
                            'Bug': 'var(--category-bug)',
                            'UI': 'var(--category-ui)',
                            'Feature': 'var(--category-feature)'
                        };
                        return (
                            <div key={cat.category} style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span className="stat-label">{cat.category}</span>
                                    <span className="stat-value">{cat.count} ({percentage}%)</span>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'rgba(0,0,0,0.1)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        height: '100%',
                                        width: `${percentage}%`,
                                        background: categoryColors[cat.category] || 'var(--accent-primary)',
                                        borderRadius: '4px',
                                        transition: 'width 0.5s ease'
                                    }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Resolution Velocity */}
                <div className="analytics-card glass-solid">
                    <h3 className="analytics-card-title">Resolution Velocity (Last 7 Days)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={last7Days}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{
                                        background: 'rgba(255,255,255,0.95)',
                                        border: '1px solid rgba(0,0,0,0.1)',
                                        borderRadius: '8px'
                                    }}
                                />
                                <defs>
                                    <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="100%" stopColor="#10b981" stopOpacity={0.05} />
                                    </linearGradient>
                                </defs>
                                <Area
                                    type="monotone"
                                    dataKey="resolved"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fill="url(#velocityGradient)"
                                    name="Items Resolved"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Category Trends Over Time */}
                <div className="analytics-card glass-solid" style={{ gridColumn: 'span 2' }}>
                    <h3 className="analytics-card-title">Category Trend Spikes (Last 7 Days)</h3>
                    {categoryTrendArray.length > 0 ? (
                        <div className="chart-container" style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={categoryTrendArray}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                                    <XAxis
                                        dataKey="date"
                                        stroke="var(--text-muted)"
                                        fontSize={12}
                                        tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    />
                                    <YAxis stroke="var(--text-muted)" fontSize={12} allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            background: 'rgba(255,255,255,0.95)',
                                            border: '1px solid rgba(0,0,0,0.1)',
                                            borderRadius: '8px'
                                        }}
                                        labelFormatter={(val) => new Date(val).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                    />
                                    <Legend />
                                    <Line
                                        type="monotone"
                                        dataKey="System Failure"
                                        stroke="var(--category-system-failure)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Bug"
                                        stroke="var(--category-bug)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="UI"
                                        stroke="var(--category-ui)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Feature"
                                        stroke="var(--category-feature)"
                                        strokeWidth={2}
                                        dot={{ r: 4 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '60px' }}>
                            Trend data will appear as feedback is added over time
                        </p>
                    )}
                </div>
            </div>
        </>
    );
}

export default AnalyticsPage;
