
import React, { useEffect, useState } from 'react';
import { Page, type User } from '../types';
import { api } from '../utils/api';

interface HomePageProps {
  onNavigate: (page: Page) => void;
  user: User | null;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, user, onLogout }) => {
  const [stats, setStats] = useState({
    totalHazards: 0,
    verifiedReports: 0,
    avgSeverity: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const analytics = await api.getAnalytics();
        if (analytics.data) {
          setStats({
            totalHazards: analytics.data.totalReports || 0,
            verifiedReports: analytics.data.verifiedReports || 0,
            avgSeverity: analytics.data.avgSeverity || 0,
          });
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    fetchStats();
    // Refresh every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const featureList = [
    { title: 'Hazard Reported', description: 'Anomalies or direct threat is identified and submitted to the OceanGuard system by a community member or automated drone.' },
    { title: 'Data Aggregated', description: 'Our system gathers and cross-references the report with satellite imagery, historical data, and other relevant sources.' },
    { title: 'AI Analysis', description: 'Leading machine learning models analyze the aggregated data to predict the hazard\'s trajectory, potential impact, and identify potential hotspots.' },
    { title: 'Insights Delivered', description: 'Actionable insights and alerts are delivered to conservation groups, government agencies, and the public.' },
  ];

  const approachList = [
    { title: 'Monitor', description: 'Utilize real-time satellite data and community reports to maintain a constant watch over the world\'s oceans, identifying threats as they emerge.' },
    { title: 'Predict', description: 'Leverage predictive AI to analyze patterns and forecast the trajectory of identified hazards, enabling preemptive action and mitigation strategies.' },
    { title: 'Respond', description: 'Deliver critical, time-sensitive intelligence to a global network of partners, empowering a coordinated and rapid response to protect marine ecosystems.' },
  ];

  const avatars = Array.from({ length: 14 }, (_, i) => `https://picsum.photos/seed/avatar${i}/64/64`);

  return (
    <div className="bg-slate-900 text-slate-300">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-slate-900/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
             <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z"/></svg>
            <span className="text-xl font-bold text-white">OceanGuard</span>
          </div>
          <nav className="hidden md:flex items-center space-x-8 text-sm">
            <a href="#" className="hover:text-white">Features</a>
            <a href="#" className="hover:text-white">Community</a>
            <a href="#" className="hover:text-white">About</a>
            <a href="#" className="hover:text-white">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'admin' && (
                  <a href="/admin" className="text-sm text-blue-400 hover:text-blue-300 font-medium">Admin Panel</a>
                )}
                <button onClick={() => onNavigate(Page.PROFILE)} className="text-sm text-slate-300 hover:text-white">Profile</button>
                <span className="text-sm text-slate-300">Welcome, {user.name}</span>
                <button onClick={onLogout} className="text-sm bg-red-600 hover:bg-red-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => onNavigate(Page.SIGNUP)} className="text-sm bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg transition-colors">Sign Up</button>
                <button onClick={() => onNavigate(Page.LOGIN)} className="text-sm text-slate-300 hover:text-white">Login</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center bg-cover bg-center" style={{ backgroundImage: "url('https://picsum.photos/seed/oceanbg/1920/1080')" }}>
        <div className="bg-black/50 absolute inset-0"></div>
        <div className="relative z-10 text-center text-white p-4">
          <h1 className="text-5xl md:text-7xl font-bold mb-4">Decoding the Oceans</h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-8">From Data To Discovery</p>
          <button onClick={() => onNavigate(Page.MAP)} className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-lg flex items-center mx-auto space-x-2 backdrop-blur-sm">
            <span>Dive In</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L6.293 9.293a1 1 0 10-1.414 1.414l4 4a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" /></svg>
          </button>
        </div>
      </section>

      {/* Clarity from Complexity Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-12">Clarity from Complexity</h2>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="md:w-1/2 text-left space-y-8">
              {featureList.map((feature, index) => (
                <div key={index} className="flex items-start space-x-4">
                   <div className="flex-shrink-0 bg-slate-800 rounded-full p-3 text-blue-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="md:w-1/2 space-y-4">
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg text-left">
                    <p className="text-sm text-slate-400">Total Hazards</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.totalHazards}</p>
                    <p className="text-sm text-green-400">Active reports</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg text-left">
                    <p className="text-sm text-slate-400">Verified Reports</p>
                    <p className="text-3xl font-bold text-green-400">{stats.verifiedReports}</p>
                    <p className="text-sm text-blue-400">{stats.totalHazards > 0 ? Math.round((stats.verifiedReports / stats.totalHazards) * 100) : 0}% verified</p>
                </div>
                <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-lg text-left">
                    <p className="text-sm text-slate-400">Average Severity</p>
                    <p className="text-3xl font-bold text-red-400">{stats.avgSeverity.toFixed(1)}</p>
                    <p className="text-sm text-slate-400">Out of 10</p>
                </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Quick Access Section */}
      <section className="py-20 bg-slate-900">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-white mb-12 text-center">Explore OceanGuard</h2>
          <div className="grid md:grid-cols-4 gap-6">
            <button 
              onClick={() => onNavigate(Page.MAP)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-8 rounded-xl text-center transition group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🗺️</div>
              <h3 className="text-xl font-bold text-white mb-2">Live Map</h3>
              <p className="text-slate-400 text-sm">View and report hazards in real-time</p>
            </button>

            <button 
              onClick={() => onNavigate(Page.NEWS)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-8 rounded-xl text-center transition group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition">📰</div>
              <h3 className="text-xl font-bold text-white mb-2">News Feed</h3>
              <p className="text-slate-400 text-sm">Latest ocean conservation news</p>
            </button>

            <button 
              onClick={() => onNavigate(Page.ANALYTICS)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-8 rounded-xl text-center transition group"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition">📊</div>
              <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
              <p className="text-slate-400 text-sm">Social media insights & trends</p>
            </button>

            <button 
              onClick={() => onNavigate(Page.GOVERNMENT_ALERTS)}
              className="bg-linear-to-br from-red-900/50 to-orange-900/50 hover:from-red-800/60 hover:to-orange-800/60 border-2 border-red-500/50 p-8 rounded-xl text-center transition group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </span>
              </div>
              <div className="text-5xl mb-4 group-hover:scale-110 transition">🚨</div>
              <h3 className="text-xl font-bold text-white mb-2">Gov. Alerts</h3>
              <p className="text-slate-300 text-sm">Official NOAA & USGS warnings</p>
            </button>
          </div>
        </div>
      </section>

      {/* Proactive Approach Section */}
      <section className="py-20 bg-slate-800/50">
        <div className="container mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold text-white mb-12">Our Proactive Approach</h2>
            <div className="grid md:grid-cols-3 gap-8">
                {approachList.map((item, index) => (
                    <div key={index} className="bg-slate-800 p-8 rounded-lg border border-slate-700 text-center">
                         <div className="mx-auto bg-slate-700 rounded-full p-4 w-16 h-16 mb-6 text-blue-400">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <h3 className="text-2xl font-semibold text-white mb-4">{item.title}</h3>
                        <p>{item.description}</p>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Community Section */}
       <section className="py-20">
        <div className="container mx-auto px-6 text-center">
             <h2 className="text-4xl font-bold text-white mb-6">Forging a Future for Our Oceans</h2>
            <p className="max-w-3xl mx-auto mb-12">Powered by a global community of scientists, sailors, and citizens. Each report, each data point, contributes to a safer, cleaner ocean. Thanks to our tireless partners and volunteers.</p>
            <div className="flex justify-center flex-wrap gap-4">
                {avatars.map((avatar, index) => (
                    <img key={index} src={avatar} alt={`Community member ${index + 1}`} className="w-16 h-16 rounded-full border-2 border-slate-700"/>
                ))}
            </div>
        </div>
       </section>
       
      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
            <div className="bg-blue-600/80 rounded-lg text-center p-12">
                <h2 className="text-4xl font-bold text-white mb-4">Powering Preservation</h2>
                <p className="text-blue-100 max-w-2xl mx-auto mb-8">Your contribution fuels critical conservation efforts. By joining our community, you're not just a user; you're a guardian of the ocean. Join today and help us safeguard our oceans for generations to come.</p>
                <button className="bg-white text-blue-600 font-bold px-8 py-3 rounded-lg hover:bg-slate-200 transition-colors">Join the Movement</button>
            </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 py-8">
        <div className="container mx-auto px-6 text-center text-slate-400 text-sm">
            <p>&copy; 2024 OceanGuard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
