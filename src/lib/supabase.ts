import { createClient } from "@supabase/supabase-js"

const url =
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const key =
  import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    "Supabase URL/Key não encontrados. Verifique NEXT_PUBLIC_SUPABASE_URL " +
      "e NEXT_PUBLIC_SUPABASE_ANON_KEY no seu .env.local.",
  )
}

export const supabase = createClient(url, key, {
  realtime: { params: { eventsPerSecond: 2 } },
})

// ---------- User identity helpers ----------
// Anon stable ID stored in localStorage (no real auth)
const USER_KEY = "cassino_reverso_user"

export function getAnonUser(): { id: string; nome: string } {
  try {
    const authRaw = localStorage.getItem("cassino_user_auth")
    if (authRaw) {
      const u = JSON.parse(authRaw)
      if (u && u.id && u.nome) return { id: u.id, nome: u.nome }
    }
  } catch {
    /* fallback */
  }

  const raw = localStorage.getItem(USER_KEY)
  if (raw) return JSON.parse(raw)
  const id = "anon_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12)
  const nome = "Jogador_" + id.slice(-4)
  localStorage.setItem(USER_KEY, JSON.stringify({ id, nome }))
  return { id, nome }
}
