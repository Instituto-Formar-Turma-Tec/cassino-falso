import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';
import { playSlot, playAnimal, playBoard, playRoulette, playBlackjack, playPoker } from '@/lib/game-engine';

export async function POST(req: Request) {
  try {
    const cookie = (await cookies()).get('cassino_session')?.value;
    const user: any = cookie ? await getSessionUser(cookie) : null;
    if (!user) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 });
    if (!checkRateLimit(user.id)) return NextResponse.json({ error: 'Aguarde entre rodadas.' }, { status: 429 });

    const body = await req.json();
    const bet = Math.round(Number(body.bet_amount) * 100);
    if (!Number.isFinite(bet) || bet <= 0) return NextResponse.json({ error: 'Aposta inválida.' }, { status: 400 });

    let result: any;
    switch (body.game) {
      case 'slot':
        result = await playSlot(user.id, bet);
        break;
      case 'animal':
        result = await playAnimal(user.id, bet, String(body.animal || 'Avestruz'));
        break;
      case 'board':
        result = await playBoard(user.id, bet);
        break;
      case 'roulette':
        result = await playRoulette(user.id, bet, String(body.betType) as any, body.value ? Number(body.value) : undefined);
        break;
      case 'blackjack':
        result = await playBlackjack(user.id, bet);
        break;
      case 'poker':
        result = await playPoker(user.id, bet);
        break;
      default:
        return NextResponse.json({ error: 'Jogo não encontrado.' }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (e: any) {
    // resolver_jogada no Postgres levanta exceção → PostgREST devolve
    // { code: 'PGRST...', message: '...' }. Priorizamos a mensagem do banco.
    const msg = e?.details?.message || e?.message || 'Erro ao resolver rodada.';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}