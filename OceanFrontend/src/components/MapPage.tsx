
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, ImageOverlay, useMap } from 'react-leaflet';
import { divIcon, Map as LeafletMap } from 'leaflet';
import { HazardType, type HazardReport, type SocialMediaReport, type User } from '../types';
import { api } from '../utils/api';

interface MapPageProps {
  onReportHazard: () => void;
  user: User | null;
}

interface HeaderProps {
  onSearch: (query: string) => void;
  user: User | null;
}

const Header: React.FC<HeaderProps> = ({ onSearch, user }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const handleCoordinateSearch = (query: string) => {
    // Try to parse coordinates (lat, lng or lat lng)
    const coordMatch = query.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        onSearch(query);
        return;
      }
    }
    onSearch(query);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-[1000] p-4">
      <div className="flex items-center justify-between bg-slate-800/50 backdrop-blur-md p-3 rounded-xl border border-slate-700">
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
          <svg className="w-7 h-7 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z" /></svg>
          <span className="text-lg font-bold text-white">Ocean Hazard Watch</span>
        </div>
        <div className="flex-1 max-w-xl mx-4">
          <form onSubmit={handleSearch} className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search by location, coordinates, or region"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => searchQuery && handleCoordinateSearch(searchQuery)}
              className="w-full bg-slate-900/70 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </form>
        </div>
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button onClick={() => navigate('/profile')} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors text-white">
                {user.name}
              </button>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="px-5 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-semibold transition-colors text-white">Login</button>
              <img src="https://picsum.photos/seed/user/40/40" alt="User" className="w-10 h-10 rounded-full border-2 border-slate-600" />
            </>
          )}
        </div>
      </div>
    </header>
  );
};

