
import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, ImageOverlay, useMap } from 'react-leaflet';
import { divIcon, Map as LeafletMap } from 'leaflet';
import { HazardType, Page, type HazardReport, type SocialMediaReport, type User } from '../types';
import { api } from '../utils/api';
import { OceanWeatherWidget } from './OceanWeatherWidget';

interface MapPageProps {
  onReportHazard: () => void;
  onNavigate: (page: Page) => void;
  user: User | null;
}

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  importance: number;
}

interface HeaderProps {
  onSearch: (lat: number, lon: number, name: string) => void;
  onNavigate: (page: Page) => void;
  user: User | null;
  onRefresh: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onNavigate, user, onRefresh }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Fetch location suggestions from Nominatim API
  const fetchLocationSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setIsSearching(true);
      
      // Use Nominatim API with proper headers
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'OceanHazardWatch/1.0',
            'Accept': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      
      // Fallback to local geocoding data for common locations
      const localResults = getLocalGeocodingResults(query);
      if (localResults.length > 0) {
        setSuggestions(localResults);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  // Fallback local geocoding for common ocean-related locations
  const getLocalGeocodingResults = (query: string): LocationSuggestion[] => {
    const lowerQuery = query.toLowerCase();
    const localData: { [key: string]: LocationSuggestion } = {
      'pacific': {
        display_name: 'Pacific Ocean',
        lat: '0',
        lon: '-160',
        type: 'ocean',
        importance: 0.9
      },
      'atlantic': {
        display_name: 'Atlantic Ocean',
        lat: '30',
        lon: '-40',
        type: 'ocean',
        importance: 0.9
      },
      'indian': {
        display_name: 'Indian Ocean',
        lat: '-20',
        lon: '70',
        type: 'ocean',
        importance: 0.9
      },
      'arctic': {
        display_name: 'Arctic Ocean',
        lat: '80',
        lon: '0',
        type: 'ocean',
        importance: 0.8
      },
      'mediterranean': {
        display_name: 'Mediterranean Sea',
        lat: '35',
        lon: '18',
        type: 'sea',
        importance: 0.8
      },
      'caribbean': {
        display_name: 'Caribbean Sea',
        lat: '15',
        lon: '-75',
        type: 'sea',
        importance: 0.8
      },
      'gulf of mexico': {
        display_name: 'Gulf of Mexico',
        lat: '25',
        lon: '-90',
        type: 'gulf',
        importance: 0.8
      },
      'hawaii': {
        display_name: 'Hawaii, United States',
        lat: '21.3',
        lon: '-157.8',
        type: 'state',
        importance: 0.7
      },
      'florida': {
        display_name: 'Florida, United States',
        lat: '27.6',
        lon: '-81.5',
        type: 'state',
        importance: 0.7
      },
      'california': {
        display_name: 'California, United States',
        lat: '36.7',
        lon: '-119.7',
        type: 'state',
        importance: 0.7
      },
      'alaska': {
        display_name: 'Alaska, United States',
        lat: '64.2',
        lon: '-152.0',
        type: 'state',
        importance: 0.7
      },
      'australia': {
        display_name: 'Australia',
        lat: '-25.0',
        lon: '133.0',
        type: 'country',
        importance: 0.7
      },
      'japan': {
        display_name: 'Japan',
        lat: '36.2',
        lon: '138.2',
        type: 'country',
        importance: 0.7
      },
      'indonesia': {
        display_name: 'Indonesia',
        lat: '-2.5',
        lon: '118.0',
        type: 'country',
        importance: 0.7
      },
      'philippines': {
        display_name: 'Philippines',
        lat: '12.8',
        lon: '121.7',
        type: 'country',
        importance: 0.7
      },
    };

    const results: LocationSuggestion[] = [];
    
    // Find matching locations
    for (const [key, value] of Object.entries(localData)) {
      if (key.includes(lowerQuery) || value.display_name.toLowerCase().includes(lowerQuery)) {
        results.push(value);
      }
    }

    return results.slice(0, 5);
  };

  // Debounced search handler
  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Clear existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      fetchLocationSuggestions(value);
    }, 300); // 300ms debounce
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const lat = parseFloat(suggestion.lat);
    const lon = parseFloat(suggestion.lon);
    setSearchQuery(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onSearch(lat, lon, suggestion.display_name);
  };

  // Handle form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (suggestions.length > 0) {
      handleSuggestionClick(suggestions[0]);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-[2000] p-2 md:p-4">
        <div className="flex flex-row items-center justify-between gap-3 md:gap-4 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md p-3 md:p-4 rounded-xl border border-cyan-500/30 shadow-lg shadow-cyan-500/20">
             <div className="flex items-center space-x-2 cursor-pointer" onClick={() => onNavigate(Page.HOME)}>
                  <svg className="w-6 h-6 md:w-7 md:h-7 text-cyan-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM12 4c-2.31 0-4.43.9-6 2.37L12 13.5l6-7.13C16.43 4.9 14.31 4 12 4z"/></svg>
                  <span className="hidden md:block text-base md:text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent whitespace-nowrap">Ocean Hazard Watch</span>
             </div>
             
             <div className="flex-1 max-w-2xl" ref={searchContainerRef}>
                 <form onSubmit={handleSearch} className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 text-cyan-400 z-10" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input 
                      type="text" 
                      placeholder="Search location..." 
                      value={searchQuery}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                      className="w-full bg-slate-950/80 border border-cyan-500/30 rounded-lg pl-9 md:pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-sm md:text-base" 
                      autoComplete="off"
                    />
                    {isSearching && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="animate-spin h-4 w-4 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      </div>
                    )}
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900/98 backdrop-blur-md border border-cyan-500/30 rounded-lg shadow-2xl shadow-cyan-500/20 overflow-hidden z-50 max-h-80 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-cyan-500/10 transition-colors border-b border-slate-700/50 last:border-b-0 flex items-start space-x-3 group"
                          >
                            <svg className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white group-hover:text-cyan-300 transition-colors truncate">
                                {suggestion.display_name}
                              </p>
                              <p className="text-xs text-slate-400 mt-0.5">
                                {suggestion.type} • {parseFloat(suggestion.lat).toFixed(4)}, {parseFloat(suggestion.lon).toFixed(4)}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                 </form>
             </div>
             
             <div className="flex items-center space-x-2 md:space-x-3">
                <button
                    onClick={onRefresh}
                    className="hidden sm:flex bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-3 md:px-4 py-2 rounded-lg items-center space-x-2 shadow-lg shadow-cyan-500/30 transition-all"
                    title="Refresh data"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span className="hidden lg:inline">Refresh</span>
                </button>
                {user ? (
                  <>
                    <button onClick={() => onNavigate(Page.PROFILE)} className="hidden md:flex px-3 md:px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-all text-white text-sm md:text-base shadow-lg shadow-cyan-500/30 whitespace-nowrap">
                      {user.name}
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/30 cursor-pointer" onClick={() => onNavigate(Page.PROFILE)}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  </>
                ) : (
                  <>
                    <button onClick={() => onNavigate(Page.LOGIN)} className="px-3 md:px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg font-semibold transition-all text-white text-sm md:text-base shadow-lg shadow-cyan-500/30">Login</button>
                    <div className="hidden md:flex w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-cyan-500/50 bg-slate-800 items-center justify-center">
                      <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                      </svg>
                    </div>
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
  onNavigate: (page: Page) => void;
  timeRange: number;
  onTimeRangeChange: (value: number) => void;
  activeFilters: HazardType[];
  onToggleFilter: (type: HazardType) => void;
  showOceanWeather: boolean;
  onToggleOceanWeather: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ showHeatmap, onToggleHeatmap, showSocialMedia, onToggleSocialMedia, onNavigate, timeRange, onTimeRangeChange, activeFilters, onToggleFilter, showOceanWeather, onToggleOceanWeather }) => {
  const [expandedSections, setExpandedSections] = React.useState({
    dataLayers: true,
    hazardTypes: true,
    timeRange: false,
    explore: false
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

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
    <aside className="hidden mt-10 lg:flex lg:absolute lg:top-1/2 lg:-translate-y-1/2 lg:left-4 lg:z-[1800] lg:w-72 lg:bg-gradient-to-br lg:from-slate-900/95 lg:via-slate-800/95 lg:to-slate-900/95 lg:backdrop-blur-md lg:border lg:border-cyan-500/30 lg:rounded-xl lg:shadow-2xl lg:shadow-cyan-500/10 lg:max-h-[calc(100vh-8rem)] lg:overflow-hidden lg:flex-col">
        <div className="p-4 border-b border-slate-700/50">
            <h2 className="text-lg font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Filters</h2>
            <p className="text-xs text-slate-400">Refine map data</p>
        </div>
        
        <div className="overflow-y-auto overflow-x-hidden flex-1 p-4 space-y-2">
          {/* Data Layers Section */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('dataLayers')}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold text-slate-300 text-sm">Data Layers</span>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.dataLayers ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {expandedSections.dataLayers && (
              <div className="px-3 pb-3 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <input type="checkbox" defaultChecked disabled className="accent-cyan-500 w-4 h-4 opacity-50" />
                  <span className="opacity-50 text-xs">Hazard Reports</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <input type="checkbox" checked={showHeatmap} onChange={onToggleHeatmap} className="accent-cyan-500 w-4 h-4" />
                  <span className="text-slate-200 text-xs">Heatmaps</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <input type="checkbox" checked={showSocialMedia} onChange={onToggleSocialMedia} className="accent-cyan-500 w-4 h-4" />
                  <span className="text-slate-200 text-xs">Social Media</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer text-sm hover:bg-slate-700/30 p-2 rounded transition-colors">
                  <input type="checkbox" checked={showOceanWeather} onChange={onToggleOceanWeather} className="accent-cyan-500 w-4 h-4" />
                  <span className="text-slate-200 text-xs">Ocean Weather</span>
                </label>
              </div>
            )}
          </div>

          {/* Hazard Types Section */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('hazardTypes')}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold text-slate-300 text-sm">Hazard Types</span>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.hazardTypes ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {expandedSections.hazardTypes && (
              <div className="px-3 pb-3 space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-red-500/10 p-2 rounded transition-colors">
                  <input type="checkbox" checked={activeFilters.includes(HazardType.OIL_SPILL)} onChange={() => onToggleFilter(HazardType.OIL_SPILL)} className="accent-red-500 w-4 h-4" />
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
                    <span className="text-slate-200 text-xs">Oil Spills</span>
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-orange-500/10 p-2 rounded transition-colors">
                  <input type="checkbox" checked={activeFilters.includes(HazardType.DEBRIS)} onChange={() => onToggleFilter(HazardType.DEBRIS)} className="accent-orange-500 w-4 h-4" />
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></span>
                    <span className="text-slate-200 text-xs">Debris</span>
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-cyan-500/10 p-2 rounded transition-colors">
                  <input type="checkbox" checked={activeFilters.includes(HazardType.POLLUTION)} onChange={() => onToggleFilter(HazardType.POLLUTION)} className="accent-cyan-500 w-4 h-4" />
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></span>
                    <span className="text-slate-200 text-xs">Pollution</span>
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer hover:bg-violet-500/10 p-2 rounded transition-colors">
                  <input type="checkbox" checked={activeFilters.includes(HazardType.OTHER)} onChange={() => onToggleFilter(HazardType.OTHER)} className="accent-violet-500 w-4 h-4" />
                  <span className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50"></span>
                    <span className="text-slate-200 text-xs">Other</span>
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Time Range Section */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('timeRange')}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span className="font-semibold text-slate-300 text-sm">Time Range</span>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.timeRange ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {expandedSections.timeRange && (
              <div className="px-3 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 font-mono">{startYear}</span>
                  <input 
                    type="range" 
                    min={startYear} 
                    max={currentYear + (new Date().getMonth() / 12)} 
                    step={1/12}
                    value={timeRange} 
                    onChange={(e) => onTimeRangeChange(parseFloat(e.target.value))}
                    className="flex-1 h-2 bg-slate-700/50 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
                  />
                  <span className="text-xs text-cyan-400 font-mono font-semibold">{getDateLabel(timeRange)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Explore Section */}
          <div className="border border-slate-700/50 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('explore')}
              className="w-full flex items-center justify-between p-3 hover:bg-slate-700/30 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"/>
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"/>
                </svg>
                <span className="font-semibold text-slate-300 text-sm">Explore</span>
              </div>
              <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandedSections.explore ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/>
              </svg>
            </button>
            {expandedSections.explore && (
              <div className="px-3 pb-3 space-y-2">
                <button onClick={() => onNavigate(Page.NEWS)} className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-transparent">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2 5a2 2 0 012-2h8a2 2 0 012 2v10a2 2 0 002 2H4a2 2 0 01-2-2V5zm3 1h6v4H5V6zm6 6H5v2h6v-2z" clipRule="evenodd"/>
                    <path d="M15 7h1a2 2 0 012 2v5.5a1.5 1.5 0 01-3 0V7z"/>
                  </svg>
                  <span className="text-xs">News Feed</span>
                </button>
                <button onClick={() => onNavigate(Page.ANALYTICS)} className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-slate-300 hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-blue-500/10 hover:text-cyan-400 hover:border-cyan-500/30 border border-transparent">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                  </svg>
                  <span className="text-xs">Social Analytics</span>
                </button>
              </div>
            )}
          </div>
        </div>
    </aside>
  );
};

