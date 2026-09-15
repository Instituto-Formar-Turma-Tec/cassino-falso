# Especificação — Fluxo Etapa a Etapa + Barra de Ferramentas (Mobile)

> Documento que serve como "prompt" para a equipe implementar a identidade e o fluxo do app. Pode ser lido por desenvolvedores, apresentadores e qualquer pessoa que precise entender como o app funciona.

---

## 🔄 FLUXO DO APP — Etapa a Etapa

### Etapa 0: Tela de Login/Registro

**O que a pessoa vê:**
- Fundo escuro com textura sutil de cassino (ou padrão geométrico dourado/preto)
- Logo "CASSINO REVERSO" em destaque (dourado, com efeito neon suave)
- Formulário simples:
  - Campo "Matrícula" (obrigatório)
  - Campo "Senha" (obrigatório)
  - Campo "Nome" (aparece só no registro, não no login)
  - Botão "ENTRAR" (dourado, grande, fácil de tocar)
  - Link "Criar conta" (se não tiver)
- Botão "Sair" ou "Voltar" não existe aqui — é a entrada

**O que acontece:**
- Login: valida matrícula + senha → se ok, vai para o Dashboard
- Registro: cadastra nome + matrícula + senha → loga automaticamente → vai para o Dashboard

**Que sensação deve passar:**
- É um app "secreto" — parece cassino, mas é educativo
- Não é simples "login", é a porta de entrada pra uma experiência
- A pessoa já deve sentir que vai jogar — mas não sabe ainda o que vai acontecer

---

### Etapa 1: Dashboard (tela inicial após login)

**O que a pessoa vê:**
- Topo: nome da pessoa + botão "Sair" (canto superior direito)
- Hero: "Quem perde menos, ganha." (título grande)
- Cards de estatísticas em grid (2x2 no mobile, 4x1 ou 4 colunas):
  - 💰 Saldo (R$)
  - 💔 Perdido (R$)
  - 🎯 Rodadas
  - ⚠️ Risco (0-100)
- Banner sutil: "A casa sempre lucra. Sua missão: sobreviver o máximo possível."
- Indicador "SERVIDOR ONLINE" (pode ser um LED verde no canto)

**O que NÃO aparece aqui ainda:**
- Jogos (isso vem na próxima etapa)
- Ranking (isso fica na barra de ferramentas)

**Botões de ação:**
- "ESCREVER APOSTA" ou "Jogar" — leva para a seleção de jogos
- Ou: a seleção de jogos já pode ser direto na dashboard (a gente decide)

---

### Etapa 2: Seleção de Jogos

**O que a pessoa vê:**
- Grid de 6 jogos (ou lista horizontal de cards):
  - 🎰 Slot — "Caça-Níquel"
  - 🐰 Bicho — "Jogo do Bicho"
  - 🎲 Dados — "Tabuleiro"
  - 🎠 Roleta — "Roleta Russa"
  - 🃏 Blackjack — "Blackjack"
  - 🂡 Poker — "Pôquer"
- Cada jogo é um card:
  - Ícone grande
  - Nome do jogo
  - Descrição curta
  - "Edge" ou "vantagem da casa" mostrado de forma visual (barra colorida ou ícone), sem números técnicos

**Como funciona:**
- A pessoa clica no jogo → vai para a tela de jogo
- Ou pode haver uma seleção prévia de "quantos jogos quer jogar" (ex: "escolha 3 jogos para hoje")

**Que sensação:**
- É como um "menu" de cassino — cada jogo é atraente
- A pessoa escolhe com base no ícone e no nome, não em números
- O "edge" mostra que cada jogo tem vantagem da casa, mas sem ser técnico

---

### Etapa 3: Tela de Jogo (cada jogo)

**O que a pessoa vê (exemplo: Slot):**

