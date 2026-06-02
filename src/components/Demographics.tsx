import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { DemographicsData } from '../types';

interface Props {
  data: DemographicsData;
}

const GENDER_COLORS = { M: '#3b82f6', F: '#ec4899', U: '#6b7280' };
const GENDER_LABELS = { M: 'Masculino', F: 'Feminino', U: 'Outro' };

const GenderTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-white/60 text-xs mb-1">{payload[0]?.payload?.age}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
          <span className="text-white/60">{GENDER_LABELS[p.dataKey as keyof typeof GENDER_LABELS]}:</span>
          <span className="text-white font-medium">{p.value.toLocaleString('pt-BR')}</span>
        </div>
      ))}
    </div>
  );
};

function GenderPie({ genderTotal }: { genderTotal: DemographicsData['genderTotal'] }) {
  const data = [
    { name: 'Feminino', value: genderTotal.F, color: GENDER_COLORS.F },
    { name: 'Masculino', value: genderTotal.M, color: GENDER_COLORS.M },
    { name: 'Outro', value: genderTotal.U, color: GENDER_COLORS.U },
  ].filter((d) => d.value > 0);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold text-base mb-1">Gênero</h3>
      <p className="text-white/40 text-xs mb-4">Distribuição dos seguidores</p>
      <div className="flex items-center gap-6">
        <div style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                dataKey="value" strokeWidth={0}>
                {data.map((d) => <Cell key={d.name} fill={d.color} opacity={0.85} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2 flex-1">
          {data.map((d) => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                <span className="text-white/60 text-xs">{d.name}</span>
              </div>
              <span className="text-white text-sm font-semibold">
                {total > 0 ? `${((d.value / total) * 100).toFixed(0)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AgeChart({ ageGender }: { ageGender: DemographicsData['ageGender'] }) {
  if (!ageGender.length) return null;
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold text-base mb-1">Faixa Etária</h3>
      <p className="text-white/40 text-xs mb-4">Seguidores por idade e gênero</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={ageGender} margin={{ top: 0, right: 0, bottom: 0, left: -10 }}>
          <XAxis dataKey="age" tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip content={<GenderTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
          <Legend iconType="circle" iconSize={8}
            formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>
              {GENDER_LABELS[v as keyof typeof GENDER_LABELS]}
            </span>}
          />
          <Bar dataKey="F" name="F" fill={GENDER_COLORS.F} opacity={0.85} radius={[3, 3, 0, 0]} stackId="a" />
          <Bar dataKey="M" name="M" fill={GENDER_COLORS.M} opacity={0.85} radius={[3, 3, 0, 0]} stackId="a" />
          <Bar dataKey="U" name="U" fill={GENDER_COLORS.U} opacity={0.85} radius={[3, 3, 0, 0]} stackId="a" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopList({ title, items }: { title: string; items: Array<{ name: string; value: number }> }) {
  if (!items.length) return null;
  const max = items[0]?.value || 1;
  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="text-white font-semibold text-base mb-4">{title}</h3>
      <div className="space-y-3">
        {items.slice(0, 6).map((item, i) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-white/30 text-xs w-4 text-right">{i + 1}</span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-white/80 text-xs">{item.name}</span>
                <span className="text-white/50 text-xs">{item.value.toLocaleString('pt-BR')}</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Demographics({ data }: Props) {
  const hasAge = data.ageGender.length > 0;
  const hasGender = data.genderTotal.M + data.genderTotal.F + data.genderTotal.U > 0;
  const hasCities = data.topCities.length > 0;

  if (!hasAge && !hasGender && !hasCities) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-white font-semibold text-lg">Dados Demográficos</h2>
        <p className="text-white/40 text-xs mt-0.5">Perfil dos seguidores do @ambrone</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {hasAge && <div className="lg:col-span-2"><AgeChart ageGender={data.ageGender} /></div>}
        {hasGender && <GenderPie genderTotal={data.genderTotal} />}
      </div>
      {hasCities && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopList title="Principais Cidades" items={data.topCities} />
        </div>
      )}
    </div>
  );
}
