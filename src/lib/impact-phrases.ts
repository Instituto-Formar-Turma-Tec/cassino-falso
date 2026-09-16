// Banco de Frases Reais de Impacto e Alertas Pedagógicos (Vício em Apostas / Cassinos)

export interface ImpactQuote {
  autor: string
  contexto: string
  depoimento: string
}

export const DEPOSIT_IMPACT_QUOTES: ImpactQuote[] = [
  {
    autor: "Relato Real — Ex-apostador (34 anos)",
    contexto: "Perda da casa e dívida com agiotas",
    depoimento:
      "Comecei depositando R$ 50 achando que era só diversão. Em 6 meses, depositei as economias de 10 anos de trabalho, vendi o carro da família e fiquei devendo R$ 80 mil para agiotas. Perdi minha esposa e moro de aluguel em um quarto.",
  },
  {
    autor: "Relato Real — Estudante Universitário (22 anos)",
    contexto: "Dinheiro da faculdade e aluguel",
    depoimento:
      "Fiz um depósito com o dinheiro do aluguel achando que ia dobrar em 10 minutos. Perdi tudo. Tive que trancar a faculdade, fui despejado e passei a ter crises de pânico diárias.",
  },
  {
    autor: "Relato Real — Mãe de Família (41 anos)",
    contexto: "Reserva de emergência dos filhos",
    depoimento:
      "Depositei a economia que guardava para o tratamento de saúde da minha filha. Prometi a mim mesma que seria a 'última vez'. O cassino levou R$ 12 mil em menos de uma hora.",
  },
  {
    autor: "Relato Real — Trabalhador CLT (29 anos)",
    contexto: "Fundo de garantia e rescisão",
    depoimento:
      "Fui demitido e depositei toda a minha rescisão contratual buscando 'fazer renda extra'. Perdi R$ 18 mil em uma tarde. O desespero foi tão grande que tentei tirar minha própria vida.",
  },
  {
    autor: "Alerta Científico & Psiquiátrico",
    contexto: "Mecanismo Neurológico do Depósito",
    depoimento:
      "Depósitos impulsivos acionam o mesmo circuito de dependência química da cocaína no cérebro. O aplicativo foi desenhado por engenheiros para transformar o ato de depositar em um gatilho incontrolável de ansiedade.",
  },
  {
    autor: "Relato Real — Servidor Público (45 anos)",
    contexto: "Empréstimo no Cartão de Crédito",
    depoimento:
      "Usei o cartão de crédito para fazer um PIX de R$ 2.000 para a casa de aposta. Não consegui pagar a fatura e os juros de 440% ao ano transformaram minha dívida em R$ 28 mil em poucos meses.",
  },
]

export const WIN_IMPACT_QUOTES: ImpactQuote[] = [
  {
    autor: "Estatística de Cassino & Matemática",
    contexto: "A Ilusão da Vitória Temporária",
    depoimento:
      "Você ganhou agora, mas o algoritmo foi desenhado para isso: pequenas vitórias aleatórias geram descargas de dopamina que te fazem continuar apostando até perder 100% do seu patrimônio no longo prazo.",
  },
  {
    autor: "Relato Real — Vítima do 'Efeito Ganho'",
    contexto: "Ganhou R$ 2.000 no primeiro dia",
    depoimento:
      "Ganhar no começo foi a pior coisa que aconteceu na minha vida. Achei que tinha o 'dom'. No mês seguinte, tentei repetir o feito e perdi R$ 45.000, meu casamento e meu emprego.",
  },
  {
    autor: "Alerta Pedagógico do Cassino Reverso",
    contexto: "House Edge / RTP Insustentável",
    depoimento:
      "Nenhum cassino distribui dinheiro de graça. Todo prêmio exibido na sua tela vem do desespero e das dívidas de centenas de outras pessoas que perderam suas economias hoje.",
  },
  {
    autor: "Depoimento em Audiência Pública sobre Bet",
    contexto: "Armadilha do Lucro Fictício",
    depoimento:
      "Quando você ganha R$ 100, o cérebro acredita que você é invencível. Isso te convence a apostar R$ 1.000 no dia seguinte. É a isca mais perigosa já criada pela tecnologia.",
  },
]

export function getRandomQuote(quotes: ImpactQuote[]): ImpactQuote {
  const idx = Math.floor(Math.random() * quotes.length)
  return quotes[idx]
}

export function getEquivalenciaFinanceira(valorReais: number): {
  item: string
  emoji: string
  descricao: string
} {
  if (valorReais <= 50) {
    return {
      item: "Cesta Básica Familiar (semanal)",
      emoji: "🛒",
      descricao: "Alimentação essencial para uma família por dias.",
    }
  } else if (valorReais <= 150) {
    return {
      item: "Conta de Luz ou Água",
      emoji: "💡",
      descricao: "Garante serviços fundamentais da residência.",
    }
  } else if (valorReais <= 500) {
    return {
      item: "Aluguel ou Prestação Residencial",
      emoji: "🏠",
      descricao: "A garantia de ter um teto seguro para a família.",
    }
  } else if (valorReais <= 1200) {
    return {
      item: "1 Salário Mínimo de Trabalho Duro",
      emoji: "💸",
      descricao: "Resultado de 30 dias de esforço de um trabalhador.",
    }
  } else {
    return {
      item: "Reserva de Emergência / Parcela de Veículo",
      emoji: "🚗",
      descricao: "Patrimônio e segurança financeira construídos a longo prazo.",
    }
  }
}
