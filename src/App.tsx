import { useState, useMemo } from 'react';
import {
  Users, Image, Eye, TrendingUp, Heart, Bookmark, MousePointer, AlertCircle, RefreshCw, Share2,
} from 'lucide-react';
import Header from './components/Header';
import MetricCard from './components/MetricCard';
import DateFilter from './components/DateFilter';
import PostGrid from './components/PostGrid';
import PostModal from './components/PostModal';
import FollowersChart from './components/charts/FollowersChart';
import ReachChart from './components/charts/ReachChart';
import EngagementChart from './components/charts/EngagementChart';
import ContentTypeChart from './components/charts/ContentTypeChart';
import Demographics from './components/Demographics';
import SetupGuide from './components/SetupGuide';
import { useInstagramData } from './hooks/useInstagramData';
import type { DateRange, FilterState, Post } from './types';

function getLast30Days(): DateRange {
  const end = new Date(); const start = new Date();
  start.setDate(end.getDate() - 29);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: getLast30Days(),
    postType: 'all',
    sortBy: 'date',
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const { posts, monthlyMetrics, account, demographics, followerTimeline, syncing, error, usingMockData } =
    useInstagramData(filters.dateRange);

  const filteredPosts = useMemo(() => {
    let result = posts.filter((p) => {
      if (p.date < filters.dateRange.start || p.date > filters.dateRange.end) return false;
      if (filters.postType !== 'all') {
        const match = filters.postType === 'video'
          ? (p.type === 'video' || p.type === 'reel')
          : p.type === filters.postType;
        if (!match) return false;
      }
      return true;
    });
    switch (filters.sortBy) {
      case 'likes': result = [...result].sort((a, b) => b.likes - a.likes); break;
      case 'reach': result = [...result].sort((a, b) => b.reach - a.reach); break;
      case 'engagement': result = [...result].sort((a, b) => b.engagementRate - a.engagementRate); break;
      default: result = [...result].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return result;
  }, [posts, filters]);

  const totals = useMemo(() => {
    const totalLikes = filteredPosts.reduce((s, p) => s + p.likes, 0);
    const totalComments = filteredPosts.reduce((s, p) => s + p.comments, 0);
    const totalSaves = filteredPosts.reduce((s, p) => s + p.saves, 0);
    const totalShares = filteredPosts.reduce((s, p) => s + p.shares, 0);
    const totalReach = filteredPosts.reduce((s, p) => s + p.reach, 0);
    const totalProfileVisits = monthlyMetrics.reduce((s, m) => s + m.profileVisits, 0);
    const totalEngagement = filteredPosts.reduce((s, p) => s + p.likes + p.comments + p.saves + p.shares, 0);
    const followers = account?.followers_count || 0;
    const avgEngRate = totalReach > 0
      ? parseFloat(((totalEngagement / totalReach) * 100).toFixed(1)) : 0;
    return { totalLikes, totalComments, totalSaves, totalShares, totalReach, totalProfileVisits, totalEngagement, followers, avgEngRate };
  }, [filteredPosts, monthlyMetrics, account]);

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header
        username={account?.username}
        followers={totals.followers}
        profilePic={account?.profile_picture_url}
      />

      {syncing && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 px-6 py-1.5">
          <div className="max-w-7xl mx-auto flex items-center gap-2 text-blue-400 text-xs">
            <RefreshCw size={11} className="animate-spin flex-shrink-0" />
            <span>Buscando dados do @ambrone...</span>
          </div>
        </div>
      )}

      {usingMockData && !syncing && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertCircle size={14} />
              <span>{error ? 'Erro ao conectar — dados demonstrativos' : 'Dados demonstrativos'}</span>
            </div>
            <button onClick={() => setShowSetup((v) => !v)}
              className="text-amber-400 text-xs underline hover:text-amber-300">
              {showSetup ? 'Fechar' : 'Configurar'}
            </button>
          </div>
        </div>
      )}

      {showSetup && <SetupGuide />}

      <DateFilter
        dateRange={filters.dateRange}
        postType={filters.postType}
        sortBy={filters.sortBy}
        onDateChange={(dateRange) => setFilters((f) => ({ ...f, dateRange }))}
        onTypeChange={(postType) => setFilters((f) => ({ ...f, postType }))}
        onSortChange={(sortBy) => setFilters((f) => ({ ...f, sortBy: sortBy as FilterState['sortBy'] }))}
        totalPosts={posts.length}
        filteredPosts={filteredPosts.length}
      />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <MetricCard label="Seguidores" value={totals.followers} icon={Users} iconColor="text-orange-400" subValue="total na conta" />
          <MetricCard label="Posts" value={filteredPosts.length} icon={Image} iconColor="text-purple-400" subValue="no período" />
          <MetricCard label="Alcance" value={totals.totalReach} icon={Eye} iconColor="text-cyan-400" />
          <MetricCard label="Curtidas" value={totals.totalLikes} icon={Heart} iconColor="text-pink-400" />
          <MetricCard label="Comentários" value={totals.totalComments} icon={Eye} iconColor="text-blue-400" />
          <MetricCard label="Salvamentos" value={totals.totalSaves} icon={Bookmark} iconColor="text-yellow-400" />
          <MetricCard label="Compartilhamentos" value={totals.totalShares} icon={Share2} iconColor="text-emerald-400" />
          <MetricCard label="Taxa de Eng." value={totals.avgEngRate} format="percent" icon={TrendingUp} iconColor="text-violet-400" />
          <MetricCard label="Visitas ao Perfil" value={totals.totalProfileVisits} icon={MousePointer} iconColor="text-indigo-400" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FollowersChart
            timeline={followerTimeline}
            currentFollowers={totals.followers}
          />
          <ReachChart data={monthlyMetrics} />
        </div>

        {monthlyMetrics.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2"><EngagementChart data={monthlyMetrics} /></div>
            <ContentTypeChart posts={filteredPosts} />
          </div>
        )}

        {/* Demographics */}
        {demographics && <Demographics data={demographics} />}

        {/* Posts grid */}
        <PostGrid posts={filteredPosts} onPostClick={setSelectedPost} title="Publicações" />
      </main>

      <footer className="border-t border-white/5 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white/20 text-xs">
          <span>Ambrone Café Empório · Relatório Instagram</span>
          <span>Ard Assessoria</span>
        </div>
      </footer>

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
