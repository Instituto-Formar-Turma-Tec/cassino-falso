import React, { useState } from "react"
import { useOnlineRoom } from "@/lib/online-room"

const ANIMAIS = [
  "Cachorro",
  "Coelho",
  "Gato",
  "Leão",
  "Elefante",
  "Cavalo",
  "Tigre",
  "Zebra",
  "Girafa",
  "Urso",
  "Lobo",
  "Águia",
]

const ANIMAL_EMOJIS: Record<string, string> = {
  Cachorro: "🐕",
  Coelho: "🐇",
  Gato: "🐈",
  Leão: "🦁",
  Elefante: "🐘",
  Cavalo: "🐴",
  Tigre: "🐅",
  Zebra: "🦓",
  Girafa: "🦒",
  Urso: "🐻",
  Lobo: "🐺",
  Águia: "🦅",
}

export default function BichoOnline() {
  const { estado, user, loading, acao } = useOnlineRoom()
  const [escolhido, setEscolhido] = useState<string | null>(null)
  if (!estado) return null
  const { sala, jogadores } = estado
  const st = sala.estado
  if (!st) return null

  const phase = st.phase
  const myPlayer = jogadores.find((j) => j.user_id === user.id)
  const jaPalpitou = myPlayer?.escolha != null

  async function handlePalpite(animal: string) {
    if (jaPalpitou || loading) return
    setEscolhido(animal)
    try {
      await acao({ tipo: "palpite", animal })
    } catch {
      setEscolhido(null)
    }
  }

  const palpitesFeitos = jogadores.filter((j) => j.escolha != null).length
  const totalJogadores = jogadores.length

  return (
    <div className="space-y-5">
      {/* Phase header */}
      <div className="text-center">
        <div className="text-6xl mb-2">🐯</div>
        <div className="font-casino text-2xl text-yellow-400">
          {phase === "apostando" ? "ESCOLHA SEU ANIMAL" : "RESULTADO"}
        </div>
        {phase === "apostando" && (
          <div className="text-xs text-yellow-700 font-display mt-1">
            Palpites: {palpitesFeitos}/{totalJogadores}
          </div>
        )}
      </div>

      {/* Status: quem já palpitou */}
      {phase === "apostando" && (
        <div
          className="p-3 rounded-xl border"
          style={{ background: "#0a0300", borderColor: "#2a1000" }}
        >
          <div className="text-xs text-yellow-800 font-display tracking-widest uppercase mb-2">
            Palpites registrados
          </div>
          <div className="flex flex-wrap gap-1.5">
            {jogadores.map((j) => (
              <div
                key={j.user_id}
                className={`text-xs px-2 py-1 rounded font-display ${
                  j.user_id === user.id
                    ? "bg-yellow-800/30 text-yellow-300"
                    : j.escolha
                      ? "bg-gray-800 text-gray-400"
                      : "bg-red-900/20 text-red-400"
                }`}
              >
                {j.user_id === user.id ? "Você" : j.nome.slice(0, 10)}:{" "}
                {j.escolha
                  ? `${ANIMAL_EMOJIS[j.escolha] || "?"} ${j.escolha}`
                  : "aguardando..."}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Animal grid */}
      {!jaPalpitou && phase === "apostando" && (
        <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
          {ANIMAIS.map((a) => (
            <button
              key={a}
              onClick={() => handlePalpite(a)}
              disabled={loading}
              className={`p-3 rounded-xl border text-center transition-all disabled:opacity-60 ${
                escolhido === a
                  ? "border-yellow-400 bg-yellow-900/30 scale-105"
                  : "border-gray-800 hover:border-yellow-700 bg-gray-900/30"
              }`}
            >
              <div className="text-2xl mb-1">{ANIMAL_EMOJIS[a]}</div>
              <div className="text-xs text-yellow-500 font-display">{a}</div>
            </button>
          ))}
        </div>
      )}

      {/* Waiting message */}
      {!jaPalpitou && phase === "apostando" && (
        <div className="text-center text-xs text-yellow-800 font-display py-2">
          Selecione um animal acima para dar seu palpite
        </div>
      )}

      {/* Result */}
      {phase === "encerrada" && st.animal_correto && (
        <div
          className="p-5 rounded-xl text-center"
          style={{ background: "#1a1200", border: "1px solid #d4a01760" }}
        >
          <div className="text-4xl mb-2">
            {ANIMAL_EMOJIS[st.animal_correto]}
          </div>
          <div className="font-casino text-2xl text-yellow-400 mb-1">
            {st.animal_correto}
          </div>
          <div className="text-xs text-yellow-700 font-display">
            Animal correto
          </div>
          <div className="mt-3 font-casino text-lg text-yellow-500">
            Multiplicador: {st.multiplicador}x
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {jogadores.map((j) => (
              <div
                key={j.user_id}
                className={`p-2 rounded-lg text-sm font-display ${
                  j.venceu
                    ? "bg-green-900/30 text-green-400 border border-green-700"
                    : "bg-red-900/20 text-red-400"
                }`}
              >
                <div className="font-bold">
                  {j.user_id === user.id ? "Você" : j.nome}
                </div>
                <div className="text-xs">
                  {ANIMAL_EMOJIS[j.escolha || ""] || "?"} {j.escolha}
                </div>
                <div className="text-xs font-casino">
                  {j.venceu ? "GANHOU!" : "perdeu"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {phase === "apostando" && jaPalpitou && (
        <div className="text-center py-3 text-sm text-yellow-400 font-display">
          ✅ Seu palpite registrado: {ANIMAL_EMOJIS[myPlayer?.escolha || ""]}{" "}
          {myPlayer?.escolha}
          <br />
          <span className="text-xs text-yellow-800">
            Aguardando todos palpitar...
          </span>
        </div>
      )}
    </div>
  )
}
