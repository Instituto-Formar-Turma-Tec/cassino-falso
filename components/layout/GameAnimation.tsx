'use client';

/* ============================================================
   GameAnimation — exibe a animação de um jogo.
   Aceita dados Lottie (.json) ou um vídeo (.mp4/webm).
   Fallback para emoji quando não há mídia disponível.
   ============================================================ */

import { Lottie } from 'lottie-react';

type AnimationData =
  | { type: 'lottie'; data: object; title?: string }
  | { type: 'video'; src: string; title?: string }
  | { type: 'emoji'; emoji: string; title?: string };

interface Props {
  animation: AnimationData;
  /** Tamanho base (px). */
  size?: number;
  /** Se true, toca em loop (fica animado já na seleção). */
  autoplay?: boolean;
}

export function GameAnimation({ animation, size = 80, autoplay = true }: Props) {
  if (animation.type === 'emoji') {
    return (
      <span
        className="emoji flex items-center justify-center select-none"
        style={{ width: size, height: size, fontSize: size * 0.85, lineHeight: 1 }}
        title={animation.title}
      >
        {animation.emoji}
      </span>
    );
  }

  if (animation.type === 'lottie') {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }} title={animation.title}>
        <Lottie
          src={animation.data as object}
          loop={autoplay}
          autoplay={autoplay}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      src={animation.src}
      autoPlay={autoplay}
      loop={autoplay}
      muted
      playsInline
      disablePictureInPicture
      controls={false}
      className="mx-auto object-contain select-none"
      style={{ width: size, height: size, pointerEvents: 'none' }}
      title={animation.title}
    />
  );
}