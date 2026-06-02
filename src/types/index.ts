export type PostType = 'image' | 'video' | 'reel' | 'carousel';

export interface Post {
  id: string;
  date: string;
  type: PostType;
  caption: string;
  thumbnail: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  reach: number;
  impressions: number;
  plays?: number;
  engagementRate: number;
}

export interface MonthlyMetrics {
  month: string;
  label: string;
  followers: number;
  followersGained: number;
  posts: number;
  reach: number;
  impressions: number;
  engagement: number;
  engagementRate: number;
  profileVisits: number;
  websiteClicks: number;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface FilterState {
  dateRange: DateRange;
  postType: PostType | 'all';
  sortBy: 'date' | 'likes' | 'reach' | 'engagement';
}

export interface DemographicsData {
  ageGender: Array<{ age: string; M: number; F: number; U: number; total: number }>;
  genderTotal: { M: number; F: number; U: number };
  topCities: Array<{ name: string; value: number }>;
  topCountries: Array<{ name: string; value: number }>;
}
