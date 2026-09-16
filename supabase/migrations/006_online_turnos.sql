-- =============================================================
-- Migration 006: Online Turnos — poker, blackjack, bicho
-- Sobre schema 004/005 (rooms/room_players/room_rounds).
-- Baralho + animal = seed determinístico → todos os clientes
-- veem a mesma mesa. Sem auth; user_id = ID anônimo estável.
-- PROTOTIPO EDUCACIONAL — não usar c/ dinheiro real.
-- =============================================================

do $$ begin
  begin alter table public.rooms add column estado_json jsonb; exception when duplicate_column then null; end;
end $$;

-- host_sistema (nenhum cliente real)
insert into public.users (id,nome,matricula,senha_hash,saldo_centavos,criado_em,atualizado_em)
values ('host_sistema','Sistema','SISTEMA','anon',0,
        floor(extract(epoch from now())*1000)::bigint,
        floor(extract(epoch from now())*1000)::bigint)
on conflict (id) do nothing;

-- =========== Animaís (bicho) ===========
create or replace function public.animais_lista()
returns text[] language sql immutable as $$
  select array['Cachorro','Coelho','Gato','Leão','Elefante','Cavalo','Tigre','Zebra','Girafa','Urso','Lobo','Águia'];
$$;

-- =========== Baralho determinístico (LCG + Fisher-Yates) ===========
create or replace function public.gerar_baralho(p_seed bigint)
returns text[] language plpgsql immutable as $$
declare
  d text[] := '{}'; r text; s text; i int; j int; t text; st bigint := p_seed;
  ranks text[] := array['A','2','3','4','5','6','7','8','9','T','J','Q','K'];
  suits text[] := array['c','d','h','s'];
begin
  if p_seed is null then raise exception 'seed inválido'; end if;
  foreach r in array ranks loop
    foreach s in array suits loop d := d || (r || s); end loop;
  end loop;
  for i in 2..array_length(d,1) loop
    st := (st * 1664525 + 1013904223) % 4294967296;
    if st < 0 then st := st + 4294967296; end if;
    j := (st % i)::int + 1;
    t := d[i]; d[i] := d[j]; d[j] := t;
  end loop;
  return d;
end $$;

-- =========== Valor mão blackjack ===========
create or replace function public.valor_mao(p_cards text[])
returns int language plpgsql immutable as $$
declare c text; total int := 0; aces int := 0; v int;
begin
  foreach c in array p_cards loop
    v := case left(c,1)
           when 'A' then 11
           when 'T' then 10 when 'J' then 10 when 'Q' then 10 when 'K' then 10
           else left(c,1)::int end;
    total := total + v;
    if left(c,1) = 'A' then aces := aces + 1; end if;
  end loop;
  while total > 21 and aces > 0 loop total := total - 10; aces := aces - 1; end loop;
  return total;
end $$;

-- =========== Próximo turno ===========
create or replace function public.proximo_turno(p_players jsonb, p_cur int, p_tipo text)
returns int language plpgsql immutable as $$
declare n int := jsonb_array_length(p_players); s int; j int; p jsonb; done bool; folded bool;
begin
  if n = 0 then return null; end if;
  for s in 1..n loop
    j := ((p_cur - 1) + s) % n + 1;
    p := p_players->(j-1);
    done  := coalesce((p->>'done')::bool, false);
    folded := coalesce((p->>'folded')::bool, false);
    if p_tipo='blackjack' and not done then return j; end if;
    if p_tipo='poker' and not done and not folded then return j; end if;
  end loop;
  return null;
end $$;

-- =========== Estado da sala ===========
create or replace function public.estado_sala_turnos(p_codigo text)
returns jsonb language plpgsql security definer as $$
declare s jsonb; jp jsonb; rp jsonb;
begin
  select jsonb_build_object(
    'id',id,'jogo',jogo,'max_jogadores',max_jogadores,
    'rodadas_total',rodadas_total,'rodadas_atuais',rodadas_atuais,
    'aposta_centavos',aposta_centavos,'status',status,
    'host_id',host_id,'criado_em',criado_em,'encerrado_em',encerrado_em,
    'estado',estado_json) into s from public.rooms where id=p_codigo;
  if not found then return null; end if;

  select jsonb_agg(jsonb_build_object(
    'id',id,'user_id',user_id,'nome',nome,'matricula',matricula,
    'saldo_centavos',saldo_centavos,'aposta_atual',aposta_atual,
    'escolha',escolha,'venceu',venceu,'criado_em',criado_em
  ) order by criado_em) into jp from public.room_players where room_id=p_codigo;

  select jsonb_agg(jsonb_build_object(
    'id',id,'numero',numero,'resultado',resultado,
    'multiplicador',multiplicador,'criado_em',criado_em
  ) order by numero) into rp from public.room_rounds where room_id=p_codigo;

  return jsonb_build_object(
    'sala',s,
    'jogadores',coalesce(jp,'[]'::jsonb),
    'rodadas',coalesce(rp,'[]'::jsonb));
