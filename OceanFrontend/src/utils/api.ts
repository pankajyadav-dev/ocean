const API_BASE_URL = 'http://localhost:3000/api';

export const api = {
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = localStorage.getItem('token');
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  },

  // Auth endpoints
  async login(email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async signup(name: string, email: string, password: string) {
    return this.request<{ token: string; user: any }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  // Hazard endpoints
  async getHazardReports(params?: { type?: string; verified?: boolean; limit?: number; skip?: number; userId?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.verified !== undefined) queryParams.append('verified', String(params.verified));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.userId) queryParams.append('userId', params.userId);
    
    const query = queryParams.toString();
    return this.request<{ data: any[]; total: number }>(`/hazards${query ? `?${query}` : ''}`);
  },

  async createHazardReport(data: {
    type: string;
    location: { lat: number; lng: number };
    severity: number;
    description?: string;
    imageUrl?: string;
    imageFile?: File;
  }) {
    const token = localStorage.getItem('token');
    
    // If imageFile is provided, use FormData; otherwise use JSON
    if (data.imageFile) {
      const formData = new FormData();
      formData.append('type', data.type);
      formData.append('location', JSON.stringify(data.location));
      formData.append('severity', data.severity.toString());
      if (data.description) {
        formData.append('description', data.description);
      }
      formData.append('image', data.imageFile);

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/hazards`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'An error occurred' }));
        throw new Error(error.message || `HTTP error! status: ${response.status}`);
      }

      return response.json();
    } else {
      // Fallback to JSON for backward compatibility
      return this.request<{ message: string; data: any }>('/hazards', {
        method: 'POST',
        body: JSON.stringify({
          type: data.type,
          location: data.location,
          severity: data.severity,
          description: data.description,
          imageUrl: data.imageUrl,
        }),
      });
    }
  },

  // News endpoints
  async getNewsArticles(params?: { category?: string; source?: string; verificationStatus?: string; limit?: number; skip?: number; sortBy?: string }) {
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.source) queryParams.append('source', params.source);
    if (params?.verificationStatus) queryParams.append('verificationStatus', params.verificationStatus);
    if (params?.limit) queryParams.append('limit', String(params.limit));
    if (params?.skip) queryParams.append('skip', String(params.skip));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    
    const query = queryParams.toString();
    return this.request<{ data: any[]; total: number }>(`/news${query ? `?${query}` : ''}`);
  },

  async syncRSSFeeds() {
    return this.request<{ message: string; data: { success: number; failed: number } }>('/news/sync-rss', {
      method: 'POST',
    });
  },

  // Analytics endpoints
  async getAnalytics() {
    return this.request<{ data: any }>('/analytics');
  },

  // User endpoints
  async getUserProfile() {
    return this.request<{ user: any; reports: any[]; stats: any }>('/user/profile');
  },

  async updateUserProfile(data: { name?: string; email?: string; phone?: string; location?: any }) {
    return this.request<{ user: any }>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Social Media endpoints
  async getSocialMediaAnalytics(hazardsOnly: boolean = false) {
    const query = hazardsOnly ? '?hazardsOnly=true' : '';
    return this.request<{
      mentionVolumeData: Array<{ name: string; mentions: number }>;
      mentionsByPlatform: Array<{ name: string; value: number }>;
      topKeywords: string[];
      highImpactPosts: Array<{
        platform: string;
        text: string;
        engagement: string;
        url: string;
        imageUrl: string;
      }>;
      sentimentData: Array<{ name: string; value: number; fill: string }>;
      emergingThreats: Array<{
        term: string;
        growth: string;
        description: string;
      }>;
      topInfluencers: Array<{
        name: string;
        handle: string;
        avatar: string;
        followers: string;
      }>;
    }>(`/social-media/analytics${query}`);
  },
};
