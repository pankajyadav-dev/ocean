
import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { MapPage } from './components/MapPage';
import { NewsFeedPage } from './components/NewsFeedPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ReportHazardWizard } from './components/ReportHazardWizard';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ProfilePage } from './components/ProfilePage';
import { type User } from './types';

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isReporting, setIsReporting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (_email: string, _authToken: string) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const handleReportSubmit = () => {
    setIsReporting(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
    // Trigger a page refresh or data reload if on map page
    window.dispatchEvent(new Event('hazardReportSubmitted'));
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />
        <Route path="/map" element={<MapPage onReportHazard={() => setIsReporting(true)} user={user} />} />
        <Route path="/news" element={<NewsFeedPage user={user} />} />
        <Route path="/analytics" element={<AnalyticsPage user={user} />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onLogin={handleLogin} />} />
        <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
      </Routes>

      <ReportHazardWizard
        isOpen={isReporting}
        onClose={() => setIsReporting(false)}
        onSubmit={handleReportSubmit}
      />
      {showSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-green-500/20 backdrop-blur-md border border-green-400 text-white px-6 py-4 rounded-xl shadow-lg flex items-center space-x-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-bold">Hazard Report Submitted</p>
            <p className="text-sm text-green-200">Thank you for helping keep our oceans safe.</p>
          </div>
          <button onClick={() => setShowSuccessToast(false)} className="text-green-200 hover:text-white">&times;</button>
        </div>
      )}
    </>
  );
};

export default App;
