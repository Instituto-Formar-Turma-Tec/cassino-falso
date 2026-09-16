import React from "react"
import { useOnlineRoom } from "@/lib/online-room"
import OnlineLobby from "./OnlineLobby"
import OnlineRoomShell from "./OnlineRoomShell"

export default function OnlineGames({
  jogo,
}: {
  jogo: "poker" | "blackjack" | "bicho"
}) {
  const { codigo } = useOnlineRoom()
  if (codigo) return <OnlineRoomShell />
  return <OnlineLobby jogo={jogo} />
}
