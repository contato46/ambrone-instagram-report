import { Calendar, Filter, Image, Film, LayoutGrid } from 'lucide-react';
import type { DateRange, PostType } from '../types';

interface DateFilterProps {
  dateRange: DateRange;
  postType: PostType | 'all';
  sortBy: string;
  onDateChange: (range: DateRange) => void;
  onTypeChange: (type: PostType | 'all') => void;
  onSortChange: (sort: string) => void;
  totalPosts: number;
  filteredPosts: number;
}

const TYPE_OPTIONS: Array<{ value: PostType | 'all'; label: string; icon: typeof Image }> = [
  { value: 'all', label: 'Todos', icon: LayoutGrid },
  { value: 'image', label: 'Imagens', icon: Image },
  { value: 'carousel', label: 'Carrossel', icon: LayoutGrid },
  { value: 'video', label: 'Reels', icon: Film },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Data' },
  { value: 'likes', label: 'Curtidas' },
  { value: 'reach', label: 'Alcance' },
  { value: 'engagement', label: 'Engajamento' },
];

export default function DateFilter({
  dateRange,
  postType,
  sortBy,
  onDateChange,
  onTypeChange,
  onSortChange,
  totalPosts,
  filteredPosts,
}: DateFilterProps) {
  return (
    <div className="glass border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-orange-400" />
          <span className="text-white/40 text-xs font-medium uppercase tracking-wider">Período</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateRange.start}
            min="2025-07-01"
            max={dateRange.end}
            onChange={(e) => onDateChange({ ...dateRange, start: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/80 text-sm focus:outline-none focus:border-orange-500/50"
          />
          <span className="text-white/30 text-sm">até</span>
          <input
            type="date"
            value={dateRange.end}
            min={dateRange.start}
            onChange={(e) => onDateChange({ ...dateRange, end: e.target.value })}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-white/80 text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-1">
          {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => onTypeChange(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                postType === value
                  ? 'bg-orange-500 text-white'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-2">
          <Filter size={12} className="text-white/40" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/60 text-xs focus:outline-none focus:border-orange-500/50"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
                Ordenar: {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="ml-auto text-white/30 text-xs">
          {filteredPosts === totalPosts
            ? `${totalPosts} posts`
            : `${filteredPosts} de ${totalPosts} posts`}
        </div>
      </div>
    </div>
  );
}
