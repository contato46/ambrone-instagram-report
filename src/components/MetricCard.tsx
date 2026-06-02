import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  change?: number;
  icon: LucideIcon;
  iconColor?: string;
  format?: 'number' | 'percent' | 'raw';
}

function formatValue(value: string | number, format: string = 'number'): string {
  if (typeof value === 'string') return value;
  if (format === 'percent') return `${value.toFixed(1)}%`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('pt-BR');
}

export default function MetricCard({
  label,
  value,
  subValue,
  change,
  icon: Icon,
  iconColor = 'text-orange-400',
  format = 'number',
}: MetricCardProps) {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl bg-white/5 ${iconColor}`}>
          <Icon size={20} />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? 'bg-emerald-500/10 text-emerald-400' :
            isNegative ? 'bg-red-500/10 text-red-400' :
            'bg-white/5 text-white/40'
          }`}>
            {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <div>
        <p className="text-white/40 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
        <p className="text-white text-2xl font-bold leading-none">
          {formatValue(value, format)}
        </p>
        {subValue && (
          <p className="text-white/40 text-xs mt-1.5">{subValue}</p>
        )}
      </div>
    </div>
  );
}
