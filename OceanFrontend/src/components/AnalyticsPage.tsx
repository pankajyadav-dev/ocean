import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { mentionVolumeData as defaultMentionVolumeData, topKeywords as defaultTopKeywords, highImpactPosts as defaultHighImpactPosts, sentimentData as defaultSentimentData, emergingThreatsData as defaultEmergingThreatsData, topInfluencersData as defaultTopInfluencersData } from '../constants';
import { HazardType, type User, type HazardReport } from '../types';
import { api } from '../utils/api';

interface AnalyticsPageProps {
    user: User | null;
}

const AnalyticsSidebar: React.FC<{ activePage: string; onNav: (page: string) => void }> = ({ activePage, onNav }) => {
    const navItems = [
        { name: 'Dashboard', page: 'Dashboard' },
        { name: 'Reports', page: 'Reports' },
        { name: 'Map View', page: 'Map' },
        { name: 'Social Analytics', page: 'Social Analytics' }
    ];

    return (
        <aside className="w-64 bg-slate-900/80 border-r border-slate-800 p-6 flex flex-col">
            <div className="flex items-center space-x-2 mb-10">
                <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z" /></svg>
                <span className="text-xl font-bold text-white">OceanWatch</span>
            </div>
            <nav className="flex-1 space-y-2">
                {navItems.map(item => (
                    <a href="#" key={item.name}
                        onClick={(e) => { e.preventDefault(); onNav(item.name); }}
                        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors ${activePage === item.name ? 'bg-blue-600/30 text-blue-300' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <span>{item.name}</span>
                    </a>
                ))}
            </nav>
            <div className="mt-auto">
                <button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-lg">New Report</button>
            </div>
        </aside>
    );
};

const StatCard: React.FC<{ title: string; value: string; change?: string; changeType?: 'positive' | 'negative' }> = ({ title, value, change, changeType }) => (
    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
        <p className="text-sm text-slate-400">{title}</p>
        <p className="text-3xl font-bold text-white my-2">{value}</p>
        {change && (
            <p className={`text-sm font-semibold ${changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                {change}
            </p>
        )}
    </div>
);

export const AnalyticsPage: React.FC<AnalyticsPageProps> = () => {
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('Dashboard');
    const [hazardReports, setHazardReports] = useState<HazardReport[]>([]);
    const [analyticsData, setAnalyticsData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Social media analytics state
    const [socialLoading, setSocialLoading] = useState(false);
    const [socialDataFetched, setSocialDataFetched] = useState(false);
    const [hazardsOnly, setHazardsOnly] = useState(true); // Default to hazards only
    const [mentionVolumeData, setMentionVolumeData] = useState(defaultMentionVolumeData);
    const [mentionsByPlatform, setMentionsByPlatform] = useState([{ name: 'Reddit', value: 0 }]);
    const [topKeywords, setTopKeywords] = useState(defaultTopKeywords);
    const [highImpactPosts, setHighImpactPosts] = useState(defaultHighImpactPosts);
    const [sentimentData, setSentimentData] = useState(defaultSentimentData);
    const [emergingThreatsData, setEmergingThreatsData] = useState(defaultEmergingThreatsData);
    const [topInfluencersData, setTopInfluencersData] = useState(defaultTopInfluencersData);

    const handleSidebarNav = (page: string) => {
        if (page === 'Map View') navigate('/map');
        else setActivePage(page);
    };

    // Fetch analytics data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch hazard reports
                const hazardsResponse = await api.getHazardReports({ limit: 1000 });
                const transformedReports: HazardReport[] = hazardsResponse.data.map((report: any) => ({
                    id: report._id || report.id,
                    type: report.type as HazardType,
                    location: report.location,
                    severity: report.severity,
                    description: report.description || '',
                    reportedBy: typeof report.reportedBy === 'object' ? report.reportedBy.name : report.reportedBy || 'Unknown',
                    timestamp: report.timestamp ? new Date(report.timestamp).toLocaleString() : new Date(report.createdAt).toLocaleString(),
                    imageUrl: report.imageUrl
                        ? (report.imageUrl.startsWith('http') || report.imageUrl.startsWith('/uploads')
                            ? report.imageUrl
                            : `http://localhost:3000${report.imageUrl}`)
                        : 'https://picsum.photos/seed/hazard/400/300',
                    verified: report.verified || false,
                }));
                setHazardReports(transformedReports);

                // Fetch analytics
                const analyticsResponse = await api.getAnalytics();
                setAnalyticsData(analyticsResponse.data);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load analytics');
                console.error('Error fetching analytics:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Refresh every 60 seconds
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch social media analytics when component mounts or when switching to Social Analytics page
    useEffect(() => {
        if (activePage === 'Social Analytics' && !socialDataFetched) {
            const fetchSocialData = async () => {
                try {
                    setSocialLoading(true);
                    const socialData = await api.getSocialMediaAnalytics(hazardsOnly);

                    setMentionVolumeData(socialData.mentionVolumeData);
                    setMentionsByPlatform(socialData.mentionsByPlatform);
                    setTopKeywords(socialData.topKeywords);
                    setHighImpactPosts(socialData.highImpactPosts);
                    setSentimentData(socialData.sentimentData);
                    setEmergingThreatsData(socialData.emergingThreats);
                    setTopInfluencersData(socialData.topInfluencers);
                    setSocialDataFetched(true);
                } catch (err: any) {
                    console.error('Error fetching social media analytics:', err);
                    // Keep using default data on error
                } finally {
                    setSocialLoading(false);
                }
            };

            fetchSocialData();
        }
    }, [activePage, socialDataFetched, hazardsOnly]);

    return (
        <div className="flex h-screen bg-slate-900 text-slate-300">
            <AnalyticsSidebar activePage={activePage} onNav={handleSidebarNav} />
            <main className="flex-1 p-8 overflow-y-auto" style={{ backgroundImage: "radial-gradient(circle at top right, rgba(14, 165, 233, 0.1), transparent 40%)" }}>
                {loading && (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <svg className="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p className="text-slate-400">Loading analytics...</p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {!loading && activePage === 'Dashboard' && (
                    <>
                        <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
                        <p className="text-slate-400 mb-8">Comprehensive overview of ocean hazard monitoring</p>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                            <StatCard
                                title="Total Hazards"
                                value={analyticsData?.totalReports?.toString() || hazardReports.length.toString()}
                                change={analyticsData ? `+${Math.max(0, analyticsData.totalReports - (analyticsData.totalReports * 0.9)).toFixed(0)} this week` : "+3 this week"}
                                changeType="positive"
                            />
                            <StatCard
                                title="Verified Reports"
                                value={analyticsData?.verifiedReports?.toString() || hazardReports.filter(r => r.verified).length.toString()}
                                change={analyticsData ? `${Math.round((analyticsData.verifiedReports / analyticsData.totalReports) * 100)}% verified` : `${hazardReports.length > 0 ? Math.round((hazardReports.filter(r => r.verified).length / hazardReports.length) * 100) : 0}% verified`}
                                changeType="positive"
                            />
                            <StatCard
                                title="Avg Severity"
                                value={analyticsData?.avgSeverity?.toFixed(1) || (hazardReports.length > 0 ? (hazardReports.reduce((sum, r) => sum + r.severity, 0) / hazardReports.length).toFixed(1) : '0.0')}
                                change="Moderate"
                                changeType="negative"
                            />
                            <StatCard title="Active Regions" value="12" change="Global coverage" changeType="positive" />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                <h2 className="text-xl font-semibold text-white mb-4">Hazards by Type</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={analyticsData?.reportsByType?.map((item: any) => ({
                                                    name: item._id,
                                                    value: item.count
                                                })) || Object.entries(HazardType).map(([, value]) => ({
                                                    name: value,
                                                    value: hazardReports.filter(r => r.type === value).length
                                                }))}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                outerRadius={80}
                                                label
                                            >
                                                {Object.entries(HazardType).map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#ef4444', '#f97316', '#06b6d4', '#8b5cf6'][index]} />
                                                ))}
                                            </Pie>
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                <h2 className="text-xl font-semibold text-white mb-4">Severity Distribution</h2>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={analyticsData?.severityDistribution?.map((item: any) => ({
                                            range: item._id === 'other' ? '9-10' : item._id,
                                            count: item.count
                                        })) || [
                                                { range: '1-3', count: hazardReports.filter(r => r.severity <= 3).length },
                                                { range: '4-6', count: hazardReports.filter(r => r.severity >= 4 && r.severity <= 6).length },
                                                { range: '7-8', count: hazardReports.filter(r => r.severity >= 7 && r.severity <= 8).length },
                                                { range: '9-10', count: hazardReports.filter(r => r.severity >= 9).length },
                                            ]}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                            <XAxis dataKey="range" stroke="#9ca3af" fontSize={12} />
                                            <YAxis stroke="#9ca3af" fontSize={12} />
                                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                            <Bar dataKey="count" fill="#38bdf8" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {!loading && activePage === 'Reports' && (
                    <>
                        <h1 className="text-3xl font-bold text-white mb-2">Hazard Reports</h1>
                        <p className="text-slate-400 mb-8">Detailed view of all reported ocean hazards</p>

                        <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                            {hazardReports.length === 0 ? (
                                <div className="text-center py-12 text-slate-400">
                                    <p>No hazard reports found.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-700 text-sm text-slate-400">
                                            <th className="py-2">Type</th>
                                            <th className="py-2">Location</th>
                                            <th className="py-2">Severity</th>
                                            <th className="py-2">Status</th>
                                            <th className="py-2">Reported</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {hazardReports.map((report) => (
                                            <tr key={report.id} className="border-b border-slate-800 hover:bg-slate-700/50">
                                                <td className="py-4 font-semibold text-white">{report.type}</td>
                                                <td className="py-4 text-slate-300">{report.location.lat.toFixed(2)}°, {report.location.lng.toFixed(2)}°</td>
                                                <td className="py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.severity >= 7 ? 'bg-red-500/20 text-red-300' :
                                                        report.severity >= 4 ? 'bg-yellow-500/20 text-yellow-300' :
                                                            'bg-green-500/20 text-green-300'
                                                        }`}>
                                                        {report.severity}/10
                                                    </span>
                                                </td>
                                                <td className="py-4">
                                                    {report.verified ? (
                                                        <span className="text-green-400 font-semibold">Verified</span>
                                                    ) : (
                                                        <span className="text-yellow-400 font-semibold">Pending</span>
                                                    )}
                                                </td>
                                                <td className="py-4 text-slate-400">{report.timestamp}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </>
                )}

                {!loading && activePage === 'Social Analytics' && (
                    <>
                        {socialLoading && !socialDataFetched ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <svg className="animate-spin h-12 w-12 text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <p className="text-slate-400">Fetching real-time social media data from Reddit...</p>
                                    <p className="text-sm text-slate-500 mt-2">This may take a few seconds</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h1 className="text-3xl font-bold text-white mb-2">Social Media Analytics Dashboard</h1>
                                        <p className="text-slate-400">Real-time insights from Reddit and ocean-related social media conversations {socialDataFetched && <span className="text-green-400">✓ Live Data</span>}</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* Hazards Only Toggle */}
                                        <div className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-lg">
                                            <span className="text-sm text-slate-300">Show All Ocean Content</span>
                                            <button
                                                onClick={async () => {
                                                    const newValue = !hazardsOnly;
                                                    setHazardsOnly(newValue);
                                                    setSocialDataFetched(false); // Trigger refetch
                                                    try {
                                                        setSocialLoading(true);
                                                        const socialData = await api.getSocialMediaAnalytics(newValue);
                                                        setMentionVolumeData(socialData.mentionVolumeData);
                                                        setMentionsByPlatform(socialData.mentionsByPlatform);
                                                        setTopKeywords(socialData.topKeywords);
                                                        setHighImpactPosts(socialData.highImpactPosts);
                                                        setSentimentData(socialData.sentimentData);
                                                        setEmergingThreatsData(socialData.emergingThreats);
                                                        setTopInfluencersData(socialData.topInfluencers);
                                                        setSocialDataFetched(true);
                                                    } catch (err) {
                                                        console.error('Error toggling filter:', err);
                                                    } finally {
                                                        setSocialLoading(false);
                                                    }
                                                }}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hazardsOnly ? 'bg-red-500' : 'bg-blue-500'
                                                    }`}
                                            >
                                                <span
                                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hazardsOnly ? 'translate-x-6' : 'translate-x-1'
                                                        }`}
                                                />
                                            </button>
                                            <span className="text-sm font-semibold text-slate-300">Hazards Only</span>
                                        </div>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    setSocialLoading(true);
                                                    const socialData = await api.getSocialMediaAnalytics(hazardsOnly);
                                                    setMentionVolumeData(socialData.mentionVolumeData);
                                                    setMentionsByPlatform(socialData.mentionsByPlatform);
                                                    setTopKeywords(socialData.topKeywords);
                                                    setHighImpactPosts(socialData.highImpactPosts);
                                                    setSentimentData(socialData.sentimentData);
                                                    setEmergingThreatsData(socialData.emergingThreats);
                                                    setTopInfluencersData(socialData.topInfluencers);
                                                } catch (err) {
                                                    console.error('Error refreshing social data:', err);
                                                } finally {
                                                    setSocialLoading(false);
                                                }
                                            }}
                                            disabled={socialLoading}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {socialLoading ? 'Refreshing...' : 'Refresh Data'}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                                    <StatCard
                                        title="Total Mentions (30d)"
                                        value={mentionVolumeData.reduce((sum, week) => sum + week.mentions, 0).toLocaleString()}
                                        change={`Week 4: ${mentionVolumeData[3]?.mentions || 0} mentions`}
                                        changeType="positive"
                                    />
                                    <StatCard
                                        title="Overall Sentiment"
                                        value={sentimentData.reduce((max, s) => s.value > max.value ? s : max, sentimentData[0])?.name || 'Neutral'}
                                        change={`${sentimentData.find(s => s.name === 'Negative')?.value || 0}% Negative`}
                                        changeType={(sentimentData.find(s => s.name === 'Negative')?.value || 0) > 50 ? 'negative' : 'positive'}
                                    />
                                    <StatCard
                                        title="Top Platform"
                                        value={mentionsByPlatform.reduce((max, p) => p.value > max.value ? p : max, mentionsByPlatform[0])?.name || 'Reddit'}
                                        change={`${Math.round((mentionsByPlatform.reduce((max, p) => p.value > max.value ? p : max, mentionsByPlatform[0])?.value || 0) / mentionsByPlatform.reduce((sum, p) => sum + p.value, 0) * 100)}% of mentions`}
                                        changeType="positive"
                                    />
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    {/* Mention Volume */}
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                        <h2 className="text-xl font-semibold text-white mb-4">Mention Volume Over Time</h2>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={mentionVolumeData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                                    <YAxis stroke="#9ca3af" fontSize={12} />
                                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                                    <Line type="monotone" dataKey="mentions" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Sentiment Analysis */}
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                        <div className="flex items-center justify-between mb-4">
                                            <h2 className="text-xl font-semibold text-white">Sentiment Analysis</h2>
                                            <div className="group relative">
                                                <svg className="w-5 h-5 text-slate-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="absolute right-0 w-64 p-3 bg-slate-700 text-slate-200 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                                    Analyzed using AFINN-based sentiment analysis library.
                                                    Scores posts as positive, negative, or neutral based on emotional tone and word choice in Reddit titles and content.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} labelLine={false}>
                                                        {sentimentData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="flex justify-center space-x-4 mt-4 text-sm">
                                            {sentimentData.map(entry => (
                                                <div key={entry.name} className="flex items-center space-x-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></span>
                                                    <span>{entry.name} ({entry.value}%)</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                    {/* Emerging Threats */}
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                        <h2 className="text-xl font-semibold text-white mb-4">Emerging Threats</h2>
                                        <div className="space-y-4">
                                            {emergingThreatsData.map((threat) => (
                                                <div key={threat.term} className="border-l-4 border-yellow-400 pl-4">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-semibold text-white">{threat.term}</span>
                                                        <span className="text-sm font-bold text-yellow-400">{threat.growth}</span>
                                                    </div>
                                                    <p className="text-sm text-slate-400">{threat.description}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    {/* Top Keywords */}
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                        <h2 className="text-xl font-semibold text-white mb-4">Top Hazard Keywords</h2>
                                        <div className="flex flex-wrap gap-3">
                                            {topKeywords.map(keyword => (
                                                <span key={keyword} className="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full text-sm font-medium">{keyword}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl lg:col-span-1">
                                        <h2 className="text-xl font-semibold text-white mb-4">Top Contributors</h2>
                                        <div className="space-y-4">
                                            {topInfluencersData.map(influencer => (
                                                <div key={influencer.handle} className="flex items-center space-x-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                        {influencer.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-white">{influencer.name}</p>
                                                        <p className="text-sm text-slate-400">{influencer.handle} &middot; {influencer.followers} followers</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl lg:col-span-2">
                                        <h2 className="text-xl font-semibold text-white mb-4">High Impact Posts</h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {highImpactPosts.slice(0, 4).map((post, index) => (
                                                <a
                                                    key={index}
                                                    href={post.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="relative aspect-video group cursor-pointer"
                                                >
                                                    <img
                                                        src={post.imageUrl}
                                                        alt={post.text}
                                                        className="w-full h-full object-cover rounded-lg"
                                                        onError={(e) => {
                                                            // Fallback if image fails to load
                                                            (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/' + index + '/400/300';
                                                        }}
                                                    />
                                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                                        <p className="text-white text-xs line-clamp-2">{post.text}</p>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>


                                {/* Recent High-Impact Posts */}
                                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl">
                                    <h2 className="text-xl font-semibold text-white mb-4">Recent High-Impact Posts</h2>
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b border-slate-700 text-sm text-slate-400">
                                                <th className="py-2">Source</th>
                                                <th className="py-2">Post Snippet</th>
                                                <th className="py-2 text-right">Engagement</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {highImpactPosts.map((post, index) => (
                                                <tr key={index} className="border-b border-slate-800 hover:bg-slate-700/50">
                                                    <td className="py-4 font-semibold text-white">{post.platform}</td>
                                                    <td className="py-4 text-slate-300">
                                                        {post.url ? (
                                                            <a href={post.url} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 transition-colors">
                                                                {post.text}
                                                            </a>
                                                        ) : (
                                                            post.text
                                                        )}
                                                    </td>
                                                    <td className="py-4 text-right font-bold text-white">{post.engagement}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};