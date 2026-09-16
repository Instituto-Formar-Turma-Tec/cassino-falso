import React, { useState } from "react"
import { cadastrarUsuario, loginUsuario, UserAuth } from "@/lib/auth"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: UserAuth) => void
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<"login" | "registro">("login")

  // Form states
  const [nome, setNome] = useState("")
  const [matricula, setMatricula] = useState("")
  const [senha, setSenha] = useState("")
  const [identificador, setIdentificador] = useState("")

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  if (!isOpen) return null

  const handleMatriculaChange = (val: string) => {
    setMatricula(val)
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const user = await cadastrarUsuario({ nome, matricula, senha })
      setSuccessMsg(`Cadastro realizado com sucesso! Bem-vindo(a), ${user.nome}!`)
      setTimeout(() => {
        onSuccess(user)
        onClose()
      }, 800)
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao realizar cadastro.")
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)
    setLoading(true)

    try {
      const user = await loginUsuario({ identificador, senha })
      setSuccessMsg(`Login efetuado com sucesso! Bem-vindo(a), ${user.nome}!`)
      setTimeout(() => {
        onSuccess(user)
        onClose()
      }, 800)
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao efetuar login.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(6px)" }}
      onClick={onClose}
    >
      <div
        className="game-card rounded-2xl p-6 max-w-md w-full border border-yellow-600/50 shadow-2xl relative gold-border-anim max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-yellow-700 hover:text-yellow-400 text-xl font-bold transition-colors"
        >
          ✕
        </button>

        {/* Header Title */}
        <div className="text-center mb-6">
          <h2 className="font-casino text-3xl neon-gold text-yellow-400 tracking-wider">
            ACESSO À CONTA
          </h2>
          <p className="text-xs text-yellow-700 font-display mt-1">
            Entre com seu Nome ou Matrícula para jogar
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setTab("login")
              setErrorMsg(null)
            }}
            className={`flex-1 py-2.5 text-xs font-display tracking-widest uppercase font-bold transition-all border-b-2 ${
              tab === "login"
                ? "border-yellow-400 text-yellow-300 bg-yellow-950/20"
                : "border-transparent text-gray-500 hover:text-yellow-700"
            }`}
          >
            Entrar (Login)
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("registro")
              setErrorMsg(null)
            }}
            className={`flex-1 py-2.5 text-xs font-display tracking-widest uppercase font-bold transition-all border-b-2 ${
              tab === "registro"
                ? "border-yellow-400 text-yellow-300 bg-yellow-950/20"
                : "border-transparent text-gray-500 hover:text-yellow-700"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {/* Error / Success Feedback Messages */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-display leading-relaxed">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-display leading-relaxed">
            ✓ {successMsg}
          </div>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-1">
                Nome ou Matrícula
              </label>
              <input
                type="text"
                required
                value={identificador}
                onChange={(e) => setIdentificador(e.target.value)}
                placeholder="Ex: Carlos M. ou 123456"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Sua senha"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl text-xs tracking-widest uppercase font-bold disabled:opacity-60 shadow-lg mt-2"
            >
              {loading ? "Entrando..." : "🔑 Entrar na Conta"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "registro" && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-1">
                Matrícula (opcional)
              </label>
              <input
                type="text"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 123456 (opcional)"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors tracking-wider font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-display text-yellow-600 uppercase tracking-wider mb-1">
                Senha
              </label>
              <input
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Crie sua senha"
                className="w-full px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 text-yellow-100 placeholder-gray-600 text-sm focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 rounded-xl text-xs tracking-widest uppercase font-bold disabled:opacity-60 shadow-lg mt-2"
            >
              {loading ? "Cadastrando..." : "✨ Criar Minha Conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
