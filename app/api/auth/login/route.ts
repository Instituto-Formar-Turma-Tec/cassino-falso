import { NextResponse } from 'next/server';
import { getUserByMatricula, verifyPassword, createSession, setSessionCookie } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit('login_' + clientIp, 3000)) {
      return NextResponse.json({ error: 'Muitas tentativas. Aguarde.' }, { status: 429 });
    }

    const { matricula, senha } = await req.json();
    if (!matricula || !senha) return NextResponse.json({ error: 'Preencha matrícula e senha.' }, { status: 400 });

    const user: any = await getUserByMatricula(matricula);
    if (!user || !(await verifyPassword(senha, user.senha_hash))) return NextResponse.json({ error: 'Matrícula ou senha inválida.' }, { status: 401 });

    if (!checkRateLimit('login_user_' + user.id, 1000)) {
      return NextResponse.json({ error: 'Muitas tentativas para esta conta.' }, { status: 429 });
    }

    const session = await createSession(user.id);
    await setSessionCookie(session);
    return NextResponse.json({ user: { nome: user.nome, matricula: user.matricula } });
  } catch { return NextResponse.json({ error: 'Não foi possível entrar.' }, { status: 500 }); }
}