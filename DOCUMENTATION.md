# CASSINO FALSO — DOCUMENTAÇÃO TÉCNICA COMPLETA

> Plataforma educacional de jogos de azar fictícios para conscientização sobre vício em apostas.

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Repositórios GitHub](#repositórios-github)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Estrutura do Projeto](#estrutura-do-projeto)
5. [Funções e Alterações Realizadas](#funções-e-alterações-realizadas)
6. [RPCs Supabase](#rpcs-supabase)
7. [Migrations](#migrations)
8. [Deploy](#deploy)
9. [Dependências Externas](#dependências-externas)

---

## 🎯 VISÃO GERAL

O **Cassino Falso** é uma aplicação web educacional que simula jogos de azar com fichas fictícias. O objetivo é demonstrar padrões de comportamento problemáticos em jogos de apostas sem utilizar dinheiro real.

### Características

- 4 jogos: Poker, Blackjack, Jogo do Bicho, Roleta
- Sistema de autenticação via Supabase
- Lobby online com criação/entrada em salas
- Realtime via Supabase Subscriptions
- Sistema de apostas fictícias com apostas demonstrativas
- Interface responsiva (mobile + desktop)
- Modais educacionais sobre vício em apostas

---

## 🔗 REPOSITÓRIOS GITHUB

| Repositório | URL | Descrição |
|-------------|-----|-----------|
| **Principal (Instituto)** | [Instituto-Formar-Turma-Tec/cassino-falso](https://github.com/Instituto-Formar-Turma-Tec/cassino-falso) | Repositório oficial do projeto |
| **Fork Adriel** | [adrielhs/cassino-falso](https://github.com/adrielhs/cassino-falso) | Fork do Adriel Hipolito |
| **Fork Victor** | [VictorRamosHC/cassino-falso](https://github.com/VictorRamosHC/cassino-falso) | Fork do Victor Ramos |
| **Projeto Secundário** | [VictorRamosHC/cassino-reverso](https://github.com/VictorRamosHC/cassino-reverso) | Versão Next.js (não é este projeto) |

### Pull Requests Abertas

- **PR #1**: VictorRamosHC → adrielhs/cassino-falso
- **PR #2**: VictorRamosHC → Instituto-Formar-Turma-Tec/cassino-falso
- **PR #3**: VictorRamosHC → Instituto-Formar-Turma-Tec/cassino-falso

---

## 🛠️ STACK TECNOLÓGICA

### Frontend

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **React** | 19.0.0 | UI framework |
| **TypeScript** | 5.7.0 | Tipagem estática |
| **Vite** | 8.0.5 | Build tool |
| **Tailwind CSS** | 4.0.0 | Estilização utilitária |
| **@tailwindcss/vite** | 4.0.0 | Integração Tailwind+Vite |

### Backend (BaaS)

| Tecnologia | Versão | Finalidade |
|------------|--------|------------|
| **Supabase** | ^2.116.0 | Backend-as-a-Service |
| **PostgreSQL** | — | Banco de dados |
| **Supabase Realtime** | — | Subscriptions WebSocket |
| **Supabase Auth** | — | Autenticação JWT |

### DevOps

| Ferramenta | Finalidade |
|------------|------------|
| **Vercel** | Hosting e deploy |
| **Vitest** | Testes unitários (configurado) |

---

## 📁 ESTRUTURA DO PROJETO

```
cassino-falso/
├── src/
│   ├── App.tsx                    # Componente raiz (~2552 linhas)
│   ├── main.tsx                   # Entry point React
│   ├── index.css                  # Tailwind v4 + tema customizado
│   ├── components/
│   │   ├── ui/                    # Componentes de UI reutilizáveis
│   │   ├── games/
│   │   │   ├── GamePoker.tsx      # Jogo de Poker
│   │   │   ├── GameBlackjack.tsx  # Jogo de Blackjack
│   │   │   ├── GameBicho.tsx      # Jogo do Bicho
│   │   │   ├── GameRoulette.tsx   # Roleta
│   │   │   └── GameSlot.tsx       # Caça-níqueis
│   │   ├── online/
│   │   │   ├── OnlineGames.tsx    # Jogos online (lazy loaded)
│   │   │   ├── OnlineLobby.tsx    # Lobby de salas
│   │   │   ├── OnlineRoomShell.tsx # Shell da sala
│   │   │   ├── PokerOnline.tsx    # Poker multiplayer
│   │   │   ├── BlackjackOnline.tsx # Blackjack multiplayer
│   │   │   └── BichoOnline.tsx    # Bicho multiplayer
│   │   └── panels/
│   │       ├── ContaPanel.tsx     # Painel da conta
│   │       ├── RankingPanel.tsx   # Ranking
│   │       ├── ExtratoPanel.tsx   # Extrato de transações
│   │       └── PerfilPanel.tsx    # Perfil do usuário
│   └── lib/
│       ├── auth.ts                # Autenticação Supabase
│       ├── supabase.ts            # Cliente Supabase
│       ├── db.ts                  # Funções de banco de dados
│       ├── game-engine.ts         # Engine dos jogos
│       ├── room-api.ts            # API de salas online
│       ├── online-room.tsx        # Hook useOnlineRoom
│       ├── rate-limit.ts          # Rate limiting
│       └── utils-data.ts          # Utilitários de dados
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql           # Schema inicial
│       ├── 002_core_functions.sql           # Funções principais
│       ├── 003_grants.sql                   # Permissões
│       ├── 004_rooms_online.sql             # Salas online
│       ├── 005_rooms_turno_online.sql       # Turnos online
│       ├── 006_online_turnos.sql            # Sistema de turnos
│       └── 007_filter_rooms_by_game.sql     # Filtro por jogo (NOVA)
├── public/                                 # Assets estáticos
├── index.html                              # HTML entry
├── vercel.json                             # Config Vercel
├── vite.config.ts                          # Config Vite
├── tsconfig.json                           # Config TypeScript
├── package.json                            # Dependências
└── README.md                               # Documentação básica
```

---

## 🔧 FUNÇÕES E ALTERAÇÕES REALIZADAS

### 1. AUTENTICAÇÃO (`src/lib/auth.ts`)

#### Funções

| Função | Descrição |
|--------|-----------|
| `getUser()` | Retorna usuário autenticado ou `null` |
| `signInAnonymously()` | Login anônimo via Supabase |
| `signOut()` | Logout e limpa localStorage |
| `getOrCreateUser()` | Busca ou cria usuário no banco |
| `updateUserSaldo()` | Atualiza saldo fictício |

#### Alterações

- ✅ **Rate limiting** adicionado a `login` e `register` (5 tentativas/15min por IP)
- ✅ **Loading state** (`isLoading`) adicionado ao `App.tsx`
- ✅ **Error handling** em todas as operações assíncronas

---

### 2. SALAS ONLINE (`src/lib/room-api.ts`)

#### Funções RPC

| Função Supabase | Parâmetros | Descrição |
|-----------------|------------|-----------|
| `criar_sala_turnos` | `p_jogo, p_nome, p_max_jogadores?, p_aposta_centavos?` | Cria nova sala |
| `entrar_sala_turnos` | `p_codigo, p_user_id, p_nome` | Entra em sala existente |
| `sair_sala_turnos` | `p_codigo, p_user_id` | Sai da sala |
| `iniciar_partida_turnos` | `p_codigo, p_user_id` | Inicia partida |
| `estado_sala_turnos` | `p_codigo` | Busca estado atual da sala |
| `listar_salas_turnos` | `p_jogo?` | **Lista salas disponíveis** |
| `acao_turno` | `p_codigo, p_user_id, p_acao` | Executa ação no turno |
| `finalizar_poker` | `p_codigo, p_vencedor` | Finaliza mão de poker |

#### Alterações

- ✅ **Isolamento por jogo**: `listarSalas(jogo)` agora envia `p_jogo` ao backend
- ✅ **Filtro local**: `salas.filter((s) => s.jogo === jogo)` como defesa em profundidade
- ✅ **maxJogadores propagado**: Lobby → Hook → API → Supabase

---

### 3. HOOK useOnlineRoom (`src/lib/online-room.tsx`)

#### Funções

| Função | Descrição |
|--------|-----------|
| `criarSala(jogo, nome, maxJogadores)` | Cria sala online |
| `entrarSala(codigo)` | Entra em sala pelo código |
| `sairSala()` | Sai da sala atual |
| `iniciarPartida()` | Inicia a partida |
| `executarAcao(acao)` | Executa ação no turno |
| `refresh()` | Atualiza lista de salas |

#### Alterações

- ✅ **Estado `loading`** adicionado para controle de UI
- ✅ **Estado `erro}`** adicionado para mensagens de erro
- ✅ **Cleanup** no unmount (previne memory leak)
- ✅ **Conexão realtime** com cleanup correto

---

### 4. COMPONENTES DE JOGO (`src/components/games/`)

#### GamePoker.tsx

| Função | Descrição |
|--------|-----------|
| `handRank(hand)` | Avaliação de mãos de poker |
| `dealCards()` | Distribui cartas |

**Alterações:**
- ✅ `gameStateRef` substitui `gameState` no `useEffect` para evitar re-renders em cadeia
- ✅ Timeout de 900ms com cleanup
- ✅ Bot plays automatically

#### GameBlackjack.tsx

| Função | Descrição |
|--------|-----------|
| `dealInitialCards()` | Distribui cartas iniciais |
| `hit()` | Pedir carta |
| `stand()` | Parar |

**Alterações:**
- ✅ **Natural 21** corrigido: só paga 3x quando é 2 cartas (ás + 10)
- ✅ Antes: qualquer 21 acionava o payout natural

#### GameBicho.tsx

| Função | Descrição |
|--------|-----------|
| `placeBet(animal, value)` | Fazer aposta |
| `sortear()` | Sortear resultado |

#### GameRoulette.tsx

| Função | Descrição |
|--------|-----------|
| `spin()` | Gira a roleta |

**Alterações:**
- ✅ **`setInterval(16ms)` → `requestAnimationFrame(~32ms)`** — Reduziu de ~60fps para ~30fps
- ✅ **`cancelAnimationFrame` no cleanup** — Evita loops órfãos
- ✅ **Resultado preservado** — Mesma lógica de cálculo

---

### 5. COMPONENTES ONLINE (`src/components/online/`)

#### OnlineLobby.tsx

| Função | Descrição |
|--------|-----------|
| `refresh()` | Atualiza lista de salas |
| `handleCriarSala()` | Abre modal de criação |
| `handleEntrarSala(codigo)` | Entra em sala |

**Alterações:**
- ✅ **Filtro por jogo**: `refresh()` chamado com `[jogo]` como dependência
- ✅ **Loading states**: `disabled={loading}` em todos os botões

#### OnlineGames.tsx

**Alterações:**
- ✅ **Lazy loading**: `React.lazy()` + `<Suspense fallback={...}>`

---

### 6. DASHBOARD E PAINÉIS (`src/App.tsx`)

#### Funções Principais

| Função | Descrição |
|--------|-----------|
| `renderAuthModal()` | Modal de autenticação |
| `renderGameModal()` | Modal de jogo |
| `renderDepositModal()` | Modal de depósito |
| `renderLobbyModal()` | Modal do lobby |
| `LossCounter()` | Contador de perdas (isolado) |

#### Alterações

- ✅ **Loading inicial**: Tela "Carregando..." até dados do usuário
- ✅ **Perfil dinâmico**: `PerfilPanel({ user })` — sem "João" hardcoded
- ✅ **LossCounter isolado**: Não re-renderiza o Header a cada 5s
- ✅ **Modais sem `backdrop-filter: blur`** — Reduz custo GPU
- ✅ **Borda dourada estática** — Sem animação infinita de `box-shadow`
- ✅ **GoldParticles reduzido**: 12 → 6 partículas, opacidade 0.15 → 0.08
- ✅ **LiveTicker reduzido**: 9 → 5 itens
- ✅ **Mobile**: `pb-16` compensa bottom nav

---

## 🗄️ RPCS SUPABASE

### Detalhamento das Funções

#### `criar_sala_turnos`

```sql
CREATE OR REPLACE FUNCTION public.criar_sala_turnos(
  p_jogo text,
  p_nome text,
  p_max_jogadores integer DEFAULT 6,
  p_aposta_centavos integer DEFAULT 1000
)
RETURNS uuid
```

**Validações:**
- `max_jogadores` BETWEEN 2 AND 6
- Retorna UUID da sala criada

---

#### `entrar_sala_turnos`

```sql
CREATE OR REPLACE FUNCTION public.entrar_sala_turnos(
  p_codigo text,
  p_user_id uuid,
  p_nome text
)
RETURNS jsonb
```

**Validações:**
- `FOR UPDATE` lock na linha da sala
- `cnt >= max_jogadores` → "Sala cheia"
- `UNIQUE (room_id, user_id)` → Impede duplicação

---

#### `iniciar_partida_turnos`

```sql
CREATE OR REPLACE FUNCTION public.iniciar_partida_turnos(
  p_codigo text,
  p_user_id uuid
)
RETURNS void
```

**Validações:**
- Status deve ser `aguardando`
- Mínimo 2 jogadores
- Somente o criador pode iniciar

---

#### `listar_salas_turnos`

```sql
-- Migration 007
CREATE OR REPLACE FUNCTION public.listar_salas_turnos(
  p_jogo text DEFAULT NULL  -- NOVO
)
RETURNS jsonb
```

**Filtro:**
```sql
WHERE r.status = 'aguardando'
  AND (p_jogo IS NULL OR r.jogo = p_jogo)  -- NOVO
ORDER BY r.created_at DESC
```

**Nota:** Migration 007 existe no repositório mas depende de aplicação no Supabase real.

---

## 🗃️ MIGRATIONS

| # | Arquivo | Descrição |
|---|---------|-----------|
| 001 | `001_initial_schema.sql` | Schema inicial (users, transactions) |
| 002 | `002_core_functions.sql` | Funções de saldo e transações |
| 003 | `003_grants.sql` | Grants para anon/authenticated |
| 004 | `004_rooms_online.sql` | Tabelas de salas |
| 005 | `005_rooms_turno_online.sql` | Sistema de turnos |
| 006 | `006_online_turnos.sql` | RPCs de criação/entrada/saída/início |
| 007 | `007_filter_rooms_by_game.sql` | **Filtro p_jogo em listar_salas_turnos** |

### Migration 007 — Detalhes

```sql
-- Adiciona parâmetro opcional p_jogo
CREATE OR REPLACE FUNCTION public.listar_salas_turnos(p_jogo text DEFAULT NULL)
  RETURNS jsonb
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT jsonb_agg(...)
    FROM public.rooms r
    WHERE r.status = 'aguardando'
      AND (p_jogo IS NULL OR r.jogo = p_jogo)  -- filtro
    ORDER BY r.created_at DESC
  );
END;
$$;

-- Grants para ambas as assinaturas
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos TO anon;
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos(text) TO anon;
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos TO authenticated;
GRANT EXECUTE ON FUNCTION public.listar_salas_turnos(text) TO authenticated;
```

**Status:** ⚠️ Existe no repositório; aplicação no Supabase real pendente.

---

## 🚀 DEPLOY

### Vercel

| Item | Configuração |
|------|--------------|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Rewrites | SPA fallback |

### Variáveis de Ambiente

| Variável | Tipo | Descrição |
|----------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Pública | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Pública | Chave anônima do Supabase |

**Nota:** São variáveis públicas (prefixo `NEXT_PUBLIC_`). Não há service-role key no frontend.

---

## ⚠️ DEPENDÊNCIAS EXTERNAS

### Pendentes de Ação

| Item | Responsável | Status |
|------|-------------|--------|
| Migration 007 no Supabase real | Adriel | ⏳ Pendente |
| Deploy Vercel | Adriel | ⏳ Pendente |
| Variáveis de ambiente | Adriel | ⏳ Pendente |
| Testes em produção | Adriel | ⏳ Pendente |

---

## 📊 MÉTRICAS DE PERFORMANCE

### Antes → Depois

| Métrica | Antes | Depois |
|---------|-------|--------|
| Roleta FPS | ~60 renders/s (setInterval 16ms) | ~30 renders/s (rAF ~32ms) |
| GoldParticles | 12 partículas, opacity 0.15 | 6 partículas, opacity 0.08 |
| LiveTicker | 9 itens | 5 itens |
| LossCounter render | Header inteiro | Componente isolado |
| Modal GPU | backdrop-filter blur(8px) | Removido |
| Modal border | gold-border-anim infinito | Estático |
| OnlineGames bundle | Carregamento eager | Lazy loading |

---

## 🔐 SEGURANÇA

### Implementado

| Item | Status |
|------|--------|
| Service-role key no frontend | ❌ Não existe (correto) |
| XSS via dangerouslySetInnerHTML | ✅ Dados estáticos, sem risco |
| Rate limiting (login/register) | ✅ 5 tentativas/15min |
| SQL Injection | ✅ RPCs parametrizadas |
| Concorrência (última vaga) | ✅ FOR UPDATE + UNIQUE |
| Dupla entrada em sala | ✅ UNIQUE (room_id, user_id) |

---

## 👥 CONTRIBUIDORES

| Nome | GitHub | Função |
|------|--------|--------|
| Victor Ramos | [@VictorRamosHC](https://github.com/VictorRamosHC) | Dev auditor |
| Adriel Hipolito | [@adrielhs](https://github.com/adrielhs) | Dev original |

---

## 📝 COMMITS FINAIS

| Hash | Mensagem | Queue |
|------|----------|-------|
| `3b63c6b` | fix: correções P1 — Loading, Perfil, Salas, Jogadores | 2-7 |
| `2dd7a4b` | fix: isolate online rooms by game | 8-9 |
| `a683653` | perf: otimizações mobile - GoldParticles e lazy loading | 8-9 |
| `9d8593e` | perf: mobile optimizations part 2 - LiveTicker + willChange | 11 |
| `f1d2cf0` | perf: correções de performance mobile (Queues 8-11) | 11 |

---

## 📅 HISTÓRICO DE QUEUES

| Queue | Foco | Problemas Encontrados |
|-------|------|----------------------|
| 1-2 | Tailwind v4 migration | 0 |
| 3-4 | Red Team Audit | 2 (handRank, blackjack natural) |
| 5-6 | SQL Validation | 1 (RPC sem p_jogo) |
| 7 | Clone + análise | — |
| 8-9 | Loading, Perfil, Salas, Jogadores | 5 corrigidos |
| 10 | Performance | 7 corrigidos |
| 11 | Validações finais | 0 |
| 12-18 | Auditorias (QA, UX, Segurança, etc.) | 0 críticos |
| 19-20 | Regressão + GO | 0 |
| 21 | Commit final | ✅ Concluído |

---

*Documentação gerada em 16/09/2026 — Hermes Agent (Captain Version 🏴‍☠️)*
