import { Heart, MessageCircle, Eye, Play, Image, Video, Film, LayoutGrid, Bookmark } from 'lucide-react';
import type { Post } from '../types';

interface Props {
  posts: Post[];
  onPostClick: (post: Post) => void;
  title?: string;
}

const TYPE_ICON = { image: Image, carousel: LayoutGrid, reel: Film, video: Video };
const TYPE_COLOR = { image: 'bg-orange-500', carousel: 'bg-purple-500', reel: 'bg-pink-500', video: 'bg-cyan-500' };

function PostCard({ post, onClick }: { post: Post; onClick: () => void }) {
  const TypeIcon = TYPE_ICON[post.type];
  const isVideo = post.type === 'reel' || post.type === 'video';

  return (
    <div
      className="post-thumbnail cursor-pointer aspect-square bg-[#1a1a1a]"
      onClick={onClick}
    >
      <img
        src={post.thumbnail}
        alt={post.caption?.slice(0, 50) || 'Post'}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/400/400`;
        }}
      />
      <div className="overlay">
        <div className="flex items-center gap-3 text-white text-xs font-medium">
          <span className="flex items-center gap-1">
            <Heart size={11} className="fill-white" />
            {post.likes >= 1000 ? `${(post.likes / 1000).toFixed(1)}K` : post.likes}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle size={11} />
            {post.comments}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark size={11} />
            {post.saves}
          </span>
          {isVideo && post.plays && (
            <span className="flex items-center gap-1">
              <Play size={11} className="fill-white" />
              {post.plays >= 1000 ? `${(post.plays / 1000).toFixed(1)}K` : post.plays}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-white/60 text-xs">
            {new Date(post.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
          <span className="text-emerald-400 text-xs font-semibold">{post.engagementRate}%</span>
        </div>
      </div>
      <div className={`absolute top-2 left-2 ${TYPE_COLOR[post.type]} rounded-md p-1`}>
        <TypeIcon size={10} className="text-white" />
      </div>
      {post.reach > 3000 && (
        <div className="absolute top-2 right-2 bg-amber-500 rounded-md px-1.5 py-0.5">
          <Eye size={9} className="text-white inline mr-0.5" />
          <span className="text-white text-[10px] font-bold">TOP</span>
        </div>
      )}
    </div>
  );
}

export default function PostGrid({ posts, onPostClick, title = 'Posts' }: Props) {
  if (posts.length === 0) {
    return (
      <div className="glass rounded-2xl p-12 text-center">
        <p className="text-white/30 text-sm">Nenhum post encontrado para o período selecionado</p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-white font-semibold text-base">{title}</h3>
          <p className="text-white/40 text-xs mt-0.5">{posts.length} publicações — clique para detalhes</p>
        </div>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onClick={() => onPostClick(post)} />
        ))}
      </div>
    </div>
  );
}
