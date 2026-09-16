import { supabase } from "./supabase"

export interface UserAuth {
  id: string
  nome: string
  matricula: string
  saldo_centavos: number
  total_perdido_centavos: number
  rodadas_jogadas: number
}

const AUTH_STORAGE_KEY = "cassino_user_auth"

export function obterUsuarioAtual(): UserAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserAuth
  } catch {
    return null
  }
}

export function salvarUsuarioLocal(user: UserAuth) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user))
}

export function logoutUsuario(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
}

export interface CadastroPayload {
  nome: string
  matricula?: string
  senha: string
}

export async function cadastrarUsuario(payload: CadastroPayload): Promise<UserAuth> {
  const nome = payload.nome.trim()
  const matricula = (payload.matricula || "").trim()
  const senha = payload.senha.trim()

  if (!nome) {
    throw new Error("Informe o seu nome.")
  }

  if (senha.length < 4) {
    throw new Error("A senha deve ter no mínimo 4 caracteres.")
  }

  // Gerar matrícula aleatória se não informada
  const finalMatricula = matricula || Math.floor(100000 + Math.random() * 900000).toString()

  // Verificar se nome já existe no Supabase
  const { data: existing, error: checkError } = await supabase
    .from("users")
    .select("id, matricula, nome")
    .or(`nome.eq.${nome}${matricula ? `,matricula.eq.${matricula}` : ""}`)

  if (checkError) {
    console.warn("Erro ao consultar Supabase, utilizando fallback local:", checkError)
  } else if (existing && existing.length > 0) {
    throw new Error("Já existe um cadastro com este Nome ou Matrícula.")
  }

  const nowMs = Date.now()
  const newUser: UserAuth = {
    id: "usr_" + crypto.randomUUID().replace(/-/g, "").slice(0, 12),
    nome,
    matricula: finalMatricula,
    saldo_centavos: 100000, // R$ 1.000,00 inicial fictício
    total_perdido_centavos: 0,
    rodadas_jogadas: 0,
  }

  // Inserir no Supabase se disponível
  const { error: insertError } = await supabase.from("users").insert({
    id: newUser.id,
    nome: newUser.nome,
    matricula: newUser.matricula,
    senha_hash: senha,
    saldo_centavos: newUser.saldo_centavos,
    total_perdido_centavos: newUser.total_perdido_centavos,
    rodadas_jogadas: newUser.rodadas_jogadas,
    criado_em: nowMs,
    atualizado_em: nowMs,
  })

  if (insertError) {
    console.warn("Aviso ao salvar no Supabase (prosseguindo localmente):", insertError.message)
  }

  salvarUsuarioLocal(newUser)
  return newUser
}

export interface LoginPayload {
  identificador: string // Nome ou Matrícula
  senha: string
}

export async function loginUsuario(payload: LoginPayload): Promise<UserAuth> {
  const identificador = payload.identificador.trim()
  const senha = payload.senha.trim()

  if (!identificador) {
    throw new Error("Informe seu nome ou matrícula.")
  }

  if (!senha) {
    throw new Error("Informe a sua senha.")
  }

  // Buscar usuário no Supabase por nome OU matrícula
  const { data: users, error: searchError } = await supabase
    .from("users")
    .select("*")
    .or(`matricula.eq.${identificador},nome.eq.${identificador}`)
    .limit(1)

  if (searchError || !users || users.length === 0) {
    throw new Error("Usuário não encontrado. Verifique seu nome ou matrícula.")
  }

  const dbUser = users[0]

  if (dbUser.senha_hash !== senha) {
    throw new Error("Senha incorreta.")
  }

  const userAuth: UserAuth = {
    id: dbUser.id,
    nome: dbUser.nome,
    matricula: dbUser.matricula,
    saldo_centavos: dbUser.saldo_centavos ?? 100000,
    total_perdido_centavos: dbUser.total_perdido_centavos ?? 0,
    rodadas_jogadas: dbUser.rodadas_jogadas ?? 0,
  }

  salvarUsuarioLocal(userAuth)
  return userAuth
}
