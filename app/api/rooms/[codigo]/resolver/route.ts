import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  const sessionId = (await cookies()).get('cassino_session')?.value;
  const user = sessionId ? await getSessionUser(sessionId) : null;
  if (!user) return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });

  const { codigo } = await params;

  try {
    const body = await req.json();
    const { resultado, multiplicador } = body;

    if (!Number.isFinite(multiplicador)) {
      return NextResponse.json({ error: 'Multiplicador inválido.' }, { status: 400 });
    }

    const { data, error } = await supabase.rpc('resolver_rodada_compartilhada', {
      p_codigo: codigo,
      p_resultado: resultado || '',
      p_multiplicador: multiplicador,
    });
    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao resolver.' }, { status: 400 });
  }
}