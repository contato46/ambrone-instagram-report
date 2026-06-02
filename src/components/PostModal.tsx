import { X, Heart, MessageCircle, Bookmark, Share2, Eye, TrendingUp, Play, Image, Video, Film, LayoutGrid } from 'lucide-react';
import type { Post } from '../types';

interface Props {
  post: Post | null;
  onClose: () => void;
}

const TYPE_ICON = { image: Image, carousel: LayoutGrid, reel: Film, video: Video };
const TYPE_LABEL = { image: 'Imagem', carousel: 'Carrossel', reel: 'Reel', video: 'Vídeo' };
const TYPE_COLOR = { image: 'text-orange-400', carousel: 'text-purple-400', reel: 'text-pink-400', video: 'text-cyan-400' };

function StatRow({ icon: Icon, label, value, color = 'text-white' }: { icon: any; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-2 text-white/50">
        <Icon size={14} />
        <span className="text-xs">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
    </div>
  );
}

export default function PostModal({ post, onClose }: Props) {
  if (!post) return null;

  const TypeIcon = TYPE_ICON[post.type];
  const engagement = post.likes + post.comments + post.saves + post.shares;
  const date = new Date(post.date + 'T12:00:00');
  const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto scrollbar-thin fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <img
            src={post.thumbnail}
            alt="Post"
            className="w-full aspect-square object-cover rounded-t-2xl"
            onError={(e) => { (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/600/600`; }}
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/80 transition-colors"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <span className={`flex items-center gap-1.5 text-xs font-medium bg-black/60 rounded-full px-3 py-1.5 ${TYPE_COLOR[post.type]}`}>
              <TypeIcon size={12} />
              {TYPE_LABEL[post.type]}
            </span>
            <span className="text-xs text-white/60 bg-black/60 rounded-full px-3 py-1.5">{dateStr}</span>
          </div>
        </div>

        <div className="p-5">
          {post.caption && (
            <p className="text-white/70 text-sm leading-relaxed mb-5 line-clamp-3">{post.caption}</p>
          )}

          <div className="grid grid-cols-2 gap-4 mb-5">
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <p className="text-white/40 text-xs mb-1">Alcance</p>
              <p className="text-white text-xl font-bold">{post.reach.toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-white/3 rounded-xl p-4 border border-white/5">
              <p className="text-white/40 text-xs mb-1">Taxa de Eng.</p>
              <p className="text-emerald-400 text-xl font-bold">{post.engagementRate}%</p>
            </div>
          </div>

          <div className="space-y-0">
            <StatRow icon={Heart} label="Curtidas" value={post.likes.toLocaleString('pt-BR')} color="text-pink-400" />
            <StatRow icon={MessageCircle} label="Comentários" value={post.comments.toLocaleString('pt-BR')} color="text-blue-400" />
            <StatRow icon={Bookmark} label="Salvos" value={post.saves.toLocaleString('pt-BR')} color="text-yellow-400" />
            <StatRow icon={Share2} label="Compartilhamentos" value={post.shares.toLocaleString('pt-BR')} color="text-purple-400" />
            <StatRow icon={Eye} label="Impressões" value={post.impressions.toLocaleString('pt-BR')} />
            <StatRow icon={TrendingUp} label="Total de Interações" value={engagement.toLocaleString('pt-BR')} color="text-orange-400" />
            {post.plays !== undefined && (
              <StatRow icon={Play} label="Reproduções" value={post.plays.toLocaleString('pt-BR')} color="text-cyan-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
