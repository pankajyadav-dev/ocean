import React, { useState } from 'react';

interface HazardNotification {
  id: string;
  type: string;
  severity: number;
  location: { lat: number; lng: number };
  description: string;
  timestamp: string;
  read: boolean;
}

interface NotificationCenterProps {
  notifications: HazardNotification[];
  onClearAll: () => void;
  onMarkAsRead: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  notifications, 
  onClearAll,
  onMarkAsRead 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (notifications.length === 0) return null;

  const getSeverityColor = (severity: number) => {
    if (severity >= 8) return 'text-red-400';
    if (severity >= 5) return 'text-yellow-400';
    return 'text-blue-400';
  };

  return (
    <>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-5 right-5 z-10000 bg-slate-800/90 backdrop-blur-md border border-slate-700 rounded-full p-3 shadow-lg hover:bg-slate-700/90 transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="fixed top-20 right-5 z-10000 w-96 max-h-[600px] bg-slate-800/95 backdrop-blur-md border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h3 className="text-white font-bold text-lg">🌊 Hazard Alerts</h3>
            <div className="flex items-center space-x-2">
              {notifications.length > 0 && (
                <button
                  onClick={onClearAll}
                  className="text-xs text-slate-400 hover:text-white transition"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white text-xl"
              >
                &times;
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px]">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p>No hazard alerts</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => onMarkAsRead(notification.id)}
                    className={`p-4 hover:bg-slate-700/50 cursor-pointer transition ${
                      !notification.read ? 'bg-blue-500/10' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-2xl">⚠️</span>
                        <div>
                          <h4 className={`font-bold ${getSeverityColor(notification.severity)}`}>
                            {notification.type}
                          </h4>
                          <p className="text-xs text-slate-400">
                            Severity: {notification.severity}/10
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{notification.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>📍 {notification.location.lat.toFixed(4)}, {notification.location.lng.toFixed(4)}</span>
                      <span>{new Date(notification.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

