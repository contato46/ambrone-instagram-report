import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import type { MonthlyMetrics } from '../../types';

interface Props {
  data: MonthlyMetrics[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-white/60">{p.name}:</span>
          <span className="text-white font-medium">
            {p.dataKey === 'engagementRate' ? `${p.value}%` : p.value?.toLocaleString('pt-BR')}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function EngagementChart({ data }: Props) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-white font-semibold text-base">Engajamento Mensal</h3>
        <p className="text-white/40 text-xs mt-0.5">Total de interações e taxa de engajamento</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <ComposedChart data={data} margin={{ top: 5, right: 30, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis yAxisId="left" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <YAxis yAxisId="right" orientation="right" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
            axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 10]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8}
            formatter={(value) => {
              const labels: Record<string, string> = { engagement: 'Interações', engagementRate: 'Taxa de Eng.' };
              return <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{labels[value] || value}</span>;
            }}
          />
          <Bar yAxisId="left" dataKey="engagement" name="engagement" fill="#f97316" opacity={0.8} radius={[4, 4, 0, 0]} />
          <Line yAxisId="right" type="monotone" dataKey="engagementRate" name="engagementRate"
            stroke="#fbbf24" strokeWidth={2} dot={{ fill: '#fbbf24', r: 3 }} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
