
import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { MapPage } from './components/MapPage';
import { NewsFeedPage } from './components/NewsFeedPage';
import { AnalyticsPage } from './components/AnalyticsPage';
import { ReportHazardWizard } from './components/ReportHazardWizard';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { ProfilePage } from './components/ProfilePage';
import { NotificationCenter } from './components/NotificationCenter';
import { Page, type User } from './types';
import { io, Socket } from 'socket.io-client';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    // Restore page from localStorage on app load
    const savedPage = localStorage.getItem('currentPage');
    return savedPage ? (savedPage as Page) : Page.HOME;
  });
  const [isReporting, setIsReporting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hazardNotifications, setHazardNotifications] = useState<any[]>([]);

  // Initialize Socket.io connection
  useEffect(() => {
    const socketConnection = io('http://localhost:3000', {
      transports: ['websocket', 'polling']
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
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Persist current page to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('currentPage', currentPage);
  }, [currentPage]);

  const handleNavigate = (page: Page) => {
    setCurrentPage(page);
  };

  const handleLogin = (email: string, authToken: string) => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCurrentPage(Page.HOME);
  };

  const handleReportSubmit = () => {
    setIsReporting(false);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 5000);
    // Trigger a page refresh or data reload if on map page
    if (currentPage === Page.MAP) {
      // The MapPage will auto-refresh due to its polling mechanism
      window.dispatchEvent(new Event('hazardReportSubmitted'));
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      case Page.MAP:
        return <MapPage onReportHazard={() => setIsReporting(true)} onNavigate={handleNavigate} user={user} />;
      case Page.NEWS:
        return <NewsFeedPage onNavigate={handleNavigate} user={user} />;
      case Page.ANALYTICS:
        return <AnalyticsPage onNavigate={handleNavigate} user={user} />;
      case Page.LOGIN:
        return <LoginPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      case Page.SIGNUP:
        return <SignupPage onNavigate={handleNavigate} onLogin={handleLogin} />;
      case Page.PROFILE:
        return <ProfilePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
      default:
        return <HomePage onNavigate={handleNavigate} user={user} onLogout={handleLogout} />;
    }
  };

  // For hash-based routing simulation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '').toUpperCase();
      if (hash in Page) {
        setCurrentPage(Page[hash as keyof typeof Page]);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);


  return (
    <>
      {renderPage()}
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

export default App;