const HazardDetailCard: React.FC<{ report: HazardReport, onClose: () => void, showWeather: boolean }> = ({ report, onClose, showWeather }) => {
    // Construct full image URL if it's a relative path
    const imageSrc = report.imageUrl && !report.imageUrl.startsWith('http') && report.imageUrl.startsWith('/uploads')
      ? `http://localhost:3000${report.imageUrl}`
      : report.imageUrl || 'https://picsum.photos/seed/hazard/400/300';
    
    return (
    <div className="absolute top-20 md:top-24 right-2 md:right-4 z-[1000] w-[calc(100vw-1rem)] md:w-96 max-h-[calc(100vh-6rem)] md:max-h-[calc(100vh-8rem)] overflow-y-auto bg-gradient-to-br from-slate-900/98 via-slate-800/98 to-slate-900/98 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 md:p-6 space-y-4 shadow-2xl shadow-cyan-500/20">
        <button onClick={onClose} className="absolute top-3 right-3 md:top-4 md:right-4 text-slate-400 hover:text-cyan-400 text-2xl leading-none transition-colors bg-slate-800/50 hover:bg-slate-700/50 rounded-full w-8 h-8 flex items-center justify-center">&times;</button>
        <img src={imageSrc} alt={report.type} className="rounded-lg w-full h-40 md:h-48 object-cover mb-4 border border-cyan-500/20 shadow-lg" onError={(e) => {
          // Fallback to placeholder if image fails to load
          e.currentTarget.src = 'https://picsum.photos/seed/hazard/400/300';
        }} />
        <span className="text-xs font-bold uppercase text-yellow-400 bg-yellow-400/20 px-3 py-1 rounded-full border border-yellow-400/30">{report.type}</span>
        <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mt-2 mb-2">{`${report.type} Report`}</h2>
        {report.verified && <p className="text-sm text-green-400 font-semibold mb-4 flex items-center space-x-2 bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/30">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
            </svg>
            <span>Verified Report</span>
        </p>}
        <div className="space-y-3 text-slate-300 text-sm md:text-base">
            <p className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-cyan-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                </svg>
                <span><strong className="text-cyan-400">Reported:</strong> {report.timestamp}</span>
            </p>
            <p className="flex items-start space-x-2">
                <svg className="w-5 h-5 text-cyan-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                </svg>
                <span><strong className="text-cyan-400">Location:</strong> {report.location.lat.toFixed(4)}° N, {report.location.lng.toFixed(4)}° W</span>
            </p>
            <p className="text-slate-200 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">{report.description}</p>
             <div className="flex items-center pt-2 bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                <img src="https://picsum.photos/seed/reporter/32/32" alt="Reporter" className="w-8 h-8 rounded-full mr-3 border-2 border-cyan-500/30"/>
                <div>
                    <p className="text-xs text-slate-400">Reported by:</p>
                    <p className="font-semibold text-cyan-400">{report.reportedBy}</p>
                </div>
            </div>
        </div>
        
        {showWeather && (
            <div className="border-t border-cyan-500/20 pt-4 mt-4">
                <OceanWeatherWidget 
                    lat={report.location.lat} 
                    lng={report.location.lng}
                    hazardType={report.type}
                />
            </div>
        )}
    </div>
    );
};

