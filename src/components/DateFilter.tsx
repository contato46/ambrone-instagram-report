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

function fmt(d: Date) { return d.toISOString().slice(0, 10); }

const PRESETS: Array<{ label: string; range: () => DateRange }> = [
  {
    label: '7 dias',
    range: () => {
      const end = new Date(); const start = new Date();
      start.setDate(end.getDate() - 6);
      return { start: fmt(start), end: fmt(end) };
    },
  },
  {
    label: '30 dias',
    range: () => {
      const end = new Date(); const start = new Date();
      start.setDate(end.getDate() - 29);
      return { start: fmt(start), end: fmt(end) };
    },
  },
  {
    label: 'Mês anterior',
    range: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: fmt(start), end: fmt(end) };
    },
  },
  {
    label: 'Jan → Hoje',
    range: () => {
      const end = new Date();
      const start = new Date(end.getFullYear(), 0, 1); // Jan 1 current year
      return { start: fmt(start), end: fmt(end) };
    },
  },
];

function isActivePreset(dateRange: DateRange, preset: typeof PRESETS[0]): boolean {
  const r = preset.range();
  return dateRange.start === r.start && dateRange.end === r.end;
}

export default function DateFilter({
  dateRange, postType, sortBy,
  onDateChange, onTypeChange, onSortChange,
  totalPosts, filteredPosts,
}: DateFilterProps) {
  return (
    <div className="glass border-b border-white/5 px-6 py-3 space-y-3">
      {/* Quick presets */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => {
          const active = isActivePreset(dateRange, preset);
          return (
            <button
              key={preset.label}
              onClick={() => onDateChange(preset.range())}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                active ? 'bg-orange-500 text-white' : 'bg-white/5 text-white/50 hover:text-white/80 hover:bg-white/10'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        <div className="h-4 w-px bg-white/10 mx-1" />
        <Calendar size={13} className="text-white/30" />
        <input
          type="date"
          value={dateRange.start}
          max={dateRange.end}
          onChange={(e) => onDateChange({ ...dateRange, start: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 text-xs focus:outline-none focus:border-orange-500/50"
        />
        <span className="text-white/30 text-xs">até</span>
        <input
          type="date"
          value={dateRange.end}
          min={dateRange.start}
          onChange={(e) => onDateChange({ ...dateRange, end: e.target.value })}
          className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-white/70 text-xs focus:outline-none focus:border-orange-500/50"
        />
        <div className="ml-auto text-white/30 text-xs">
          {filteredPosts === totalPosts ? `${totalPosts} posts` : `${filteredPosts} de ${totalPosts} posts`}
        </div>
      </div>

      {/* Type + Sort */}
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-2">
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
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-white/10 mx-1" />
        <Filter size={11} className="text-white/30" />
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/50 text-xs focus:outline-none focus:border-orange-500/50"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#1a1a1a]">
              Ordenar: {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