end $$;

-- =========== Criar sala ===========
create or replace function public.criar_sala_turnos(
  p_jogo text, p_nome text, p_max_jogadores integer default 6,
  p_aposta_centavos integer default 1000)
returns text language plpgsql security definer as $$
declare c text; seed bigint; ms bigint; hu text;
begin
  if p_jogo not in ('poker','blackjack','bicho') then raise exception 'Jogo inválido.'; end if;
  if p_max_jogadores not between 2 and 6 then raise exception '2 a 6 jogadores.'; end if;
  c := public.gerar_codigo_sala();
  seed := floor(random()*9007199254740991)::bigint;
  ms := floor(extract(epoch from clock_timestamp())*1000)::bigint;
  hu := 'anon_' || c || '_H';
  insert into public.users (id,nome,matricula,senha_hash,saldo_centavos,criado_em,atualizado_em)
  values (hu,p_nome,c,'anon',0,ms,ms) on conflict (id) do update set nome=p_nome;
  insert into public.rooms (id,jogo,max_jogadores,rodadas_total,aposta_centavos,status,host_id,criado_em,estado_json)
  values (c,p_jogo,p_max_jogadores,1,p_aposta_centavos,'aguardando',hu,ms,jsonb_build_object('seed',seed,'phase','aguardando'));
  insert into public.room_players (id,room_id,user_id,nome,matricula,saldo_centavos,criado_em)
  values (gen_random_uuid()::text,c,hu,p_nome,c,10000,ms);
  return c;
end $$;

-- =========== Entrar na sala ===========
create or replace function public.entrar_sala_turnos(
  p_codigo text, p_user_id text, p_nome text)