- Título do jogo ("Caça-Níquel") no topo
- Área do jogo (os 3 rolos, animando)
- Área de "aposta":
  - Seletor de valor (R$5, R$10, R$25, R$50, R$100) — na parte inferior, antes dos botões
  - Botão "GIRAR" (grande, dourado, fácil de tocar)
- **Barra de Ferramentas** (fixed no bottom — ver seção abaixo)

**Para cada jogo, a estrutura é similar:**
- Topo: nome do jogo
- Meio: a experiência do jogo (rolos, dado, cartas, etc.)
- Inferior: aposta + botão de jogar + barra de ferramentas

**Que sensação:**
- É a experiência principal — a pessoa joga
- O foco é no jogo, não nos detalhes administrativos
- A barra de ferramentas permite acessar o saldo, perfil, ranking SEM sair do jogo

---

### Etapa 4: Resultado da Rodada

**O que a pessoa vê:**
- Após clicar em "GIRAR" ou "APOSTAR":
  - Animação do jogo (rolagem, rolagem do dado, flip de carta, etc.)
  - Tempo de espera (1-3 segundos, para gerar antecipação)
  - Resultado:
    - Vitória: confetti + verde + "GANHOU!" + novo saldo
    - Derrota: shake leve + vermelho + "PERDEU!" + novo saldo
- O saldo é atualizado na barra de ferramentas automaticamente

**Que sensação:**
- Antecipação → resultado → reação emocional
- A pessoa SENTE a vitória ou a derrota
- O saldo muda na barra de ferramentas — ela vê o dinheiro "sumir" ou "aparecer"

---

### Etapa 5: Voltar para Dashboard ou Continuar Jogando

**Opções após o resultado:**
1. **Continuar no mesmo jogo:** clicar em "Jogar novamente" → nova rodada no mesmo jogo
2. **Trocar de jogo:** tecla "voltar" ou botão "Jogos" na barra de ferramentas → volta para seleção de jogos
3. **Ver ranking:** ícone de ranking na barra de ferramentas → modal com leaderboard
4. **Ver extrato:** ícone de extrato na barra de ferramentas → histórico de apostas
5. **Sair:** botão "Sair" no topo

---

## 📱 BARRA DE FERRAMENTAS (FIXA NO BOTTOM — MOBILE)

### O que é

É a barra fixa na parte inferior da tela (como as barras de navegação de apps mobile como Instagram, WhatsApp, etc.) que dá acesso rápido a informações fundamentais SEM sair da experiência do jogo.

### Design visual

- **Posição:** fixed no bottom, acima do "ticker ao vivo" (se houver ticker)
- **Altura:** ~60-70px no mobile (botões grandes o suficiente para toque)
- **Fundo:** escuro com bordas douradas sutis (ou degradê escuro → dourado)
- **Botões:** 3 a 4 botões, ícones + texto curto

### Botões sugeridos (da esquerda para a direita)

| Ícone | Nome | O que faz |
|---|---|---|
| 💰 ou 🪙 | **Conta** | Abre um modal/overlay mostrando: saldo atual, total perdido, rodadas jogadas, risco score. É o "extrato rápido" |
| 👤 ou 👥 | **Perfil** | Abre um modal com: nome, matrícula, data de cadastro, stats resumidas. Pode ter "editar perfil" (nome) ou "sair" |
| 🏆 | **Ranking** | Abre leaderboard completo (modal ou tela cheia). Mostra top 10, "seu lugar", e como os outros estão jogando |
| 📊 | **Extrato** | Histórico completo de apostas com data, jogo, resultado, valor, saldo depois |
| (botao extra) | **Sair** | Botão vermelho ou escuro sutil — "Sair" ou "Encerrar sessão" |

**Layout sugerido:**
```
[💰 Conta]  [👤 Perfil]  [🏆 Ranking]  [📊 Extrato]  [🚪 Sair]
```
Ou com 3 botões + o "Sair" no canto:
```
[💰 Conta]  [🏆 Ranking]  [📊 Extrato]                [🚪 Sair]
```

