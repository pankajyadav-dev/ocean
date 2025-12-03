import React, { useState, useEffect } from 'react';
import { Page, type User } from '../types';
import { api } from '../utils/api';
import { useGeolocation } from '../hooks/useGeolocation';

interface ProfilePageProps {
  onNavigate: (page: Page) => void;
  user: User | null;
  onLogout: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onNavigate, user, onLogout }) => {
  const [userReports, setUserReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalReports: 0,
    verifiedReports: 0,
    avgSeverity: 0,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    location: { coordinates: [0, 0] as number[] }
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { latitude, longitude, requestLocation, loading: locationLoading, error: locationError } = useGeolocation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await api.getUserProfile();
        setUserReports(response.reports);
        setStats(response.stats);
        
        // Initialize edit form with user data
        setEditForm({
          name: response.user.name || '',
          email: response.user.email || '',
          phone: response.user.phone || '',
          location: response.user.location?.coordinates 
            ? { coordinates: response.user.location.coordinates }
            : { coordinates: [0, 0] }
        });
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

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setMessage(null);
  };

  const handleUseCurrentLocation = async () => {
    if (latitude !== null && longitude !== null) {
      setEditForm(prev => ({
        ...prev,
        location: { coordinates: [longitude, latitude] }
      }));
      setMessage({ type: 'success', text: 'Location updated from your current position' });
    } else {
      setMessage({ type: 'info', text: 'Requesting location...' });
      await requestLocation();
    }
  };

  // Update location when coordinates are received
  useEffect(() => {
    if (latitude !== null && longitude !== null && isEditing) {
      setEditForm(prev => ({
        ...prev,
        location: { coordinates: [longitude, latitude] }
      }));
      setMessage({ type: 'success', text: 'Location updated successfully!' });
    }
    if (locationError && isEditing) {
      setMessage({ type: 'error', text: locationError });
    }
  }, [latitude, longitude, locationError, isEditing]);

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setMessage(null);

      const updateData: any = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone || '',
      };

      // Only include location if coordinates are not [0, 0]
      if (editForm.location?.coordinates && 
          (editForm.location.coordinates[0] !== 0 || editForm.location.coordinates[1] !== 0)) {
        updateData.location = {
          type: 'Point',
          coordinates: editForm.location.coordinates
        };
      }

      await api.updateUserProfile(updateData);
      
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
      
      // Refresh profile data
      const response = await api.getUserProfile();
      setEditForm({
        name: response.user.name || '',
        email: response.user.email || '',
        phone: response.user.phone || '',
        location: response.user.location?.coordinates 
          ? { coordinates: response.user.location.coordinates }
          : { coordinates: [0, 0] }
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaveLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Please login to view your profile</p>
          <button
            onClick={() => onNavigate(Page.LOGIN)}
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
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z"/>
            </svg>
            <span className="text-xl font-bold text-white">OceanGuard</span>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate(Page.HOME)} className="text-slate-300 hover:text-white">
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-6">
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
              <button
                onClick={handleEditToggle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {message && (
              <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                {message.text}
              </div>
            )}

            {isEditing ? (
              <div className="space-y-4 mt-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Phone Number <span className="text-slate-500">(Optional - for WhatsApp alerts)</span>
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1234567890"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Include country code (e.g., +1 for US). Required for WhatsApp notifications.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Location <span className="text-slate-500">(Optional - for proximity alerts)</span>
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={editForm.location?.coordinates?.[1] || ''}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        location: { coordinates: [prev.location?.coordinates?.[0] || 0, parseFloat(e.target.value) || 0] }
                      }))}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Latitude"
                    />
                    <input
                      type="text"
                      value={editForm.location?.coordinates?.[0] || ''}
                      onChange={(e) => setEditForm(prev => ({ 
                        ...prev, 
                        location: { coordinates: [parseFloat(e.target.value) || 0, prev.location?.coordinates?.[1] || 0] }
                      }))}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Longitude"
                    />
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={locationLoading}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg whitespace-nowrap transition"
                    >
                      {locationLoading ? '📡 Getting...' : '📍 Use Current'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Get alerts for hazards within 10km of your location.
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    disabled={saveLoading}
                    className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 text-white rounded-lg font-medium transition"
                  >
                    {saveLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={handleEditToggle}
                    className="px-6 py-3 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
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
              </>
            )}
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
                  onClick={() => onNavigate(Page.MAP)}
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

