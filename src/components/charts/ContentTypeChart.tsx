import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { Post } from '../../types';

interface Props {
  posts: Post[];
}

const COLORS = {
  image: '#f97316',
  carousel: '#8b5cf6',
  reel: '#ec4899',
  video: '#06b6d4',
};

const LABELS = {
  image: 'Imagens',
  carousel: 'Carrossel',
  reel: 'Reels',
  video: 'Vídeos',
};

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white font-medium text-sm">{d.name}</p>
      <p className="text-white/60 text-xs">{d.value} posts ({d.percent}%)</p>
    </div>
  );
};

export default function ContentTypeChart({ posts }: Props) {
  const counts: Record<string, number> = { image: 0, carousel: 0, reel: 0, video: 0 };
  posts.forEach((p) => { if (counts[p.type] !== undefined) counts[p.type]++; });
  const total = posts.length;
  const data = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([type, value]) => ({
      name: LABELS[type as keyof typeof LABELS],
      value,
      type,
      percent: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
      color: COLORS[type as keyof typeof COLORS],
    }));

  return (
    <div className="glass rounded-2xl p-6">
      <div className="mb-4">
        <h3 className="text-white font-semibold text-base">Tipos de Conteúdo</h3>
        <p className="text-white/40 text-xs mt-0.5">Distribuição por formato no período</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
            paddingAngle={3} dataKey="value" strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.type} fill={entry.color} opacity={0.85} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend iconType="circle" iconSize={8}
            formatter={(value) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