### Como funciona na prática

- A barra é **sempre visível** durante o jogo (fixed)
- Quando a pessoa clica em um botão, abre um **modal overlay** (não muda de tela — é mais rápido e não quebra o fluxo)
- O modal cobre a parte superior da tela, mas a barra de ferramentas continua visível (ou desaparece se for o "Sair")
- Ao fechar o modal, a pessoa volta exatamente onde estava

### O que cada modal mostra

#### Modal "Conta" (💰)
- Saldo atual: R$ XXX,XX (grande, dourado)
- Total perdido: R$ XXX,XX (vermelho se positivo)
- Rodadas jogadas: XXX
- Risco: XX/100 (barra visual de risco)
- Botão "Fechar" ou "Voltar"

#### Modal "Perfil" (👤)
- Nome: Fulano
- Matrícula: XXX
- Desde: data
- Stats rápidas (copiar do "Conta")
- Botão "Sair da conta" (confirmação: "Tem certeza?")

#### Modal "Ranking" (🏆)
- Título: "🏆 Ranking — Quem perdeu menos"
- Lista de 10 jogadores:
  - Posição (1°, 2°, 3°...)
  - Nome
  - Saldo final
  - Total perdido
  - Rodadas
- Destaque para "Você está em #X" (se estiver no top 10)
- Botão "Fechar"

#### Modal "Extrato" (📊)
- Título: "📊 Histórico de Apostas"
- Lista de todas as rodadas (data, jogo, resultado, valor apostado, saldo depois)
- Formato: timeline ou tabela simples
- Botão "Fechar"

---

## 🎨 IDENTIDADE VISUAL — O que define "como é"

### Paleta

