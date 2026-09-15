import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cassino Reverso — Simulador Educacional',
  description: 'Um simulador de apostas educacional que demonstra valor esperado negativo através de jogos rigorosamente controlados. Nenhum valor real está em jogo.',
  generator: 'v0.app',
  openGraph: {
    title: 'Cassino Reverso',
    description: 'Simulador educacional de apostas com house edge positivo',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  colorScheme: 'dark',
  themeColor: '#050505',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="antialiased app-background">
        <main className="mobile-app" role="main">
          {children}
        </main>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
