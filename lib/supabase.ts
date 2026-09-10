// Client Supabase para uso no lado do servidor (Next.js API routes).
// Usa a chave SECRET (equivale à service_role no formato novo) para poder
// ler e gravar todas as tabelas. NUNCA importe isto de um componente
// 'use client'.
import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Faltam as variáveis NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY. Configure-as em .env.local (veja .env.example).'
  );
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});