/** @type {import('next').NextConfig} */
const nextConfig = {
  // NOTA: `ignoreBuildErrors` está em true para não travar o build local em
  // erros de tipo. Para um deploy de produção na Vercel recomenda-se false
  // (a Vercel roda `next build`). Mantido como estava para não quebrar o fluxo
  // atual; ajuste por decisão própria.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Otimização de imagens desativada (plano/free local). Na Vercel, se quiser
    // usar <Image>, remova esta linha para ativar a otimização (Hobby: até 1000/mês).
    unoptimized: true,
  },
}

export default nextConfig