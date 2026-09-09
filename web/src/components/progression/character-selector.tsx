"use client";

import React, { useState } from "react";
import { X, Check } from "lucide-react";
import type { CharacterId, EvolutionStage } from "@/lib/types";
import {
  getAllCharacters,
  getCharacterAssetPath,
  STAGE_TITLES,
} from "@/lib/character-manager";

interface CharacterSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCharacterId: CharacterId;
  currentStage: EvolutionStage;
  onSelectCharacter: (characterId: CharacterId) => Promise<void> | void;
}

export function CharacterSelectorModal({
  isOpen,
  onClose,
  selectedCharacterId,
  currentStage,
  onSelectCharacter,
}: CharacterSelectorModalProps) {
  const [selecting, setSelecting] = useState<string | null>(null);
  const characters = getAllCharacters();

  if (!isOpen) return null;

  const handleSelect = async (id: CharacterId) => {
    setSelecting(id);
    try {
      await onSelectCharacter(id);
      onClose();
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] max-h-[90vh] flex flex-col rounded-[18px] border border-[var(--border-strong)] bg-[var(--surface)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-[18px] font-extrabold text-[var(--text-primary)]">
              Identity Archetypes
            </h2>
            <p className="text-[12px] text-[var(--text-muted)] mt-0.5">
              Choose your visual character representation. Identity selection is purely cosmetic.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* 2-Column Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {characters.map((char) => {
            const isSelected = char.id === selectedCharacterId;
            const assetPath = getCharacterAssetPath(char.id, currentStage);

            return (
              <div
                key={char.id}
                className={`flex flex-col justify-between p-5 rounded-[14px] border transition-all duration-150 ${
                  isSelected
                    ? "border-[var(--accent)] bg-[var(--surface-elevated)] ring-1 ring-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-secondary)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]"
                }`}
              >
                {/* Top: Avatar & Info */}
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-[54px] h-[54px] rounded-[10px] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 overflow-hidden">
                      <img
                        src={assetPath}
                        alt={char.name}
                        width={54}
                        height={54}
                        className="object-contain w-[50px] h-[50px] [image-rendering:pixelated]"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-[var(--text-primary)]">
                          {char.name}
                        </h3>
                        <span className="text-[14px]">{char.icon}</span>
                      </div>
                      <p className="text-[12px] font-semibold text-[var(--text-muted)]">
                        {char.title || char.specialization}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed mb-4">
                    {char.description}
                  </p>
                </div>

                {/* Footer: Stage Tag & Button/Badge */}
                <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                    Stage {currentStage} — {STAGE_TITLES[currentStage]}
                  </span>

                  {isSelected ? (
                    <span className="flex items-center gap-1.5 text-[12px] font-bold text-[var(--success)] px-3 py-1 rounded-[8px] bg-[var(--success-soft)]">
                      <Check size={14} strokeWidth={2.5} />
                      Active Identity
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSelect(char.id)}
                      disabled={selecting === char.id}
                      className="px-4 py-1.5 rounded-[8px] text-[12px] font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:bg-[var(--primary-pressed)] transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {selecting === char.id ? "Selecting..." : "Select Archetype"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-[var(--border)] bg-[var(--surface)]">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-[10px] text-[13px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
