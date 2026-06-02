import { useState, useMemo } from 'react';
import {
  Users, Image, Eye, TrendingUp, Heart, Bookmark, BarChart2, MousePointer, AlertCircle,
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
import LoadingState from './components/LoadingState';
import SetupGuide from './components/SetupGuide';
import { useInstagramData } from './hooks/useInstagramData';
import type { DateRange, FilterState, Post } from './types';

const DEFAULT_DATE_RANGE: DateRange = { start: '2025-07-01', end: '2026-05-31' };

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: DEFAULT_DATE_RANGE,
    postType: 'all',
    sortBy: 'date',
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const { posts, monthlyMetrics, account, loading, loadingMessage, loadingProgress, error, usingMockData } =
    useInstagramData(filters.dateRange);

  const filteredPosts = useMemo(() => {
    let result = posts.filter((p) => {
      if (p.date < filters.dateRange.start || p.date > filters.dateRange.end) return false;
      if (filters.postType !== 'all' && p.type !== filters.postType) return false;
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

  const filteredMetrics = useMemo(() =>
    monthlyMetrics.filter(
      (m) => m.month >= filters.dateRange.start.slice(0, 7) && m.month <= filters.dateRange.end.slice(0, 7)
    ),
    [monthlyMetrics, filters.dateRange]
  );

  const totals = useMemo(() => {
    const totalReach = filteredMetrics.reduce((s, m) => s + m.reach, 0);
    const totalImpressions = filteredMetrics.reduce((s, m) => s + m.impressions, 0);
    const totalEngagement = filteredMetrics.reduce((s, m) => s + m.engagement, 0);
    const totalProfileVisits = filteredMetrics.reduce((s, m) => s + m.profileVisits, 0);
    const totalWebClicks = filteredMetrics.reduce((s, m) => s + m.websiteClicks, 0);
    const totalLikes = filteredPosts.reduce((s, p) => s + p.likes, 0);
    const totalSaves = filteredPosts.reduce((s, p) => s + p.saves, 0);
    const lastFollowers = filteredMetrics.length > 0 ? filteredMetrics[filteredMetrics.length - 1].followers : 0;
    const firstFollowers = filteredMetrics.length > 0 ? filteredMetrics[0].followers : 0;
    const followersGrowth = firstFollowers > 0 ? ((lastFollowers - firstFollowers) / firstFollowers) * 100 : 0;
    const avgEngRate = filteredMetrics.length > 0
      ? filteredMetrics.reduce((s, m) => s + m.engagementRate, 0) / filteredMetrics.length
      : 0;

    return {
      totalReach, totalImpressions, totalEngagement, totalProfileVisits, totalWebClicks,
      totalLikes, totalSaves, lastFollowers, followersGrowth, avgEngRate,
    };
  }, [filteredMetrics, filteredPosts]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f]">
        <Header username={account?.username} followers={account?.followers_count} profilePic={account?.profile_picture_url} />
        <LoadingState message={loadingMessage} progress={loadingProgress} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f]">
      <Header
        username={account?.username}
        followers={totals.lastFollowers || account?.followers_count}
        profilePic={account?.profile_picture_url}
      />

      {usingMockData && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 text-xs">
              <AlertCircle size={14} />
              <span>
                {error
                  ? 'Erro na API do Instagram — exibindo dados demonstrativos'
                  : 'Dados demonstrativos — configure as credenciais do Instagram para dados reais'}
              </span>
            </div>
            <button
              onClick={() => setShowSetup((v) => !v)}
              className="text-amber-400 text-xs underline hover:text-amber-300 transition-colors"
            >
              {showSetup ? 'Ocultar guia' : 'Ver como configurar'}
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          <MetricCard label="Seguidores" value={totals.lastFollowers || account?.followers_count || 0}
            change={totals.followersGrowth} icon={Users} iconColor="text-orange-400" subValue="ao final do período" />
          <MetricCard label="Posts no Período" value={filteredPosts.length} icon={Image}
            iconColor="text-purple-400" subValue={`de ${posts.length} no total`} />
          <MetricCard label="Alcance Total" value={totals.totalReach} icon={Eye}
            iconColor="text-cyan-400" subValue="contas únicas alcançadas" />
          <MetricCard label="Impressões" value={totals.totalImpressions} icon={BarChart2}
            iconColor="text-blue-400" subValue="visualizações totais" />
          <MetricCard label="Taxa de Eng. Média" value={totals.avgEngRate} format="percent"
            icon={TrendingUp} iconColor="text-emerald-400" subValue="engajamento por alcance" />
          <MetricCard label="Curtidas Totais" value={totals.totalLikes} icon={Heart} iconColor="text-pink-400" />
          <MetricCard label="Salvamentos" value={totals.totalSaves} icon={Bookmark} iconColor="text-yellow-400" />
          <MetricCard label="Visitas ao Perfil" value={totals.totalProfileVisits} icon={Users} iconColor="text-indigo-400" />
          <MetricCard label="Cliques no Site" value={totals.totalWebClicks} icon={MousePointer} iconColor="text-teal-400" />
          <MetricCard label="Interações Totais" value={totals.totalEngagement} icon={TrendingUp} iconColor="text-orange-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FollowersChart data={filteredMetrics} />
          <ReachChart data={filteredMetrics} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <EngagementChart data={filteredMetrics} />
          </div>
          <ContentTypeChart posts={filteredPosts} />
        </div>

        <PostGrid posts={filteredPosts} onPostClick={setSelectedPost} title="Publicações" />
      </main>

      <footer className="border-t border-white/5 px-6 py-4 mt-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-white/20 text-xs">
          <span>Ambrone Café Empório · Relatório Instagram · Jul/2025 – Mai/2026</span>
          <span>Ard Assessoria</span>
        </div>
      </footer>

      <PostModal post={selectedPost} onClose={() => setSelectedPost(null)} />
    </div>
  );
}
