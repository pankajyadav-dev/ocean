import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type User } from '../types';
import { api } from '../utils/api';

interface ProfilePageProps {
  user: User | null;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    avgSeverity: 0,
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await api.getUserProfile();
        setUserReports(response.reports);
        setStats(response.stats);
      } catch (err: any) {
        console.error('Error fetching user profile:', err);
        // Fallback: try to get reports directly
        try {
          const response = await api.getHazardReports({ limit: 100, userId: user.id });
          setUserReports(response.data);
          const total = response.data.length;
          const verified = response.data.filter((r: any) => r.verified).length;
          const avgSev = response.data.length > 0
            ? response.data.reduce((sum: number, r: any) => sum + r.severity, 0) / response.data.length
            : 0;
          setStats({
            totalReports: total,
            verifiedReports: verified,
            avgSeverity: avgSev,
          });
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please login to view your profile</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-300">
      <header className="bg-slate-800/50 border-b border-slate-700 p-6">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <svg className="w-8 h-8 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z" />
            </svg>
            <span className="text-xl font-bold text-white">OceanGuard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => navigate('/')} className="text-slate-300 hover:text-white">
              Home
            </button>
            <button onClick={onLogout} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 mb-8">
            <div className="flex items-center space-x-6 mb-6">
              <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center text-3xl font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
                <p className="text-slate-400">{user.email}</p>
                {user.createdAt && (
                  <p className="text-sm text-slate-500 mt-1">
                    Member since {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-white">{stats.totalReports}</p>
                <p className="text-slate-400 text-sm mt-1">Total Reports</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-green-400">{stats.verifiedReports}</p>
                <p className="text-slate-400 text-sm mt-1">Verified</p>
              </div>
              <div className="bg-slate-700/50 rounded-lg p-4 text-center">
                <p className="text-3xl font-bold text-yellow-400">{stats.avgSeverity.toFixed(1)}</p>
                <p className="text-slate-400 text-sm mt-1">Avg Severity</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">My Reports</h2>
            {loading ? (
              <div className="text-center py-12">
                <svg className="animate-spin h-8 w-8 text-blue-400 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : userReports.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>You haven't submitted any reports yet.</p>
                <button
                  onClick={() => navigate('/map')}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg"
                >
                  Report Your First Hazard
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {userReports.map((report: any) => (
                  <div key={report._id || report.id} className="bg-slate-700/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="text-lg font-semibold text-white">{report.type}</span>
                        {report.verified && (
                          <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded-full">Verified</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-400">
                        {report.location.lat.toFixed(4)}°, {report.location.lng.toFixed(4)}° •
                        Severity: {report.severity}/10
                      </p>
                      {report.description && (
                        <p className="text-slate-300 text-sm mt-2">{report.description}</p>
                      )}
                    </div>
                    <div className="text-right text-sm text-slate-400">
                      {new Date(report.createdAt || report.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

