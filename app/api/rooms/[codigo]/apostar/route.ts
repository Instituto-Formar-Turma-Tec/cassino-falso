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
    const { aposta_centavos, escolha } = body;

    if (!Number.isFinite(aposta_centavos) || aposta_centavos <= 0) {
      return NextResponse.json({ error: 'Aposta inválida.' }, { status: 400 });
    }

    const { error } = await supabase.rpc('registrar_aposta', {
      p_codigo: codigo,
      p_user_id: user.id,
      p_aposta: aposta_centavos,
      p_escolha: escolha || '',
    });
    if (error) throw new Error(error.message);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao apostar.' }, { status: 400 });
  }
}