"use client";

import React, { useState } from "react";
import Image from "next/image";
import type { CharacterDefinition, EvolutionStage } from "@/lib/types";
import { getCharacterAssetPath, STAGE_TITLES } from "@/lib/character-manager";

interface CharacterPortraitProps {
  character: CharacterDefinition;
  stage: EvolutionStage;
  className?: string;
}

export function StageEvolutionIndicator({
  currentStage,
}: {
  currentStage: EvolutionStage;
}) {
  const stages: EvolutionStage[] = [1, 2, 3, 4];

  return (
    <div className="flex items-center gap-2 py-1 flex-wrap">
      {stages.map((st, idx) => {
        const isPast = st < currentStage;
        const isCurrent = st === currentStage;

        return (
          <React.Fragment key={st}>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-[12px] leading-none ${
                  isPast || isCurrent
                    ? "text-[var(--accent)] font-bold"
                    : "text-[var(--text-muted)]"
                }`}
              >
                {isPast ? "●" : isCurrent ? "◉" : "○"}
              </span>
              <span
                className={`text-[12px] ${
                  isCurrent
                    ? "text-[var(--text-primary)] font-bold"
                    : isPast
                    ? "text-[var(--accent)] font-semibold"
                    : "text-[var(--text-muted)] font-medium"
                }`}
              >
                S{st} {STAGE_TITLES[st]}
              </span>
            </div>

            {idx < stages.length - 1 && (
              <span
                className={`text-[11px] select-none ${
                  isPast ? "text-[var(--border-strong)]" : "text-[var(--border)]"
                }`}
              >
                ───
              </span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function CharacterPortrait({
  character,
  stage,
  className = "",
}: CharacterPortraitProps) {
  const [imgError, setImgError] = useState(false);
  const assetPath = getCharacterAssetPath(character.id, stage);

  return (
    <div
      className={`relative w-[170px] h-[170px] sm:w-[216px] sm:h-[216px] rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface-elevated)] flex items-center justify-center p-2 shadow-sm overflow-hidden select-none ${className}`}
    >
      <div
        key={`${character.id}-${stage}`}
        className="relative w-full h-full flex items-center justify-center transition-opacity duration-300 animate-in fade-in"
      >
        {!imgError ? (
          <div className="portrait-sprite-container relative w-full h-full flex items-center justify-center animate-idle-breathe">
            <Image
              src={assetPath}
              alt={`${character.name} Stage ${stage}`}
              width={200}
              height={200}
              unoptimized
              priority
              className="object-contain w-full h-full max-w-[200px] max-h-[200px] [image-rendering:pixelated] [image-rendering:crisp-edges]"
              onError={() => setImgError(true)}
            />
          </div>
        ) : (
          /* Polished neutral geometric fallback avatar */
          <div
            className="w-full h-full rounded-[14px] flex flex-col items-center justify-center relative p-4 border"
            style={{
              borderColor: character.primary_color,
              background: `linear-gradient(135deg, var(--surface), var(--surface-secondary))`,
            }}
          >
            <span className="text-[52px] mb-2">{character.icon}</span>
            <span className="text-[14px] font-bold text-[var(--text-primary)]">
              {character.name}
            </span>
            <div
              className="absolute bottom-2 right-2 px-2 py-0.5 rounded-[6px] text-[11px] font-bold border border-[var(--border-strong)] bg-[var(--surface-elevated)] text-[var(--text-primary)]"
            >
              S{stage}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes idleBreathe {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .animate-idle-breathe {
          animation: idleBreathe 3.5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-idle-breathe {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
