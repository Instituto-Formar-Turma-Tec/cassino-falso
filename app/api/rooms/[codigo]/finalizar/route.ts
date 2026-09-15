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
    const { data, error } = await supabase.rpc('finalizar_sala', { p_codigo: codigo });
    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erro ao finalizar.' }, { status: 400 });
  }
}