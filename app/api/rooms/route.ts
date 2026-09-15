import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const sessionId = (await cookies()).get('cassino_session')?.value;
  const user = sessionId ? await getSessionUser(sessionId) : null;
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    const { data, error } = await supabase.rpc('listar_salas_abertas');
    if (error) throw new Error(error.message);
    return NextResponse.json({ salas: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao listar salas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const sessionId = (await cookies()).get('cassino_session')?.value;
  const user = sessionId ? await getSessionUser(sessionId) : null;
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  try {
    const body = await req.json();
    const { jogo, max_jogadores, rodadas_total, aposta_centavos } = body;

    if (!['roleta', 'poker', 'blackjack'].includes(jogo)) {
      return NextResponse.json({ error: 'Jogo inválido.' }, { status: 400 });
    }
    if (max_jogadores < 2 || max_jogadores > 6) {
      return NextResponse.json({ error: 'Entre 2 e 6 jogadores.' }, { status: 400 });
    }
    if (rodadas_total < 1 || rodadas_total > 20) {
      return NextResponse.json({ error: 'Rodadas entre 1 e 20.' }, { status: 400 });
    }
    if (!Number.isFinite(aposta_centavos) || aposta_centavos <= 0) {
      return NextResponse.json({ error: 'Aposta inválida.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('criar_sala', {
      p_host_id: user.id,
      p_jogo: jogo,
      p_max_jogadores: max_jogadores,
      p_rodadas_total: rodadas_total,
      p_aposta_centavos: aposta_centavos,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ codigo: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao criar sala.' }, { status: 400 });
  }
}