returns jsonb language plpgsql security definer as $$
declare r public.rooms%rowtype; cnt int; ms bigint;
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'aguardando' then raise exception 'Sala em andamento.'; end if;
  select count(*) into cnt from public.room_players where room_id=p_codigo;
  if cnt>=r.max_jogadores then raise exception 'Sala cheia.'; end if;
  if exists(select 1 from public.room_players where room_id=p_codigo and user_id=p_user_id) then
    return public.estado_sala_turnos(p_codigo);
  end if;
  ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  insert into public.users (id,nome,matricula,senha_hash,saldo_centavos,criado_em,atualizado_em)
  values (p_user_id,p_nome,p_codigo,'anon',0,ms,ms) on conflict (id) do update set nome=p_nome;
  insert into public.room_players (id,room_id,user_id,nome,matricula,saldo_centavos,criado_em)
  values (gen_random_uuid()::text,p_codigo,p_user_id,p_nome,p_codigo,10000,ms);
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== Iniciar partida ===========
create or replace function public.iniciar_partida_turnos(
  p_codigo text, p_user_id text)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype; st jsonb; deck jsonb;
  pa text[]; i int; n int; d int;
  c1 text; c2 text;
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'aguardando' then raise exception 'Não está aguardando.'; end if;
  if (select count(*) from public.room_players where room_id=p_codigo)<2
    then raise exception 'Mínimo 2 jogadores.'; end if;

  deck := to_jsonb(public.gerar_baralho((r.estado_json->>'seed')::bigint));
  select array_agg(user_id order by criado_em) into pa from public.room_players where room_id=p_codigo;
  n := array_length(pa,1); d := 0;

  if r.jogo='bicho' then
    st := jsonb_build_object('seed',(r.estado_json->>'seed')::bigint,'phase','apostando');
  elsif r.jogo='blackjack' then
    -- dealer 2 cartas + 2 cartas por jogador
    c1:=deck->0; c2:=deck->1; d:=2;
    st := jsonb_build_object(
      'seed',(r.estado_json->>'seed')::bigint,'phase','jogando','type','blackjack',
      'deck',deck,'deckIndex',0,
      'dealer',jsonb_build_object('cards',jsonb_build_array(c1,c2),'revealed',false),
      'players','[]'::jsonb,'turnIndex',1);
    for i in 1..n loop
      c1:=deck->(d+1); c2:=deck->(d+2); d:=d+2;
      st := jsonb_insert(st, '{players,-}',
        jsonb_build_object('user_id',pa[i],'cards',jsonb_build_array(c1,c2),'done',false));
    end loop;
    st := jsonb_set(st,'{deckIndex}',to_jsonb(d));
  elsif r.jogo='poker' then
    st := jsonb_build_object(
      'seed',(r.estado_json->>'seed')::bigint,'phase','jogando','type','poker',
      'deck',deck,'deckIndex',0,
      'community','[]'::jsonb,'street',1,'pot',0,
      'players','[]'::jsonb,'turnIndex',1);
    for i in 1..n loop
      c1:=deck->(d+1); c2:=deck->(d+2); d:=d+2;
      st := jsonb_insert(st, '{players,-}',
        jsonb_build_object('user_id',pa[i],'cards',jsonb_build_array(c1,c2),
          'folded',false,'done',true,'paid',0));
    end loop;
    st := jsonb_set(st,'{deckIndex}',to_jsonb(d));
  else raise exception 'Jogo não suportado no online.'; end if;

  update public.rooms set status='jogando', estado_json=st where id=p_codigo;
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== AÇÃO: BICHO ===========
create or replace function public.acao_bicho(
  p_codigo text, p_user_id text, p_acao jsonb)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype; state jsonb;
  palpite text; animal_correto text; idx int;
  animais text[]; mult real; venc text[];
  ms bigint; rid text; n int; i int;
  pid text; antes int; depois int; ganho int; cnt_esp int; cnt_total int;
  pa text[];
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'jogando' then raise exception 'Não iniciada.'; end if;
  if r.jogo<>'bicho' then raise exception 'Sala não é de bicho.'; end if;
  if (p_acao->>'tipo')<>'palpite' then raise exception 'Ação inválida.'; end if;

  palpite := p_acao->>'animal';
  if palpite is null or palpite='' then raise exception 'Informe animal.'; end if;
  select id into pid from public.room_players where room_id=p_codigo and user_id=p_user_id;
  if pid is null then raise exception 'Você não está na sala.'; end if;
  if exists(select 1 from public.room_players where id=pid and escolha is not null) then
    raise exception 'Você já palpitou.'; end if;

  ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  update public.room_players set escolha=palpite, aposta_atual=r.aposta_centavos where id=pid;

  select count(*) into cnt_total from public.room_players where room_id=p_codigo;
  select count(*) into cnt_esp from public.room_players where room_id=p_codigo and escolha is not null;

  if cnt_esp < cnt_total then
    update public.rooms set estado_json=jsonb_set(r.estado_json,'{phase}','"apostando"') where id=p_codigo;
    return public.estado_sala_turnos(p_codigo);
  end if;

  -- Todos palpitaram
  animais := public.animais_lista();
  idx := abs((r.estado_json->>'seed')::bigint % array_length(animais,1))::int + 1;
  animal_correto := animais[idx];
  mult := case when abs((r.estado_json->>'seed')::bigint % 10) < 2 then 1.5 else 1.8 end;

  select array_agg(user_id order by criado_em) into pa from public.room_players where room_id=p_codigo;
  n:=array_length(pa,1); ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  rid:=gen_random_uuid()::text;
  venc:='{}';
  insert into public.room_rounds (id,room_id,numero,resultado,multiplicador,criado_em)
  values (rid,p_codigo,1,animal_correto,mult,ms);

  for i in 1..n loop
    select saldo_centavos into antes from public.room_players where room_id=p_codigo and user_id=pa[i];
    select escolha into palpite from public.room_players where room_id=p_codigo and user_id=pa[i];
    if palpite=animal_correto then
      depois:=greatest(0,antes-r.aposta_centavos+round(r.aposta_centavos*mult)::int);
      venc:=venc||pa[i];
    else
      depois:=greatest(0,antes-r.aposta_centavos);
    end if;
    ganho:=depois-antes;
    update public.room_players set saldo_centavos=depois, venceu=(palpite=animal_correto)
     where room_id=p_codigo and user_id=pa[i];
    insert into public.room_round_players (id,round_id,player_id,saldo_antes,saldo_depois,ganho_centavos)
    values (gen_random_uuid()::text,rid,
      (select id from public.room_players where room_id=p_codigo and user_id=pa[i]),
      antes,depois,ganho);
  end loop;

  state:=jsonb_build_object(
    'seed',(r.estado_json->>'seed')::bigint,'phase','encerrada',
    'animal_correto',animal_correto,'multiplicador',mult,
    'vencedores',coalesce((select jsonb_agg(x) from unnest(venc) x),'[]'::jsonb));

  update public.rooms set status='encerrada',estado_json=state,encerrado_em=ms where id=p_codigo;
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== AÇÃO: BLACKJACK ===========
create or replace function public.acao_blackjack(
  p_codigo text, p_user_id text, p_acao jsonb)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype; state jsonb;
  players jsonb; dealer jsonb;
  tipo text:=p_acao->>'tipo'; n int; ti int; i int;
  cur jsonb; newcards jsonb; c text; di int; total int;
  dtot int; ptot int; mult real; won bool;
  ms bigint; rid text; antes int; depois int; ganho int; px jsonb;
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'jogando' then raise exception 'Não iniciada.'; end if;
  if r.jogo<>'blackjack' then raise exception 'Não é blackjack.'; end if;

  state:=r.estado_json;
  if state->>'phase'<>'jogando' then raise exception 'Fase inválida.'; end if;
  players:=state->'players'; n:=jsonb_array_length(players);
  ti:=(state->>'turnIndex')::int;

  if (players->(ti-1)->>'user_id')<>p_user_id then
    select i into ti from generate_series(1,n) i
     where (players->(i-1)->>'user_id')=p_user_id limit 1;
    if ti is null then raise exception 'Não é a sua vez.'; end if;
  end if;
  cur:=players->(ti-1);
  if (cur->>'done')::bool then raise exception 'Mão concluída.'; end if;

  di:=(state->>'deckIndex')::int;

  if tipo='pedir' then
    c:=(state->'deck')->di; di:=di+1;
    newcards:=cur->'cards'||jsonb_build_array(c);
    players:=jsonb_set(players,array[ti-1::text,'cards'],newcards);
    total:=public.valor_mao((select array_agg(v) from jsonb_array_elements_text(newcards) v));
    if total>=21 then players:=jsonb_set(players,array[ti-1::text,'done'],'true'); end if;
    state:=jsonb_set(state,'{players}',players);
    state:=jsonb_set(state,'{deckIndex}',to_jsonb(di));
  elsif tipo='parar' then
    players:=jsonb_set(players,array[ti-1::text,'done'],'true');
    state:=jsonb_set(state,'{players}',players);
  else raise exception 'Ação inválida.'; end if;

  ti:=public.proximo_turno(players,ti,'blackjack');
  if ti is not null then
    state:=jsonb_set(state,'{turnIndex}',to_jsonb(ti));
    update public.rooms set estado_json=state where id=p_codigo;
    return public.estado_sala_turnos(p_codigo);
  end if;

  -- Dealer joga
  dealer:=jsonb_set(state->'dealer','{revealed}','true');
  dtot:=public.valor_mao((select array_agg(v) from jsonb_array_elements_text(dealer->'cards') v));
  while dtot<17 loop
    c:=(state->'deck')->di; di:=di+1;
    dealer:=jsonb_set(dealer,'{cards}',dealer->'cards'||jsonb_build_array(c));
    dtot:=public.valor_mao((select array_agg(v) from jsonb_array_elements_text(dealer->'cards') v));
  end loop;
  state:=jsonb_set(state,'{dealer}',dealer);
  state:=jsonb_set(state,'{deckIndex}',to_jsonb(di));
  state:=jsonb_set(state,'{turnIndex}','0');

  ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  rid:=gen_random_uuid()::text;
  insert into public.room_rounds (id,room_id,numero,resultado,multiplicador,criado_em)
  values (rid,p_codigo,1,'dealer:'||dtot::text,0,ms);

  for i in 1..n loop
    px:=players->(i-1);
    ptot:=public.valor_mao((select array_agg(v) from jsonb_array_elements_text(px->'cards') v));
    if ptot>21 then mult:=0; won:=false;
    elsif dtot>21 then mult:=2; won:=true;
    elsif ptot>dtot then mult:=2; won:=true;
    elsif ptot=dtot then mult:=1; won:=false;
    else mult:=0; won:=false; end if;
    select saldo_centavos into antes from public.room_players where room_id=p_codigo and user_id=(px->>'user_id');
    depois:=greatest(0,antes-r.aposta_centavos+round(r.aposta_centavos*mult)::int);
    ganho:=depois-antes;
    update public.room_players set saldo_centavos=depois, venceu=won
     where room_id=p_codigo and user_id=(px->>'user_id');
    insert into public.room_round_players (id,round_id,player_id,saldo_antes,saldo_depois,ganho_centavos)
    values (gen_random_uuid()::text,rid,
      (select id from public.room_players where room_id=p_codigo and user_id=(px->>'user_id')),
      antes,depois,ganho);
  end loop;

  state:=jsonb_set(state,'{phase}','"encerrada"');
  update public.rooms set status='encerrada',estado_json=state,encerrado_em=ms where id=p_codigo;
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== AÇÃO: POKER ===========
create or replace function public.acao_poker(
  p_codigo text, p_user_id text, p_acao jsonb)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype; state jsonb;
  players jsonb; community jsonb;
  tipo text:=p_acao->>'tipo'; street int; ti int; n int; i int;
  di int; c text; pot int; aposta int; paid int; cur jsonb;
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'jogando' then raise exception 'Não iniciada.'; end if;
  if r.jogo<>'poker' then raise exception 'Não é poker.'; end if;

  state:=r.estado_json;
  if state->>'phase'<>'jogando' then raise exception 'Fase inválida.'; end if;
  players:=state->'players'; n:=jsonb_array_length(players);
  street:=(state->>'street')::int; di:=(state->>'deckIndex')::int;
  pot:=(state->>'pot')::int; aposta:=r.aposta_centavos;
  ti:=(state->>'turnIndex')::int;
  cur:=players->(ti-1);
  if (cur->>'user_id')<>p_user_id then raise exception 'Não é a sua vez.'; end if;
  if (cur->>'done')::bool or (cur->>'folded')::bool then raise exception 'Mão concluída.'; end if;

  if tipo='confirmar' then
    paid:=coalesce((cur->>'paid')::int,0)+aposta;
    players:=jsonb_set(players,array[ti-1::text,'paid'],to_jsonb(paid));
    players:=jsonb_set(players,array[ti-1::text,'done'],'true');
    pot:=pot+aposta;
  elsif tipo='desistir' then
    players:=jsonb_set(players,array[ti-1::text,'folded'],'true');
    players:=jsonb_set(players,array[ti-1::text,'done'],'true');
  else raise exception 'Ação inválida.'; end if;

  state:=jsonb_set(state,'{players}',players);
  state:=jsonb_set(state,'{pot}',to_jsonb(pot));

  ti:=public.proximo_turno(players,ti,'poker');
  if ti is not null then
    state:=jsonb_set(state,'{turnIndex}',to_jsonb(ti));
    update public.rooms set estado_json=state where id=p_codigo;
    return public.estado_sala_turnos(p_codigo);
  end if;

  -- Próximo street
  street:=street+1;
  if street=2 then -- flop
    community:=jsonb_build_array(state->'deck'->di,state->'deck'->(di+1),state->'deck'->(di+2)); di:=di+3;
    state:=jsonb_set(state,'{community}',community);
  elsif street in (3,4) then -- turn/river
    community:=coalesce(state->'community','[]'::jsonb);
    community:=community||jsonb_build_array(state->'deck'->di); di:=di+1;
    state:=jsonb_set(state,'{community}',community);
  end if;
  state:=jsonb_set(state,'{deckIndex}',to_jsonb(di));

  if street<=4 then
    for i in 1..n loop
      if not (players->(i-1)->>'folded')::bool then
        players:=jsonb_set(players,array[i-1::text,'done'],'false');
      end if;
    end loop;
    state:=jsonb_set(state,'{players}',players);
    state:=jsonb_set(state,'{street}',to_jsonb(street));
    state:=jsonb_set(state,'{turnIndex}','1');
    update public.rooms set estado_json=state where id=p_codigo;
    return public.estado_sala_turnos(p_codigo);
  end if;

  -- Showdown
  state:=jsonb_set(state,'{phase}','"showdown"');
  update public.rooms set estado_json=state where id=p_codigo;
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== Finalizar poker ===========
create or replace function public.finalizar_poker(
  p_codigo text, p_vencedor text)
