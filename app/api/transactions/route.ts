import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSessionUser } from '@/lib/auth'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  const sessionId = (await cookies()).get('cassino_session')?.value
  const user = sessionId ? await getSessionUser(sessionId) : null
  if (!user) return NextResponse.json({ error: 'Sessão expirada.' }, { status: 401 })
  const url = new URL(request.url)
  const page = Math.max(1, Number(url.searchParams.get('page') || 1))
  const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 20)))
  const offset = (page - 1) * limit

  const from = offset;
  const to = offset + limit - 1;

  const { data: rows, error, count } = await supabase
    .from('transactions')
    .select('id, tipo, valor_centavos, saldo_anterior_centavos, saldo_novo_centavos, descricao, criado_em', { count: 'exact' })
    .eq('user_id', user.id)
    .order('criado_em', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: 'Erro ao carregar extrato.' }, { status: 500 })

  const total = count ?? 0;
  return NextResponse.json({ transactions: rows, page, pages: Math.ceil(total / limit), total })
}