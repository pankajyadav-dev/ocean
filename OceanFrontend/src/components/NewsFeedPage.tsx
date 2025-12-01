
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User, type NewsArticle } from '../types';
import { api } from '../utils/api';

interface NewsFeedPageProps {
    user: User | null;
}

const NewsCard: React.FC<{ article: NewsArticle }> = ({ article }) => {
    const getVerificationBadge = () => {
        if (article.source === 'rss-feed') {
            return (
                <span className="bg-purple-600/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    External News
                </span>
            );
        }

        switch (article.verificationStatus) {
            case 'admin-verified':
                return (
                    <span className="bg-green-600/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Admin Verified
                    </span>
                );
            case 'ai-verified':
                return (
                    <span className="bg-blue-600/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13 7H7v6h6V7z" />
                            <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd" />
                        </svg>
                        AI Verified
                    </span>
                );
            default:
                return (
                    <span className="bg-yellow-600/90 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Unverified
                    </span>
                );
        }
    };

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden group hover:border-blue-500/50 transition-all">
            <div className="relative">
                <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                        e.currentTarget.src = 'https://picsum.photos/seed/news/400/300';
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-2 right-2 flex gap-2 flex-wrap justify-end">
                    {getVerificationBadge()}
                    <span className="bg-slate-800/90 text-white text-xs font-semibold px-2 py-1 rounded-full">
                        {article.category}
                    </span>
                </div>
                <div className="absolute bottom-0 left-0 p-4">
                    <h3 className="text-xl font-bold text-white">{article.title}</h3>
                    <p className="text-xs text-slate-300 mt-1">{article.date}</p>
                </div>
            </div>
            <div className="p-4">
                <p className="text-slate-300 text-sm">{article.summary}</p>
                {article.sourceUrl && (
                    <a
                        href={article.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-xs mt-2 inline-flex items-center gap-1"
                    >
                        Read full article
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                        </svg>
                    </a>
                )}
            </div>
        </div>
    );
};

