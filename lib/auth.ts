import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { randomBytes, randomUUID } from 'crypto';
import { supabase } from './supabase';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'JWT_SECRET não configurado. Defina uma chave aleatória forte em .env.local (ver .env.example) — nunca use o valor de desenvolvimento em produção.'
    );
  }
  return new TextEncoder().encode(secret);
}

const JWT_SECRET = getJwtSecret();

const SESSION_COOKIE_NAME = 'cassino_session';
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas

export interface SessionData {
  userId: string;
  matricula: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  const { error } = await supabase
    .from('sessions')
    .insert({ id: sessionId, user_id: userId, expira_em: expiresAt, criado_em: Date.now() });

  if (error) throw new Error(error.message);
  return sessionId;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await supabase.from('sessions').delete().eq('id', sessionId);
}

export async function getSessionUser(sessionId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('sessions')
    .select('user_id, expira_em')
    .eq('id', sessionId)
    .maybeSingle();

  if (error || !data) return null;
  if (data.expira_em <= Date.now()) return null;

  const { data: user } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user_id)
    .maybeSingle();

  return user || null;
}

export async function setSessionCookie(sessionId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_MS / 1000,
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentUser(): Promise<SessionData | null> {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionId) {
      return null;
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      matricula: user.matricula,
    };
  } catch (error) {
    console.error('[auth] Error getting current user:', error);
    return null;
  }
}

export async function getUserById(userId: string): Promise<any | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  return data || null;
}

export async function getUserByMatricula(matricula: string): Promise<any | null> {
  const { data } = await supabase
    .from('users')
    .select('*')
    .eq('matricula', matricula)
    .maybeSingle();
  return data || null;
}

export async function createUser(
  nome: string,
  matricula: string,
  senhaHash: string
): Promise<string> {
  const userId = randomUUID();
  const now = Date.now();

  const { error } = await supabase.from('users').insert({
    id: userId,
    nome,
    matricula,
    senha_hash: senhaHash,
    saldo_centavos: 100000,
    criado_em: now,
    atualizado_em: now,
  });

  if (error) throw new Error(error.message);
  return userId;
}