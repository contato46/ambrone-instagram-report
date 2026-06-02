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