export const NewsFeedPage: React.FC<NewsFeedPageProps> = () => {
    const navigate = useNavigate();
    const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [hazardTypeFilter, setHazardTypeFilter] = useState<string>('all');
    const [sourceFilter, setSourceFilter] = useState<string>('all');
    const [verificationFilter, setVerificationFilter] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('latest-reports');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [syncing, setSyncing] = useState(false);
    const articlesPerPage = 8;

    // Fetch news articles from backend
    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const category = hazardTypeFilter !== 'all' ? hazardTypeFilter : undefined;
                const source = sourceFilter !== 'all' ? sourceFilter : undefined;
                const verificationStatus = verificationFilter !== 'all' ? verificationFilter : undefined;
                const response = await api.getNewsArticles({
                    category,
                    source,
                    verificationStatus,
                    limit: 100,
                    sortBy
                });
                // Transform backend data
                const transformedArticles: NewsArticle[] = response.data.map((article: any) => {
                    // Handle image URL - if it's a relative path, make it absolute
                    let imageUrl = article.imageUrl;
                    if (imageUrl && !imageUrl.startsWith('http') && imageUrl.startsWith('/uploads')) {
                        imageUrl = `http://localhost:3000${imageUrl}`;
                    }

                    return {
                        id: article._id || article.id,
                        title: article.title,
                        summary: article.summary,
                        imageUrl: imageUrl || 'https://picsum.photos/seed/news/400/300',
                        category: article.category,
                        date: article.date ? new Date(article.date).toISOString().split('T')[0] : new Date(article.createdAt).toISOString().split('T')[0],
                        source: article.source || 'hazard-report',
                        verificationStatus: article.verificationStatus,
                        sourceUrl: article.sourceUrl,
                        hazardReportId: article.hazardReportId || null,
                    };
                });
                setNewsArticles(transformedArticles);
                setError(null);
            } catch (err: any) {
                setError(err.message || 'Failed to load news articles');
                console.error('Error fetching news:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
        // Poll for updates every 60 seconds
        const interval = setInterval(fetchNews, 60000);
        return () => clearInterval(interval);
    }, [hazardTypeFilter, sourceFilter, verificationFilter, sortBy]);

    const handleSyncRSS = async () => {
        setSyncing(true);
        try {
            await api.syncRSSFeeds();
            // Refresh the news list
            window.location.reload();
        } catch (err: any) {
            console.error('Failed to sync RSS feeds:', err);
        } finally {
            setSyncing(false);
        }
    };

    // Filter articles by date
    const filteredArticles = newsArticles;

    const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);
    const displayedArticles = filteredArticles.slice((currentPage - 1) * articlesPerPage, currentPage * articlesPerPage);

    const handlePageChange = (page: number) => {
        if (page > 0 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleFilterChange = () => {
        setCurrentPage(1); // Reset to first page when filters change
    };

    // Get unique categories
    const categories = newsArticles.length > 0
        ? ['all', ...Array.from(new Set(newsArticles.map(a => a.category)))]
        : ['all', 'Oil Spill', 'Debris', 'Pollution', 'Climate', 'Weather', 'Geological', 'Other'];

    return (
        <div className="min-h-screen bg-slate-900" style={{ backgroundImage: "url('https://picsum.photos/seed/newsbg/1920/1080')", backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
            <div className="bg-slate-900/80 backdrop-blur-sm min-h-screen">
                {/* Header */}
                <header className="py-4">
                    <div className="container mx-auto px-6 flex justify-between items-center">
                        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                            <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z" /></svg>
                            <span className="text-xl font-bold text-white">Ocean Hazards</span>
                        </div>
                        <nav className="flex items-center space-x-6 text-sm">
                            <a href="#" onClick={(e) => { e.preventDefault(); navigate('/map') }} className="text-slate-300 hover:text-white">Map</a>
                            <a href="#" className="text-slate-300 hover:text-white">Reports</a>
                            <a href="#" className="text-white font-semibold">News</a>
                        </nav>
                        <div className="flex items-center space-x-4">
                            <button className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors text-white">Login</button>
                            <img src="https://picsum.photos/seed/user/40/40" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-600" />
                        </div>
                    </div>
                </header>

                <main className="container mx-auto px-6 py-12">
                    <div className="text-center mb-12">
                        <h1 className="text-5xl font-bold text-white">Ocean Hazard News Feed</h1>
                        <p className="text-lg text-slate-300 mt-2">The latest updates on marine environmental dangers and events.</p>
                    </div>

                    {loading && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center space-x-2 text-blue-400">
                                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                <span>Loading news articles...</span>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-4">
                            {error}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="mb-8 bg-slate-800/60 p-6 rounded-xl border border-slate-700">
                        {/* Source Tabs */}
                        <div className="flex gap-2 mb-6 border-b border-slate-600 pb-4">
                            <button
                                onClick={() => { setSourceFilter('all'); handleFilterChange(); }}
                                className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${sourceFilter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                All News ({newsArticles.length})
                            </button>
                            <button
                                onClick={() => { setSourceFilter('hazard-report'); handleFilterChange(); }}
                                className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${sourceFilter === 'hazard-report'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                Hazard Reports ({newsArticles.filter(a => a.source === 'hazard-report').length})
                            </button>
                            <button
                                onClick={() => { setSourceFilter('rss-feed'); handleFilterChange(); }}
                                className={`px-6 py-2 rounded-t-lg font-semibold transition-colors ${sourceFilter === 'rss-feed'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                    }`}
                            >
                                External News ({newsArticles.filter(a => a.source === 'rss-feed').length})
                            </button>
                        </div>

                        {/* Filters Row */}
                        <div className="flex flex-wrap gap-4 items-center">
                            <select
                                value={hazardTypeFilter}
                                onChange={(e) => { setHazardTypeFilter(e.target.value); handleFilterChange(); }}
                                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Categories</option>
                                {categories.filter(c => c !== 'all').map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>

                            <select
                                value={verificationFilter}
                                onChange={(e) => { setVerificationFilter(e.target.value); handleFilterChange(); }}
                                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Verification Status</option>
                                <option value="admin-verified">Admin Verified</option>
                                <option value="ai-verified">AI Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => { setSortBy(e.target.value); handleFilterChange(); }}
                                className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="date-desc">Latest First</option>
                                <option value="date-asc">Oldest First</option>
                            </select>

                            <button
                                onClick={handleSyncRSS}
                                disabled={syncing}
                                className="ml-auto px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg font-semibold transition-colors text-white flex items-center gap-2"
                            >
                                {syncing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Syncing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                                        </svg>
                                        Sync RSS Feeds
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Results count */}
                    {!loading && filteredArticles.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-slate-400 text-lg">No articles found matching your filters.</p>
                        </div>
                    ) : !loading && (
                        <>
                            <div className="text-center mb-4 text-slate-400">
                                Showing {displayedArticles.length} of {filteredArticles.length} articles
                            </div>
                            {/* News Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {displayedArticles.map(article => (
                                    <NewsCard
                                        key={article.id}
                                        article={article}
                                    />
                                ))}
                            </div>
                        </>
                    )}

                    {/* Pagination */}
                    <div className="flex justify-center items-center mt-12 space-x-2">
                        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="px-4 py-2 bg-slate-700 rounded-md disabled:opacity-50">←</button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button key={i} onClick={() => handlePageChange(i + 1)} className={`px-4 py-2 rounded-md ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-slate-700'}`}>{i + 1}</button>
                        ))}
                        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="px-4 py-2 bg-slate-700 rounded-md disabled:opacity-50">→</button>
                    </div>
                </main>
            </div>
        </div>
    );
};
