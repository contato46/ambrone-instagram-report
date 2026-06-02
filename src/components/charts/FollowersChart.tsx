import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  timeline: Array<{ date: string; value: number }>;
  currentFollowers: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{label}</p>
      <p className="text-white font-semibold text-sm">
        {payload[0]?.value?.toLocaleString('pt-BR')} seguidores
      </p>
    </div>
  );
};

export default function FollowersChart({ timeline, currentFollowers }: Props) {
  const data = timeline.map(({ date, value }) => ({
    label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    value,
  }));

  const hasData = data.length > 1;
  const first = timeline[0]?.value ?? 0;
  const last = timeline[timeline.length - 1]?.value ?? currentFollowers;
  const gained = last - first;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-base">Crescimento de Seguidores</h3>
          <p className="text-white/40 text-xs mt-0.5">Últimos 30 dias</p>
        </div>
        {gained !== 0 && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            gained > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
          }`}>
            {gained > 0 ? '+' : ''}{gained.toLocaleString('pt-BR')}
          </span>
        )}
      </div>

      {hasData ? (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="followersGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="label" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
              axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              axisLine={false} tickLine={false} domain={['auto', 'auto']}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="value" stroke="#f97316" strokeWidth={2}
              fill="url(#followersGrad)" dot={false} activeDot={{ r: 4, fill: '#f97316' }} />
          </AreaChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <p className="text-white text-3xl font-bold">{currentFollowers.toLocaleString('pt-BR')}</p>
            <p className="text-white/40 text-xs mt-1">seguidores atuais</p>
          </div>
        </div>
      )}
    </div>
  );
}
