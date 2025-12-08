
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { MapPage } from './components/MapPage';
import { NewsFeedPage } from './components/NewsFeedPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ReportHazardWizard } from './components/ReportHazardWizard';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ProfilePage } from './components/ProfilePage';
import { NotificationCenter } from './components/NotificationCenter';
import { GovernmentAlertsPage } from './components/GovernmentAlertsPage';
import { AdminDashboard } from './components/AdminDashboard';
import { ManageReports } from './components/ManageReports';
import { ManageUsers } from './components/ManageUsers';
import { Page, type User } from './types';
import { io, Socket } from 'socket.io-client';

const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const [isReporting, setIsReporting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hazardNotifications, setHazardNotifications] = useState<any[]>([]);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const socketConnection = io(socketUrl, {
      transports: ['polling', 'websocket'],
      path: '/socket.io'
    });

    socketConnection.on('connect', () => {
      console.log('✅ Connected to Socket.io server');
    });

    socketConnection.on('disconnect', () => {
      console.log('❌ Disconnected from Socket.io server');
    });

    // Listen for hazard alerts
    socketConnection.on('hazard-reported', (hazard: any) => {
      console.log('🚨 New hazard reported:', hazard);
      
      // Add to notifications
      setHazardNotifications(prev => [{
        id: hazard.id,
        type: hazard.type,
        severity: hazard.severity,
        location: hazard.location,
        description: hazard.description,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev]);

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('🌊 Ocean Hazard Alert', {
          body: `${hazard.type} reported nearby - Severity: ${hazard.severity}/10`,
          icon: '/ocean-icon.png',
          tag: hazard.id
        });
      }
    });

    setSocket(socketConnection);

    return () => {
      socketConnection.disconnect();
    };
  }, []);

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    if (storedToken && storedUser) {
      setToken(storedToken);
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log('Loaded user from localStorage:', parsedUser);
    }
  }, []);

  // Helper function to convert Page enum to route path
  const handleNavigate = (page: Page) => {
    const routes: Record<Page, string> = {
      [Page.HOME]: '/',
      [Page.MAP]: '/map',
      [Page.NEWS]: '/news',
      [Page.ANALYTICS]: '/analytics',
      [Page.LOGIN]: '/login',
      [Page.SIGNUP]: '/signup',
      [Page.PROFILE]: '/profile',
      [Page.GOVERNMENT_ALERTS]: '/government-alerts',
    };
    navigate(routes[page]);
  };

  const handleLogin = (email: string, authToken: string) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      console.log('User logged in:', parsedUser);
    }
    setToken(authToken);
    navigate('/map');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
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
        <Route path="/" element={<HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />} />
        <Route path="/map" element={<MapPage onReportHazard={() => setIsReporting(true)} onNavigate={handleNavigate} user={user} />} />
        <Route path="/news" element={<NewsFeedPage onNavigate={handleNavigate} user={user} />} />
        <Route path="/analytics" element={<AnalyticsPage onNavigate={handleNavigate} user={user} />} />
        <Route path="/login" element={<LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />} />
        <Route path="/signup" element={<SignupPage onNavigate={handleNavigate} onLogin={handleLogin} />} />
        <Route path="/profile" element={user ? <ProfilePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/government-alerts" element={<GovernmentAlertsPage onNavigate={handleNavigate} user={user} />} />
        
        {/* Admin Routes - Protected */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<ManageReports />} />
        <Route path="/admin/users" element={<ManageUsers />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <ReportHazardWizard
        isOpen={isReporting}
        onClose={() => setIsReporting(false)}
        onSubmit={handleReportSubmit}
      />
      <NotificationCenter 
        notifications={hazardNotifications}
        onClearAll={() => setHazardNotifications([])}
        onMarkAsRead={(id: string) => {
          setHazardNotifications(prev => 
            prev.map(n => n.id === id ? { ...n, read: true } : n)
          );
        }}
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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
