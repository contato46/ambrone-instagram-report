import type { Post, MonthlyMetrics } from '../types';

const CAPTIONS = [
  'Começa bem o dia com nosso espresso especial ☕ Grãos selecionados da Serra da Mantiqueira, torrados artesanalmente aqui no Empório.',
  'Nova chegada! Café da Etiópia — notas de frutas vermelhas, flor de laranjeira e chocolate amargo. Perfeito para os apreciadores de cafés especiais 🌸',
  'Nossos croissants fresquinhos saem do forno todos os dias às 7h. Venha experimentar! 🥐',
  'O fim de semana merece um café bem feito. Cappuccino artesanal com leite vaporizado na temperatura perfeita ✨',
  'Conheça nossa linha de blends exclusivos — desenvolvidos pelo nosso barista campeão regional 🏆',
  'Quem disse que café é só bebida? É ritual, é pausa, é reconexão. Venha viver essa experiência no Ambrone 💫',
  'Grãos do Cerrado Mineiro chegaram! Notas de caramelo, mel e frutas secas. Safra limitada ⏳',
  'Nosso espaço foi pensado para quem aprecia momentos especiais. Reserve sua mesa agora 🪴',
  'Workshop de café em casa — aprenda a fazer a melhor xícara da sua vida. Inscrições abertas! 📚',
  'Cold brew de 24 horas para os dias quentes de verão ☀️ Disponível apenas no Empório.',
  'Pão de queijo mineiro feito na hora, quentinho e crocante por fora ♥️ Par perfeito pro café da tarde.',
  'Selecionamos os melhores grãos do Brasil e do mundo para você. Mais de 30 origens diferentes no nosso estoque 🌍',
  'A magia acontece aqui — do grão verde ao copo final 🔥 Torrefação artesanal, pequenos lotes.',
  'Domingo é dia de brunch especial no Ambrone! Cardápio especial das 9h às 13h 🌿',
  'Chegaram os cafés especiais de coleção — safras únicas que não se repetem. Venha conhecer!',
  'O melhor cappuccino da cidade está aqui. Espresso duplo, leite vaporizado, sem açúcar, sem frescura 🤍',
  'Nosso honey process está incrível essa safra! Fermentação natural, colheita manual. Vem provar? 🍯',
  'Kit presente para o Dia das Mães — mimo especial para quem ama café especial 💐',
  'Barismo é arte. Cada xícara é única quando feita com técnica e paixão. Vem aprender com a gente!',
  'Acaba de chegar nosso café da Jamaica Blue Mountain. Raridade que não pode ficar de fora da sua coleção ⭐',
  'Café coado no V60, no modo slow coffee — para quem quer extrair o melhor de cada grão 🫗',
  'Nossa torrefação artesanal garante grãos no ponto certo para cada método de preparo ♨️',
  'Inverno chegando — hora do latte quente com canela e baunilha 🍂',
  'Promoção relâmpago! Kit degustação de 5 origens com 20% de desconto. Só hoje! ⚡',
  'O que a família Ambrone pode fazer por você? Cafés que contam histórias, experiências que ficam na memória.',
  'Inauguramos nossa área externa! Agora você pode curtir seu café ao ar livre 🌳',
  'Blend de Natal chegou! Notas de especiarias, laranja e chocolate — edição limitada 🎄',
  'Parabéns para todos os aniversariantes de dezembro! Ganhem um espresso gratuito hoje 🎂',
  'Nosso Geisha é de cair o queixo — floral, delicado, complexo. Um café para experiências marcantes 🌺',
  'Semana do café especial — degustação gratuita todos os dias das 14h às 16h. Apareça!',
  'Aeropress, Chemex, French Press ou Moka? Qual é o seu método favorito? Conta pra gente! ☕',
  'Novidade no cardápio: Affogato com sorvete artesanal de baunilha e espresso. Combinação irresistível 🍨',
  'Grãos da Guatemala chegaram ao estoque! Sabor marcante, acidez cítrica equilibrada 🫘',
  'Feliz Ano Novo, família Ambrone! 2026 começa cheio de cafés incríveis e novidades 🥂',
  'Janeiro fitness? Que tal um cold brew zero adicionados para energizar seu treino? 💪',
  'Nossa cafeteira La Marzocco foi calibrada para extrações perfeitas. Venha ver a diferença! ⚙️',
  'Para os amantes de café natural: nosso Bourbon Amarelo da Chapada Diamantina está sensacional 🌟',
  'Dia dos Namorados no Ambrone — kits especiais para presentear quem você ama ❤️',
  'Técnica de latte art — nossos baristas treinaram meses para entregar essa experiência para você 🎨',
  'Chegaram os novos utensílios para preparo em casa — curate a sua experiência de café! 🛒',
  'Natural, honey ou washed — cada processo de benefício traz características únicas. Qual você prefere? 🤔',
  'Carnaval animado com café especial! Energia garantida para todos os dias de folia ⚡',
  'Nossa blend Ambrone House foi reformulada — mais equilibrada, mais complexa, mais gostosa! 🏠',
  'Café com leite vegetal? Temos oat milk, leite de amêndoas e coco. Todos batidos na perfeição! 🌱',
  'Especial Páscoa — Mocca com chocolate belga ao leite e espresso duplo 🐣',
  'Nosso aniversário se aproxima! Prepare-se para ofertas especiais e muito café bom 🎉',
  'Visita à fazenda parceira na Serra Gaúcha — conhecemos todo o processo da planta ao copo 🌾',
  'Grãos do Timor-Leste: raridade com notas terrosas e achocolatadas. Edição única! 🗺️',
  'Primeira colheita do nosso jardim de especiarias — canela, cravo e cardamomo fresquinhos 🌿',
  'Workshop de latte art — vagas limitadas para o próximo sábado. Inscreva-se já! 🎭',
];

