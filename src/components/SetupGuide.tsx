import { Key, ExternalLink, Terminal, CheckCircle } from 'lucide-react';

export default function SetupGuide() {
  const steps = [
    {
      title: 'Criar App no Meta Developers',
      desc: 'Acesse developers.facebook.com → Meus Apps → Criar App → Tipo: Business',
      link: 'https://developers.facebook.com',
      linkLabel: 'Abrir Meta for Developers',
    },
    {
      title: 'Adicionar Instagram Graph API',
      desc: 'No painel do App, clique em "Adicionar produto" → Instagram Graph API → Configurar',
    },
    {
      title: 'Conectar conta Instagram',
      desc: 'Vá em Configurações → Instagram → Adicionar conta Instagram Business conectada a uma Página do Facebook',
    },
    {
      title: 'Obter o User ID e Access Token',
      desc: 'Use o Graph API Explorer (ferramentas → Graph API Explorer) para obter: (1) User Access Token com permissões instagram_basic, instagram_manage_insights, pages_read_engagement; (2) Converta para Long-Lived Token (válido 60 dias)',
      link: 'https://developers.facebook.com/tools/explorer',
      linkLabel: 'Abrir Graph API Explorer',
    },
    {
      title: 'Configurar no Cloudflare Pages',
      desc: 'No dashboard do Cloudflare Pages → Projeto "ambrone" → Configurações → Variáveis de Ambiente → adicione INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8">
      <div className="glass rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-orange-500/10 rounded-xl">
            <Key size={24} className="text-orange-400" />
          </div>
          <div>
            <h2 className="text-white font-bold text-xl">Configurar Instagram API</h2>
            <p className="text-white/40 text-sm">Siga os passos para conectar dados reais</p>
          </div>
        </div>

        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white/3 rounded-xl border border-white/5">
              <div className="flex-shrink-0 w-7 h-7 bg-orange-500/20 rounded-full flex items-center justify-center">
                <span className="text-orange-400 text-xs font-bold">{i + 1}</span>
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium mb-1">{step.title}</p>
                <p className="text-white/50 text-xs leading-relaxed">{step.desc}</p>
                {step.link && (
                  <a
                    href={step.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-orange-400 text-xs hover:text-orange-300 transition-colors"
                  >
                    <ExternalLink size={11} />
                    {step.linkLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
          <div className="flex items-start gap-3">
            <Terminal size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-emerald-400 text-xs font-semibold mb-1">Após configurar as variáveis, faça um novo deploy:</p>
              <code className="text-emerald-300/70 text-xs font-mono">
                npx wrangler pages deploy dist --project-name=ambrone
              </code>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-blue-500/5 rounded-xl border border-blue-500/20">
          <div className="flex items-start gap-3">
            <CheckCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-white/50 text-xs leading-relaxed">
              Enquanto os dados reais não estão configurados, o relatório exibe dados demonstrativos
              realistas baseados em métricas típicas de uma cafeteria no Instagram.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