| Elemento | Cor | Uso |
|---|---|---|
| Fundo principal | Preto profundo (#0a0a0a ou similar) | Tela base |
| Dourado | #d4a843 ou #e8c547 | Destaque, botões principais, texto de valor, bordas importantes |
| Vermelho | #e53935 ou #ff1744 | Perdas, perigo, "Sair", mensagens de derrota |
| Verde | #4caf50 ou #69f0ae | Vitória, lucro, "online", mensagens de ganho |
| Cinza escuro | #1a1a1a | Superfícies, cards, backgrounds de modal |
| Branco | #ffffff | Texto secundário, ícones |

### Tipografia

- **Títulos:** fonte serifada (ou algo com peso — "neon-text" já existe no projeto)
- **Texto geral:** mono ou sans sem serif — legível no mobile
- **Valores de dinheiro:** mono, dourado, grande

### Elements visuais

- **LEDs:** pequenos círculos coloridos que "piscam" (verde para online, vermelho para perigo)
- **Glow:** textos e bordas com efeito de brilho dourado (ja existe no projeto)
- **Bordas douradas:** cards, modais, botões principais
- **Neon-text:** texto com brilho (já existe)
- **Partículas:** canvas com efeitos de vitória/derrota (já existe)
- **Textura:** fundo com padrão sutil (propositalmente "casino")

### Sensação a transmitir

- **Cassino real:** cores agressivas, dourado, preto, LEDs, brilho
- **Mas educativo:** a pessoa_SENTE que está em um cassino, mas o resultado final é "eu perdi dinheiro"
- **Viciante na forma, não no conteúdo:** a UI empurra pra jogar mais, mas o conteúdo (saldo caindo, ranking) mostra a realidade

---

## 🧠 FLUXO DE DECISÕES — O que a pessoa pensa em cada etapa

### Logo no login

- "O que é isso?" → "parece cassino, mas é da escola..."
- "Vou testar" → clica em entrar

### Na dashboard

- "Quanto eu tenho? R$100,00" → olha os cards
- "Quem perde menos ganha?" → "é novo pra mim"
- "Quais jogos tenho?" → clica em "Jogos"

### Na seleção de jogos

- "Slot parece legal" → clica
- "Bicho é o tradicional" → clica
- "Roleta é clássico" → clica
- (a pessoa escolhe pelo ícone/nome, não pelos números)

### No jogo

- "Vou apostar R$10" → escolhe o valor
- "Vamos ver" → clica em girar/apostar
- "Rola... rorque... resultado!" → reação
- "Saldo caiu/ subiu" → vê na barra de ferramentas

### Depois do resultado

- "Perdi de novo" → frustração
- "Quero tentar de novo" → volta ao jogo ou escolhe outro
- "Quero ver o ranking" → clica no ícone da barra
- "Quanto eu perdi no total?" → clica em "Conta"

---

## 📝 PROMPT PARA A EQUIPE (o que implementar)

> Vocês estão criando um app mobile-first onde a pessoa faz login, escolhe um jogo, joga, e tem acesso rápido ao saldo, perfil, ranking e extrato através de uma barra de ferramentas fixa no bottom.

**Regras de implementação:**

1. **Tela de login:** simples, com matrícula + senha + botão grande. Após login → dashboard.

2. **Dashboard:** mostra saldo, total perdido, rodadas, risco. Tem botão "Jogar" ou "Jogos" que leva para seleção.

3. **Seleção de jogos:** grid de 6 jogos (slot, bicho, dados, roleta, blackjack, poker). Cada jogo é um card com ícone, nome, descrição, e "vantagem da casa" mostrada visualmente (sem números técnicos).

4. **Tela de jogo:** título + experiência do jogo (rolos, dado, cartas, etc.) + seletor de aposta + botão de jogar. A barra de ferramentas fica fixa embaixo.

5. **Barra de ferramentas (fixa no bottom):** 3-4 botões (Conta, Perfil, Ranking, Extrato) + botão Sair. Sempre visível durante o jogo. Ao clicar, abre modal overlay (não muda de tela).

6. **Modal Conta:** saldo, total perdido, rodadas, risco score.

7. **Modal Perfil:** nome, matrícula, stats, botão sair.

8. **Modal Ranking:** leaderboard completo com top 10 e "seu lugar".

9. **Modal Extrato:** histórico de todas as rodadas.

10. **Identidade visual:** preto + dourado + vermelho + efeitos neon/glow. LEDs indicando status. Partículas em vitória/derrota.

11. **Sensação:** a UI é propositalmente viciante (como um cassino real), mas o conteúdo final mostra que a pessoa perdeu dinheiro.

**Evitar:** 
- Tela cheia de números técnicos (probabilidade, house edge) na experiência do jogo
- Que a pessoa saia do jogo para ver informações básicas
- Que o foco da UI seja "bonito" em vez de "viciante mas educativo"

---

## 🎬 EXEMPLO DE USO — Rotina de uma pessoa

1. Abre o app → faz login com matrícula e senha
2. Vê a dashboard: "Quem perde menos, ganha." — saldo R$100,00
3. Clica em "Jogos" → vê os 6 jogos
4. Escolhe Slot → vê os 3 rolos, escolhe R$10, clica em "Girar"
5. Rolagem animada... resultado: "GANHOU! 2.2×" → confetti
6. Saldo na barra de ferramentas atualiza: R$102,20 (ou similar, dependendo do cálculo)
7. Clica em "Ranking" na barra → vê leaderboard, "EU ESTOU EM #5"
8. Volta ao jogo, escolhe outro valor, joga de novo
9. Depois de 10 rodadas, clica em "Conta" → vê "Perdido: R$45,00"
10. Sente a realidade: "eu perdi dinheiro mesmo ganhando algumas vezes"
11. Clica em "Sair" → encerra

---

> Essa especificação é o "prompt" para a equipe. Qualquer dúvida, ajuste, ou nova funcionalidade, discutir antes de implementar. ★(◕‿◕)
