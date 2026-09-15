// ============================================================
// CASOS REAIS DE VÍCIO EM APOSTAS — material educativo
// Fonte: reportagens (correiodoestado.com, metro1.com, odia.ig.com)
// Cada caso é exibido como card educativo quando o usuário joga,
// para lembrar as consequências reais do jogo de azar.
// ============================================================

export interface CasoReal {
  id: number;
  perfil: string;
  perda: string;
  consequencias: string;
  fonte: string;
}

export const CASOS_REAIS: CasoReal[] = [
  {
    id: 1,
    perfil: 'Homem, funcionário público (Betano)',
    perda: 'R$ 597 mil (líquido)',
    consequencias:
      'Superendividamento, empréstimo com garantia do imóvel, relatório de 62 páginas no Banco Central.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 2,
    perfil: 'Policial militar (apostas esportivas + cassino)',
    perda: 'R$ 114 mil (líquido)',
    consequencias:
      'Divórcio, afastamento militar por 90 dias, internação psiquiátrica, ideação suicida.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 3,
    perfil: 'Administradora de empresas (Superbet)',
    perda: 'R$ 555 mil (líquido)',
    consequencias:
      'Conta reativada após suspeita de compulsão; execuções judiciais, desorganização econômica severa.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 4,
    perfil: 'Jovem vendedor (cassino online)',
    perda: '> R$ 60 mil',
    consequencias:
      'Vendeu máquina de terceiros, destruição do casamento, filha de 6 anos acolhida pelos avós.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 5,
    perfil: 'Gerente comercial (Blaze)',
    perda: 'R$ 127 mil (líquido)',
    consequencias:
      'Perdeu emprego de 8 anos, vendeu o carro, R$ 200 mil em dívidas bancárias.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 6,
    perfil: 'Jovem de 24 anos (Blaze)',
    perda: 'R$ 246 mil (depósitos, saque zero)',
    consequencias:
      '208 depósitos sucessivos, insônia crônica, depressão, contas de energia atrasadas.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 7,
    perfil: 'Motorista de aplicativo (esportivas + cassino)',
    perda: '> R$ 300 mil (estimado)',
    consequencias:
      'Atrasos na escola da filha, suspensão de energia, cartões inadimplidos.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 8,
    perfil: 'Trabalhador temporário com transtorno bipolar (Betano)',
    perda: '> R$ 100 mil',
    consequencias:
      'Dezenas de Pix diários, comprometimento de saúde, habitação e alimentação.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 9,
    perfil: 'Jovem de 23 anos, desempregado (4 plataformas)',
    perda: 'R$ 285.919,58',
    consequencias:
      'Dilapidou economias dos pais, recaída após ação judicial, ansiedade generalizada.',
    fonte: 'correiodoestado.com',
  },
  {
    id: 10,
    perfil: 'Auditor público (irmão de Juliana Prates)',
    perda: '~ R$ 1,5 milhão em dívidas',
    consequencias:
      'Suicídio; família só descobriu o vício após a morte, carta de despedida.',
    fonte: 'metro1.com',
  },
  {
    id: 11,
    perfil: 'Marceneiro "Igor", 26 anos (apostas esportivas)',
    perda: 'Salários integrais + dívidas com agiotas',
    consequencias:
      'Demitido, agrediu a própria mãe para conseguir dinheiro, perdeu 15 kg, pensou em suicídio.',
    fonte: 'metro1.com',
  },
  {
    id: 12,
    perfil: 'Hoteleiro Luendew, 31 anos (influência de influencers)',
    perda: 'Não estimado (empréstimos + cartões de terceiros)',
    consequencias:
      'Separação, agravamento de ansiedade/depressão, possível transtorno bipolar, entrou em autoexclusão.',
    fonte: 'metro1.com',
  },
  {
    id: 13,
    perfil: '"João", membro Jogadores Anônimos (15 anos de vício)',
    perda: 'Não estimado',
    consequencias:
      'Tentativa de suicídio ("fundo do poço"), hoje em abstinência há 2+ anos.',
    fonte: 'metro1.com',
  },
  {
    id: 14,
    perfil: 'Gabriel Lima, 27 anos (bingo online + bets)',
    perda: 'Não estimado (vendeu quase todos os bens)',
    consequencias:
      'Depressão, 3 meses de cama, pensamentos suicidas, internação e tratamento.',
    fonte: 'metro1.com',
  },
  {
    id: 15,
    perfil: 'Ex-gerente de casa de apostas',
    perda: '~ R$ 2 mil/semana (período não especificado)',
    consequencias:
      'Perdeu o casamento, confiança da família, deixou de trabalhar para focar nas apostas.',
    fonte: 'odia.ig.com',
  },
  {
    id: 16,
    perfil: 'Mulher, mãe e esposa (benefício social)',
    perda: 'Não estimado (3–4 anos)',
    consequencias:
      'Gastava benefício + empréstimos no nome dela e do pai; marido pagava dívidas; filhos afetados emocionalmente.',
    fonte: 'odia.ig.com',
  },
  {
    id: 17,
    perfil: 'Ailton Matos (Bahia)',
    perda: '~ R$ 2 milhões (sendo R$ 750 mil só no último ano)',
    consequencias:
      'Vendeu negócios (R$ 200 mil) e casa (R$ 155 mil), perdeu tudo em 3 dias, R$ 250 mil com agiotas; hoje vende doces na rua.',
    fonte: 'odia.ig.com',
  },
  {
    id: 18,
    perfil: 'Mulher (comunidade religiosa)',
    perda: '> R$ 150 mil',
    consequencias:
      'Usou dinheiro de uma comunidade que administrava; pensou em suicídio; só parou quando o dinheiro acabou.',
    fonte: 'odia.ig.com',
  },
  {
    id: 19,
    perfil: 'Fernando Galvão',
    perda: '> R$ 1 milhão',
    consequencias:
      'Depressão, percepção tardia do vício (2022), libertação em 2024.',
    fonte: 'odia.ig.com',
  },
  {
    id: 20,
    perfil: 'Ronaldo Menezes',
    perda: '~ R$ 500 mil',
    consequencias:
      'Vendeu carro e casa, empréstimos no nome de familiares/amigos, perdeu momentos com a filha, instabilidade financeira.',
    fonte: 'odia.ig.com',
  },
];