const SocialMediaCard: React.FC<{ report: SocialMediaReport, onClose: () => void }> = ({ report, onClose }) => (
    <div className="absolute top-1/2 -translate-y-1/2 right-4 z-[1000] w-96 bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white text-2xl leading-none">&times;</button>
        <div className="flex items-center mb-4">
            <img src={report.userAvatar} alt={report.user} className="w-12 h-12 rounded-full mr-4"/>
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

export const MapPage: React.FC<MapPageProps> = ({ onReportHazard, onNavigate, user }) => {
    const [hazardReports, setHazardReports] = useState<HazardReport[]>([]);
    const [selectedHazard, setSelectedHazard] = useState<HazardReport | null>(null);
    const [selectedSocialPost, setSelectedSocialPost] = useState<SocialMediaReport | null>(null);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showSocialMedia, setShowSocialMedia] = useState(true);
    const [showOceanWeather, setShowOceanWeather] = useState(true);
    const [activeFilters, setActiveFilters] = useState<HazardType[]>([HazardType.OIL_SPILL, HazardType.DEBRIS, HazardType.POLLUTION, HazardType.OTHER]);
    const [timeRange, setTimeRange] = useState(new Date().getFullYear() + (new Date().getMonth() / 12));
    const [mapCenter, setMapCenter] = useState<[number, number]>([20, -40]);
    const [mapZoom, setMapZoom] = useState(3);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
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

    const handleToggleFilter = (type: HazardType) => {
        setActiveFilters(prev => 
            prev.includes(type) 
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const filteredHazards = hazardReports.filter(report => 
        activeFilters.includes(report.type)
    );

    const handleSearch = (lat: number, lon: number, name: string) => {
        // Zoom to the selected location
        setMapCenter([lat, lon]);
        setMapZoom(12);
        console.log(`Navigating to: ${name} (${lat}, ${lon})`);
    };

    // Legacy coordinate search handler (keeping for backwards compatibility)
    const handleLegacySearch = (query: string) => {
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
        <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
            {loading && (
                <div className="absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 z-[2000] bg-gradient-to-r from-cyan-600/95 to-blue-600/95 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-xl flex items-center space-x-2 shadow-xl shadow-cyan-500/30 border border-cyan-400/30">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-sm md:text-base font-medium">Loading hazards...</span>
                </div>
            )}
            {error && (
                <div className="absolute top-16 md:top-20 left-1/2 transform -translate-x-1/2 z-[2000] bg-gradient-to-r from-red-600/95 to-orange-600/95 backdrop-blur-sm text-white px-4 md:px-6 py-2 md:py-3 rounded-xl shadow-xl shadow-red-500/30 border border-red-400/30 max-w-md text-center">
                    <p className="text-sm md:text-base font-medium">{error}</p>
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
                    url="https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png"
                />
                <TileLayer
                    attribution=''
                    url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                />

                {showHeatmap && (
                    <ImageOverlay
                        url="https://i.imgur.com/s425y4s.png"
                        bounds={[[50, -120], [10, -70]]}
                        opacity={0.6}
                        zIndex={10}
                    />
                )}

                {filteredHazards.length === 0 && !loading && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-md border border-cyan-500/30 text-white px-6 md:px-8 py-6 md:py-8 rounded-2xl shadow-2xl shadow-cyan-500/20 max-w-md mx-4 text-center">
                        <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-4 text-cyan-400 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/>
                        </svg>
                        <h3 className="text-lg md:text-xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">No Hazards Found</h3>
                        <p className="text-slate-400 text-sm md:text-base">{activeFilters.length === 0 ? 'Enable some filters to see reports.' : 'Be the first to report a hazard in this area!'}</p>
                    </div>
                )}
                {filteredHazards.map((report) => (
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

            <Header onSearch={handleSearch} onNavigate={onNavigate} user={user} onRefresh={handleRefresh} />
            
            {/* Mobile Filter Button */}
            <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="lg:hidden fixed bottom-20 md:bottom-24 left-4 z-[1500] bg-gradient-to-r from-slate-800 to-slate-700 hover:from-slate-700 hover:to-slate-600 text-cyan-400 p-3 rounded-full shadow-2xl shadow-cyan-500/20 border border-cyan-500/30 transition-all"
                title="Toggle filters"
            >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd"/>
                </svg>
            </button>
            
            {/* Mobile Filter Panel */}
            {showMobileFilters && (
                <div className="lg:hidden fixed inset-0 z-[2500] bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-t border-cyan-500/30 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Filters</h2>
                            <button onClick={() => setShowMobileFilters(false)} className="text-slate-400 hover:text-cyan-400 transition-colors">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                            </button>
                        </div>
                        
                        {/* Mobile Filter Content */}
                        <div className="space-y-6">
                            {/* Hazard Types */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-slate-300 text-base flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                    </svg>
                                    <span>Hazard Types</span>
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-red-500/10 p-3 rounded-lg transition-colors border border-slate-700/50">
                                        <input type="checkbox" checked={activeFilters.includes(HazardType.OIL_SPILL)} onChange={() => handleToggleFilter(HazardType.OIL_SPILL)} className="accent-red-500 w-4 h-4" />
                                        <span className="flex items-center space-x-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50"></span>
                                            <span className="text-slate-200">Oil Spills</span>
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-orange-500/10 p-3 rounded-lg transition-colors border border-slate-700/50">
                                        <input type="checkbox" checked={activeFilters.includes(HazardType.DEBRIS)} onChange={() => handleToggleFilter(HazardType.DEBRIS)} className="accent-orange-500 w-4 h-4" />
                                        <span className="flex items-center space-x-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-lg shadow-orange-500/50"></span>
                                            <span className="text-slate-200">Debris</span>
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-cyan-500/10 p-3 rounded-lg transition-colors border border-slate-700/50">
                                        <input type="checkbox" checked={activeFilters.includes(HazardType.POLLUTION)} onChange={() => handleToggleFilter(HazardType.POLLUTION)} className="accent-cyan-500 w-4 h-4" />
                                        <span className="flex items-center space-x-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50"></span>
                                            <span className="text-slate-200">Pollution</span>
                                        </span>
                                    </label>
                                    <label className="flex items-center space-x-2 cursor-pointer hover:bg-violet-500/10 p-3 rounded-lg transition-colors border border-slate-700/50">
                                        <input type="checkbox" checked={activeFilters.includes(HazardType.OTHER)} onChange={() => handleToggleFilter(HazardType.OTHER)} className="accent-violet-500 w-4 h-4" />
                                        <span className="flex items-center space-x-2 text-sm">
                                            <span className="w-3 h-3 rounded-full bg-violet-500 shadow-lg shadow-violet-500/50"></span>
                                            <span className="text-slate-200">Other</span>
                                        </span>
                                    </label>
                                </div>
                            </div>
                            
                            {/* Data Layers */}
                            <div className="space-y-3 border-t border-slate-700/50 pt-4">
                                <h3 className="font-semibold text-slate-300 text-base flex items-center space-x-2">
                                    <svg className="w-4 h-4 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                                    </svg>
                                    <span>Data Layers</span>
                                </h3>
                                <label className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/30 p-3 rounded-lg transition-colors border border-slate-700/50">
                                    <input type="checkbox" checked={showOceanWeather} onChange={() => setShowOceanWeather(!showOceanWeather)} className="accent-cyan-500 w-4 h-4" />
                                    <span className="text-slate-200">Ocean Weather</span>
                                </label>
                                <label className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/30 p-3 rounded-lg transition-colors border border-slate-700/50">
                                    <input type="checkbox" checked={showHeatmap} onChange={() => setShowHeatmap(!showHeatmap)} className="accent-cyan-500 w-4 h-4" />
                                    <span className="text-slate-200">Heatmaps</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <Sidebar 
                showHeatmap={showHeatmap}
                onToggleHeatmap={() => setShowHeatmap(!showHeatmap)}
                showSocialMedia={showSocialMedia}
                onToggleSocialMedia={() => setShowSocialMedia(!showSocialMedia)}
                onNavigate={onNavigate}
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
                activeFilters={activeFilters}
                onToggleFilter={handleToggleFilter}
                showOceanWeather={showOceanWeather}
                onToggleOceanWeather={() => setShowOceanWeather(!showOceanWeather)}
            />

            {selectedHazard && <HazardDetailCard report={selectedHazard} onClose={() => setSelectedHazard(null)} showWeather={showOceanWeather} />}
            {selectedSocialPost && <SocialMediaCard report={selectedSocialPost} onClose={() => setSelectedSocialPost(null)} />}
            
            <button 
                onClick={onReportHazard}
                className="fixed bottom-4 md:bottom-8 right-4 md:right-8 z-[1500] flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold px-4 md:px-6 py-2.5 md:py-3 rounded-xl shadow-2xl shadow-cyan-500/40 transition-all hover:scale-105"
            >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                </svg>
                <span className="text-sm md:text-base">Report Hazard</span>
            </button>
        </div>
    );
};