interface SidebarProps {
  showHeatmap: boolean;
  onToggleHeatmap: () => void;
  showSocialMedia: boolean;
  onToggleSocialMedia: () => void;
  timeRange: number;
  onTimeRangeChange: (value: number) => void;
  onNavigate: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ showHeatmap, onToggleHeatmap, showSocialMedia, onToggleSocialMedia, timeRange, onTimeRangeChange, onNavigate }) => {
  const currentYear = new Date().getFullYear();
  const startYear = 2023;

  const getDateLabel = (value: number) => {
    if (value === currentYear) return 'Today';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = Math.floor(value);
    const month = Math.floor((value - year) * 12);
    return `${months[month]} ${year}`;
  };

  return (
    <aside className="absolute top-1/2 -translate-y-1/2 left-4 z-[1000] w-72 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Filters</h2>
        <p className="text-sm text-slate-400">Refine map data</p>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-300">Data Layers</h3>
        <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" defaultChecked disabled className="accent-blue-500 w-4 h-4 bg-slate-700 border-slate-600 rounded opacity-50" /> <span className="opacity-50">Hazard Reports</span></label>
        <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={showHeatmap} onChange={onToggleHeatmap} className="accent-blue-500 w-4 h-4 bg-slate-700 border-slate-600 rounded" /><span>Heatmaps</span></label>
        <label className="flex items-center space-x-3 cursor-pointer"><input type="checkbox" checked={showSocialMedia} onChange={onToggleSocialMedia} className="accent-blue-500 w-4 h-4 bg-slate-700 border-slate-600 rounded" /><span>Social Media Reports</span></label>
      </div>
      <div className="space-y-4">
        <h3 className="font-semibold text-slate-300">Time Range</h3>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-400">{startYear}</span>
          <input
            type="range"
            min={startYear}
            max={currentYear + (new Date().getMonth() / 12)}
            step={1 / 12}
            value={timeRange}
            onChange={(e) => onTimeRangeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <span className="text-sm text-slate-400">{getDateLabel(timeRange)}</span>
        </div>
      </div>
      <div className="pt-4 border-t border-slate-700 space-y-3">
        <h3 className="font-semibold text-slate-300">Explore</h3>
        <button onClick={() => onNavigate('/news')} className="w-full text-left flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-700/50 hover:text-white">
          <span>News Feed</span>
        </button>
        <button onClick={() => onNavigate('/analytics')} className="w-full text-left flex items-center space-x-3 px-4 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-700/50 hover:text-white">
          <span>Social Analytics</span>
        </button>
      </div>
    </aside>
  );
};

const HazardDetailCard: React.FC<{ report: HazardReport, onClose: () => void }> = ({ report, onClose }) => {
  // Construct full image URL if it's a relative path
  const imageSrc = report.imageUrl && !report.imageUrl.startsWith('http') && report.imageUrl.startsWith('/uploads')
    ? `http://localhost:3000${report.imageUrl}`
    : report.imageUrl || 'https://picsum.photos/seed/hazard/400/300';

  return (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] w-96 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
      <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
      <img src={imageSrc} alt={report.type} className="rounded-lg w-full h-48 object-cover mb-4" onError={(e) => {
        // Fallback to placeholder if image fails to load
        e.currentTarget.src = 'https://picsum.photos/seed/hazard/400/300';
      }} />
      <span className="text-xs font-bold uppercase text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full">{report.type}</span>
      <h2 className="text-2xl font-bold text-white mt-2 mb-2">{`${report.type} Report`}</h2>
      {report.verified && <p className="text-sm text-green-400 font-semibold mb-4">Verified Report</p>}
      <div className="space-y-3 text-slate-300">
        <p><strong>Reported:</strong> {report.timestamp}</p>
        <p><strong>Location:</strong> {report.location.lat.toFixed(4)}° N, {report.location.lng.toFixed(4)}° W</p>
        <p className="text-slate-200">{report.description}</p>
        <div className="flex items-center pt-2">
          <img src="https://picsum.photos/seed/reporter/32/32" alt="Reporter" className="w-8 h-8 rounded-full mr-3" />
          <div>
            <p className="text-sm text-slate-400">Reported by:</p>
            <p className="font-semibold text-white">{report.reportedBy}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const SocialMediaCard: React.FC<{ report: SocialMediaReport, onClose: () => void }> = ({ report, onClose }) => (
  <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] w-96 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
    <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
    <div className="flex items-center mb-4">
      <img src={report.userAvatar} alt={report.user} className="w-12 h-12 rounded-full mr-4" />
      <div>
        <p className="font-bold text-white">{report.user}</p>
        <p className="text-sm text-slate-400">{report.platform}</p>
      </div>
    </div>
    <p className="text-slate-200 mb-4">{report.text}</p>
    <div className="text-sm text-slate-400 space-y-1">
      <p><strong>Location:</strong> {report.location.lat.toFixed(4)}°, {report.location.lng.toFixed(4)}°</p>
      <p><strong>Timestamp:</strong> {report.timestamp}</p>
    </div>
  </div>
);

const createPulseIcon = (color: string) => divIcon({
  className: 'custom-pulse-icon',
  html: `
      <div style="position: relative; width: 16px; height: 16px;">
        <div class="pulse-anim" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${color}; border-radius: 50%; opacity: 0.75;"></div>
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: ${color}; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.5);"></div>
      </div>
    `,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const createSocialIcon = () => divIcon({
  className: 'custom-social-icon',
  html: `
      <div style="position: relative; width: 14px; height: 14px; background-color: #38bdf8; border-radius: 50%; border: 2px solid rgba(255, 255, 255, 0.7);"></div>
    `,
  iconSize: [14, 14],
  iconAnchor: [7, 7]
});

// Component to handle map resize and invalidate size
const MapResizeHandler: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 100);
  }, [map]);

  useEffect(() => {
    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [map]);

  return null;
};

// Component to update map view when center/zoom changes
const SetViewOnChange: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);

  return null;
};