returns jsonb language plpgsql security definer as $$
declare
  r public.rooms%rowtype; state jsonb; players jsonb;
  n int; i int; cur jsonb; pot int;
  ms bigint; rid text; antes int; depois int; ganho int; paid int;
begin
  select * into r from public.rooms where id=p_codigo for update;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if r.status<>'jogando' then raise exception 'Não está jogando.'; end if;
  state:=r.estado_json;
  if state->>'phase'<>'showdown' then raise exception 'Ainda não showdown.'; end if;
  if not exists(select 1 from public.room_players where room_id=p_codigo and user_id=p_vencedor) then
    raise exception 'Vencedor não está na sala.'; end if;

  pot:=(state->>'pot')::int; players:=state->'players';
  n:=jsonb_array_length(players);
  ms:=floor(extract(epoch from clock_timestamp())*1000)::bigint;
  rid:=gen_random_uuid()::text;
  insert into public.room_rounds (id,room_id,numero,resultado,multiplicador,criado_em)
  values (rid,p_codigo,1,'vencedor:'||p_vencedor,0,ms);

  for i in 1..n loop
    cur:=players->(i-1);
    paid:=coalesce((cur->>'paid')::int,0);
    select saldo_centavos into antes from public.room_players where room_id=p_codigo and user_id=(cur->>'user_id');
    if (cur->>'user_id')=p_vencedor then
      depois:=antes+pot; ganho:=pot;
      update public.room_players set venceu=true where room_id=p_codigo and user_id=(cur->>'user_id');
    else
      depois:=greatest(0,antes-paid); ganho:=0-paid;
      update public.room_players set venceu=false where room_id=p_codigo and user_id=(cur->>'user_id');
    end if;
    update public.room_players set saldo_centavos=depois where room_id=p_codigo and user_id=(cur->>'user_id');
    insert into public.room_round_players (id,round_id,player_id,saldo_antes,saldo_depois,ganho_centavos)
    values (gen_random_uuid()::text,rid,
      (select id from public.room_players where room_id=p_codigo and user_id=(cur->>'user_id')),
      antes,depois,ganho);
  end loop;

  state:=jsonb_set(state,'{phase}','"encerrada"');
  update public.rooms set status='encerrada',estado_json=state,encerrado_em=ms where id=p_codigo;
  return public.estado_sala_turnos(p_codigo);
