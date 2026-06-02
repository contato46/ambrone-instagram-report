import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
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
          <span className="text-white/60 capitalize">{p.name}:</span>
          <span className="text-white font-medium">{p.value?.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
};

export default function ReachChart({ data }: Props) {
  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-6">
        <h3 className="text-white font-semibold text-base">Alcance & Impressões</h3>
        <p className="text-white/40 text-xs mt-0.5">Total mensal de contas alcançadas e impressões</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <defs>
            <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{value === 'reach' ? 'Alcance' : 'Impressões'}</span>}
          />
          <Area type="monotone" dataKey="impressions" name="impressions" stroke="#06b6d4" strokeWidth={2}
            fill="url(#impressionsGrad)" dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="reach" name="reach" stroke="#8b5cf6" strokeWidth={2}
            fill="url(#reachGrad)" dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
