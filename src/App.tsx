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
import SetupGuide from './components/SetupGuide';
import { useInstagramData } from './hooks/useInstagramData';
import type { DateRange, FilterState, Post } from './types';

function getLast7Days(): DateRange {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(start), end: fmt(end) };
}

export default function App() {
  const [filters, setFilters] = useState<FilterState>({
    dateRange: getLast7Days(),
    postType: 'all',
    sortBy: 'date',
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showSetup, setShowSetup] = useState(false);

  const { posts, monthlyMetrics, account, loading, error, usingMockData } =
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

  const totals = useMemo(() => {
    const totalReach = monthlyMetrics.reduce((s, m) => s + m.reach, 0);
    const totalImpressions = monthlyMetrics.reduce((s, m) => s + m.impressions, 0);
    const totalEngagement = monthlyMetrics.reduce((s, m) => s + m.engagement, 0);
    const totalProfileVisits = monthlyMetrics.reduce((s, m) => s + m.profileVisits, 0);
    const totalWebClicks = monthlyMetrics.reduce((s, m) => s + m.websiteClicks, 0);
    const totalLikes = filteredPosts.reduce((s, p) => s + p.likes, 0);
    const totalSaves = filteredPosts.reduce((s, p) => s + p.saves, 0);
    const lastFollowers = monthlyMetrics.length > 0
      ? monthlyMetrics[monthlyMetrics.length - 1].followers || account?.followers_count || 0
      : account?.followers_count || 0;
    const firstFollowers = monthlyMetrics.length > 0 ? monthlyMetrics[0].followers : 0;
    const followersGrowth = firstFollowers > 0 ? ((lastFollowers - firstFollowers) / firstFollowers) * 100 : 0;
    const avgEngRate = monthlyMetrics.length > 0
      ? monthlyMetrics.reduce((s, m) => s + m.engagementRate, 0) / monthlyMetrics.length
      : 0;
    return {
      totalReach, totalImpressions, totalEngagement, totalProfileVisits, totalWebClicks,
      totalLikes, totalSaves, lastFollowers, followersGrowth, avgEngRate,
    };
  }, [monthlyMetrics, filteredPosts, account]);

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
                {error ? 'Erro ao conectar com Instagram — exibindo dados demonstrativos'
                  : 'Sem credenciais configuradas — exibindo dados demonstrativos'}
              </span>
            </div>
            <button onClick={() => setShowSetup((v) => !v)}
              className="text-amber-400 text-xs underline hover:text-amber-300 transition-colors">
              {showSetup ? 'Ocultar guia' : 'Como configurar'}
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

      {loading ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin" />
          <p className="text-white/40 text-sm">Carregando dados do Instagram...</p>
        </div>
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <MetricCard label="Seguidores" value={totals.lastFollowers || account?.followers_count || 0}
              change={totals.followersGrowth} icon={Users} iconColor="text-orange-400" subValue="no período" />
            <MetricCard label="Posts no Período" value={filteredPosts.length} icon={Image}
              iconColor="text-purple-400" subValue={`de ${posts.length} carregados`} />
            <MetricCard label="Alcance Total" value={totals.totalReach} icon={Eye}
              iconColor="text-cyan-400" subValue="contas alcançadas" />
            <MetricCard label="Impressões" value={totals.totalImpressions} icon={BarChart2}
              iconColor="text-blue-400" subValue="visualizações totais" />
            <MetricCard label="Taxa de Eng." value={totals.avgEngRate} format="percent"
              icon={TrendingUp} iconColor="text-emerald-400" subValue="engajamento médio" />
            <MetricCard label="Curtidas" value={totals.totalLikes} icon={Heart} iconColor="text-pink-400" />
            <MetricCard label="Salvamentos" value={totals.totalSaves} icon={Bookmark} iconColor="text-yellow-400" />
            <MetricCard label="Visitas ao Perfil" value={totals.totalProfileVisits} icon={Users} iconColor="text-indigo-400" />
            <MetricCard label="Cliques no Site" value={totals.totalWebClicks} icon={MousePointer} iconColor="text-teal-400" />
            <MetricCard label="Interações" value={totals.totalEngagement} icon={TrendingUp} iconColor="text-orange-400" />
          </div>

          {monthlyMetrics.length > 0 && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FollowersChart data={monthlyMetrics} />
                <ReachChart data={monthlyMetrics} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2"><EngagementChart data={monthlyMetrics} /></div>
                <ContentTypeChart posts={filteredPosts} />
              </div>
            </>
          )}

          <PostGrid posts={filteredPosts} onPostClick={setSelectedPost} title="Publicações" />
        </main>
      )}

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