end $$;

-- =========== Router ===========
create or replace function public.acao_turno(
  p_codigo text, p_user_id text, p_acao jsonb)
returns jsonb language plpgsql security definer as $$
declare jg text;
begin
  select jogo into jg from public.rooms where id=p_codigo;
  if not found then raise exception 'Sala não encontrada.'; end if;
  if jg='bicho' then return public.acao_bicho(p_codigo,p_user_id,p_acao);
  elsif jg='blackjack' then return public.acao_blackjack(p_codigo,p_user_id,p_acao);
  elsif jg='poker' then return public.acao_poker(p_codigo,p_user_id,p_acao);
  else raise exception 'Jogo não suportado.'; end if;
end $$;

-- =========== Listar salas ===========
create or replace function public.listar_salas_turnos()
returns jsonb language plpgsql security definer as $$
begin
  return coalesce((select jsonb_agg(jsonb_build_object(
    'id',id,'jogo',jogo,'max_jogadores',max_jogadores,
    'aposta_centavos',aposta_centavos,'status',status,
    'host_id',host_id,'criado_em',criado_em,
    'jogadores_atuais',(select count(*) from public.room_players where room_id=r.id)
  ) order by criado_em desc)
  from public.rooms r where r.status='aguardando' and r.jogo in ('poker','blackjack','bicho')),
  '[]'::jsonb);
end $$;

-- =========== Grants ===========
grant execute on function public.criar_sala_turnos(text,text,integer,integer) to anon, authenticated;
grant execute on function public.entrar_sala_turnos(text,text,text) to anon, authenticated;
grant execute on function public.iniciar_partida_turnos(text,text) to anon, authenticated;
grant execute on function public.acao_turno(text,text,jsonb) to anon, authenticated;
grant execute on function public.finalizar_poker(text,text) to anon, authenticated;
grant execute on function public.listar_salas_turnos() to anon, authenticated;
grant execute on function public.estado_sala_turnos(text) to anon, authenticated;
grant execute on function public.obter_snapshot(text) to anon, authenticated;
grant execute on function public.resolver_jogada(text,text,integer,text,real) to anon, authenticated;