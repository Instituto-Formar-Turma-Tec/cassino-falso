import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { snapshot, leaderboard } from '@/lib/game-engine';

export async function GET() {
  const id = (await cookies()).get('cassino_session')?.value;
  const user: any = id ? await getSessionUser(id) : null;
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  try {
    return NextResponse.json({ snapshot: await snapshot(user.id), leaderboard: await leaderboard() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro ao carregar dashboard.' }, { status: 500 });
  }
}