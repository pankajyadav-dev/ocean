
export enum Page {
    HOME,
    MAP,
    NEWS,
    ANALYTICS,
    LOGIN,
    SIGNUP,
    PROFILE,
    GOVERNMENT_ALERTS,
}

export enum HazardType {
    OIL_SPILL = 'Oil Spill',
    DEBRIS = 'Debris',
    POLLUTION = 'Pollution',
    OTHER = 'Other',
}

// // Pages can be represented as string literal union type
// export type Page = "HOME" | "MAP" | "NEWS" | "ANALYTICS";

// // Hazard types also converted to string literal union type
// export type HazardType = "OIL_SPILL" | "DEBRIS" | "POLLUTION" | "OTHER";

export interface HazardReport {
    id: number;
    type: HazardType;
    location: {
        lat: number;
        lng: number;
    };
    severity: number;
    description: string;
    reportedBy: string;
    timestamp: string;
    imageUrl: string;
    verified: boolean;
    verificationStatus?: 'unverified' | 'ai-verified' | 'admin-verified';
    verifiedBy?: string;
    verifiedAt?: string;
}

export interface NewsArticle {
    id: number | string;
    title: string;
    summary: string;
    imageUrl: string;
    category: string;
    date: string;
    source?: 'hazard-report' | 'rss-feed';
    verificationStatus?: 'unverified' | 'ai-verified' | 'admin-verified' | null;
    sourceUrl?: string;
    hazardReportId?: string | null;
}

export interface MentionData {
    name: string;
    mentions: number;
}

export interface PlatformData {
    name: string;
    value: number;
}

export interface SocialMediaReport {
    id: number;
    platform: 'Twitter' | 'Reddit';
    user: string;
    text: string;
    location: {
        lat: number;
        lng: number;
    };
    timestamp: string;
    userAvatar: string;
}

export interface User {
    id: string;
    name: string;
    email: string;
    role?: 'user' | 'admin';
    createdAt?: string;
}