export const MapPage: React.FC<MapPageProps> = ({ onReportHazard, user }) => {
  const navigate = useNavigate();
  const [hazardReports, setHazardReports] = useState<HazardReport[]>([]);
  const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
  const [selectedSocialPost, setSelectedSocialPost] = useState<SocialMediaReport | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showSocialMedia, setShowSocialMedia] = useState(true);
  const [timeRange, setTimeRange] = useState(new Date().getFullYear() + (new Date().getMonth() / 12));
  const [mapCenter, setMapCenter] = useState<[number, number]>([20, -40]);
  const [mapZoom, setMapZoom] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  const hazardColors: { [key in HazardType]: string } = {
    [HazardType.OIL_SPILL]: '#ef4444', // red-500
    [HazardType.DEBRIS]: '#f97316', // orange-500
    [HazardType.POLLUTION]: '#06b6d4', // cyan-500
    [HazardType.OTHER]: '#8b5cf6', // violet-500
  };

  // Fetch hazard reports from backend
  const fetchHazards = async () => {
    try {
      setLoading(true);
      const response = await api.getHazardReports({ limit: 100 });
      // Transform backend data to frontend format
      const transformedReports: HazardReport[] = response.data.map((report: any) => ({
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
      if (transformedReports.length > 0 && !selectedHazard) {
        setSelectedHazard(transformedReports[0]);
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load hazard reports');
      console.error('Error fetching hazards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHazards();
    // Set up polling for real-time updates every 30 seconds
    const interval = setInterval(fetchHazards, 30000);

    // Listen for new report submissions
    const handleNewReport = () => {
      setTimeout(fetchHazards, 1000); // Refresh after 1 second
    };
    window.addEventListener('hazardReportSubmitted', handleNewReport);

    return () => {
      clearInterval(interval);
      window.removeEventListener('hazardReportSubmitted', handleNewReport);
    };
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    await fetchHazards();
  };

  const handleSearch = (query: string) => {
    // Try to parse coordinates
    const coordMatch = query.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setMapCenter([lat, lng]);
        setMapZoom(8);
        return;
      }
    }
    // Simple location search (in a real app, this would use a geocoding API)
    const locationMap: { [key: string]: [number, number] } = {
      'pacific': [20, -140],
      'atlantic': [30, -40],
      'indian': [-10, 70],
      'arctic': [80, 0],
      'hawaii': [21.3, -157.8],
      'gulf of mexico': [28.7, -89.5],
      'mediterranean': [35, 18],
    };
    const lowerQuery = query.toLowerCase();
    for (const [key, coords] of Object.entries(locationMap)) {
      if (lowerQuery.includes(key)) {
        setMapCenter(coords);
        setMapZoom(6);
        if (mapRef.current) {
          mapRef.current.setView(coords, 6);
        }
        return;
      }
    }
    // If coordinates were found, update map
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 8);
        }
      }
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-900">
      {loading && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[2000] bg-blue-600/90 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading hazards...</span>
        </div>
      )}
      {error && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[2000] bg-red-600/90 text-white px-4 py-2 rounded-lg">
          {error}
        </div>
      )}
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100vh', width: '100vw', position: 'absolute', top: 0, left: 0 }}
        className="z-0"
        minZoom={3}
      >
        <MapResizeHandler />
        <SetViewOnChange center={mapCenter} zoom={mapZoom} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {showHeatmap && (
          <ImageOverlay
            url="https://i.imgur.com/s425y4s.png"
            bounds={[[50, -120], [10, -70]]}
            opacity={0.6}
            zIndex={10}
          />
        )}

        {hazardReports.length === 0 && !loading && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-slate-800/90 text-white px-6 py-4 rounded-lg">
            <p>No hazard reports found. Be the first to report one!</p>
          </div>
        )}
        {hazardReports.map((report) => (
          <Marker
            key={report.id}
            position={[report.location.lat, report.location.lng]}
            icon={createPulseIcon(hazardColors[report.type])}
            eventHandlers={{
              click: () => {
                setSelectedHazard(report);
                setSelectedSocialPost(null);
              },
            }}
          />
        ))}

        {/* Social media reports - keeping as mock data for now, can be integrated later */}
        {showSocialMedia && false && [].map((report: any) => (
          <Marker
            key={`social-${report.id}`}
            position={[report.location.lat, report.location.lng]}
            icon={createSocialIcon()}
            eventHandlers={{
              click: () => {
                setSelectedSocialPost(report);
                setSelectedHazard(null);
              },
            }}
          />
        ))}
      </MapContainer>

      <Header onSearch={handleSearch} user={user} />
      <button
        onClick={handleRefresh}
        className="absolute top-24 right-4 z-[1000] bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        title="Refresh data"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
        </svg>
        <span>Refresh</span>
      </button>
      <Sidebar
        showHeatmap={showHeatmap}
        onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
        showSocialMedia={showSocialMedia}
        onToggleSocialMedia={() => setShowSocialMedia(!showSocialMedia)}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onNavigate={navigate}
      />

      {selectedHazard && <HazardDetailCard report={selectedHazard} onClose={() => setSelectedHazard(null)} />}
      {selectedSocialPost && <SocialMediaCard report={selectedSocialPost} onClose={() => setSelectedSocialPost(null)} />}

      <button
        onClick={onReportHazard}
        className="absolute bottom-8 right-8 z-[1000] flex items-center space-x-2 bg-teal-400 hover:bg-teal-300 text-slate-900 font-bold px-6 py-3 rounded-xl shadow-lg transition-all"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
        </svg>
        <span>Report Hazard</span>
      </button>
    </div>
  );
};
