import { Coffee } from 'lucide-react';

interface HeaderProps {
  username?: string;
  followers?: number;
  profilePic?: string;
}

export default function Header({ username, followers, profilePic }: HeaderProps) {
  return (
    <header className="relative overflow-hidden bg-gradient-to-br from-[#1a0a00] via-[#2d1200] to-[#0f0f0f] border-b border-white/10">
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, #f97316 0%, transparent 50%), radial-gradient(circle at 80% 20%, #9333ea 0%, transparent 40%)'
        }}
      />
      <div className="relative max-w-7xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-2 border border-white/10">
            <Coffee size={20} className="text-amber-400" />
            <span className="text-white/60 text-sm font-medium">Ambrone</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Ambrone Café Empório
            </h1>
            <p className="text-white/50 text-sm mt-0.5">
              Relatório de Performance · Instagram · Jul/2025 – Mai/2026
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {profilePic && (
            <img src={profilePic} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" />
          )}
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-white">
              <span className="text-pink-400 text-sm">📷</span>
              <span className="text-sm font-semibold">
                {username ? `@${username}` : '@ambronecafe'}
              </span>
            </div>
            {followers !== undefined && (
              <p className="text-white/40 text-xs">
                {followers.toLocaleString('pt-BR')} seguidores
              </p>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