const POST_IMAGES = [
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1516743619420-154b70a65fea?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1611564494260-6f21b80af7ea?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1485808191679-5f86510bd9d4?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1539252554453-80ab65ce3586?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1562547256-2c5ee93b60b7?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1592663527359-cf6642f54cff?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1503481766315-7a586b20f66d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1557855298-8e85f9c3b975?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1525193612562-0ec53b0e5d7c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504630083234-14187a9df0f5?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1472926218739-8ee02fbbfcd8?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1522992319-0365e5f11656?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1604881988758-f76ad2f7aac1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1578314675249-a6910f80cc4e?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1495616811223-4d98c6e9c869?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1508424757105-b6d5ad9329d0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1529973625058-a665431328fb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1426869981800-95ebf51ce900?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1518057111178-44a106bad636?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1610889556528-9a770e32642f?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1606791422814-b32c705e3e2f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=400&fit=crop',
];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function randomBetween(min: number, max: number, seed: number) {
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

const MONTHS_DATA: MonthlyMetrics[] = [
  { month: '2025-07', label: 'Jul/25', followers: 4520, followersGained: 180, posts: 16, reach: 28400, impressions: 41200, engagement: 1890, engagementRate: 4.2, profileVisits: 820, websiteClicks: 145 },
  { month: '2025-08', label: 'Ago/25', followers: 4780, followersGained: 260, posts: 18, reach: 32100, impressions: 47500, engagement: 2210, engagementRate: 4.6, profileVisits: 940, websiteClicks: 168 },
  { month: '2025-09', label: 'Set/25', followers: 5190, followersGained: 410, posts: 19, reach: 38700, impressions: 55300, engagement: 2680, engagementRate: 5.1, profileVisits: 1120, websiteClicks: 198 },
  { month: '2025-10', label: 'Out/25', followers: 5680, followersGained: 490, posts: 21, reach: 44200, impressions: 63800, engagement: 3140, engagementRate: 5.5, profileVisits: 1340, websiteClicks: 234 },
  { month: '2025-11', label: 'Nov/25', followers: 6240, followersGained: 560, posts: 22, reach: 52100, impressions: 74900, engagement: 3780, engagementRate: 5.9, profileVisits: 1580, websiteClicks: 278 },
  { month: '2025-12', label: 'Dez/25', followers: 7020, followersGained: 780, posts: 25, reach: 67400, impressions: 98200, engagement: 5120, engagementRate: 6.8, profileVisits: 2140, websiteClicks: 389 },
  { month: '2026-01', label: 'Jan/26', followers: 7280, followersGained: 260, posts: 17, reach: 45800, impressions: 66100, engagement: 3240, engagementRate: 5.2, profileVisits: 1420, websiteClicks: 245 },
  { month: '2026-02', label: 'Fev/26', followers: 7590, followersGained: 310, posts: 18, reach: 48900, impressions: 70400, engagement: 3560, engagementRate: 5.6, profileVisits: 1560, websiteClicks: 272 },
  { month: '2026-03', label: 'Mar/26', followers: 7980, followersGained: 390, posts: 20, reach: 55200, impressions: 79600, engagement: 4020, engagementRate: 5.8, profileVisits: 1740, websiteClicks: 308 },
  { month: '2026-04', label: 'Abr/26', followers: 8340, followersGained: 360, posts: 19, reach: 58700, impressions: 84500, engagement: 4380, engagementRate: 6.1, profileVisits: 1890, websiteClicks: 334 },
  { month: '2026-05', label: 'Mai/26', followers: 8820, followersGained: 480, posts: 21, reach: 65400, impressions: 94200, engagement: 5060, engagementRate: 6.5, profileVisits: 2120, websiteClicks: 378 },
];

const POST_TYPES: Array<'image' | 'video' | 'reel' | 'carousel'> = ['image', 'image', 'image', 'carousel', 'reel', 'video', 'image', 'carousel', 'reel', 'image'];

function generatePosts(): Post[] {
  const posts: Post[] = [];
  let postIndex = 0;

  MONTHS_DATA.forEach((month) => {
    const [year, monthNum] = month.month.split('-').map(Number);
    const daysInMonth = new Date(year, monthNum, 0).getDate();

    // Distribute posts evenly across the month — no loops, no random, no freeze risk
    const step = daysInMonth / (month.posts + 1);
    const postDates = Array.from({ length: month.posts }, (_, i) =>
      Math.min(Math.round(step * (i + 1)), daysInMonth),
    ).filter((d, i, arr) => arr.indexOf(d) === i);


    postDates.forEach((day, i) => {
      const seed = postIndex * 17 + i * 7;
      const type = POST_TYPES[seed % POST_TYPES.length];
      const likes = randomBetween(80, 620, seed + 1);
      const comments = randomBetween(8, 65, seed + 2);
      const saves = randomBetween(15, 180, seed + 3);
      const shares = randomBetween(5, 45, seed + 4);
      const reach = randomBetween(800, 4200, seed + 5);
      const impressions = Math.floor(reach * (1 + seededRandom(seed + 6) * 0.5));
      const engagement = likes + comments + saves + shares;
      const plays = type === 'reel' || type === 'video' ? randomBetween(400, 8000, seed + 7) : undefined;

      posts.push({
        id: `post_${postIndex}_${i}`,
        date: `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
        type,
        caption: CAPTIONS[(seed + postIndex) % CAPTIONS.length],
        thumbnail: POST_IMAGES[(seed + postIndex) % POST_IMAGES.length],
        likes,
        comments,
        saves,
        shares,
        reach,
        impressions,
        plays,
        engagementRate: parseFloat(((engagement / reach) * 100).toFixed(1)),
      });
      postIndex++;
    });
  });

  return posts.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export const ALL_POSTS: Post[] = generatePosts();
export const MONTHLY_METRICS: MonthlyMetrics[] = MONTHS_DATA;

export const DATE_RANGE = {
  start: '2025-07-01',
  end: '2026-05-31',
};
