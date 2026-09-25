"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { CURATED_AVATARS, getRandomAvatar, AvatarItem } from "@/lib/fake-chat/avatars";
import { Shuffle, Upload, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";

interface AvatarPickerProps {
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
  contactName: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onSelectAvatar,
  contactName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<"chica" | "chico" | "divertido">("chica");
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRandomize = () => {
    const next = getRandomAvatar(currentAvatar);
    onSelectAvatar(next.url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    onSelectAvatar(localUrl);
  };

  const filteredAvatars = CURATED_AVATARS.filter((a) => a.category === selectedCategory);

  return (
    <div className="flex flex-col gap-2.5 bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800">
      {/* 1. Header with Active Avatar Preview & Quick Actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-emerald-500/60 shadow-md shrink-0 bg-zinc-800">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentAvatar}
              alt={contactName}
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <span className="text-xs font-bold text-white block truncate max-w-[140px]">
              Foto de Perfil
            </span>
            <span className="text-[10px] text-zinc-400">
              Personalizada o aleatoria
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Random Avatar Dice Button */}
          <button
            type="button"
            onClick={handleRandomize}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition cursor-pointer"
            title="Elegir una foto aleatoria"
          >
            <Shuffle className="w-3 h-3" />
            <span>Aleatoria</span>
          </button>

          {/* Toggle Gallery Button */}
          <button
            type="button"
            onClick={() => setIsGalleryOpen(!isGalleryOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition border border-zinc-700 cursor-pointer"
            title="Ver galería completa de fotos"
          >
            <span>Galería</span>
            {isGalleryOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* 2. Collapsible Curated Gallery */}
      {isGalleryOpen && (
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2 animate-in fade-in duration-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setSelectedCategory("chica")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                selectedCategory === "chica" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              👩 Chicas ({CURATED_AVATARS.filter(a => a.category === "chica").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("chico")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                selectedCategory === "chico" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              👨 Chicos ({CURATED_AVATARS.filter(a => a.category === "chico").length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("divertido")}
              className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                selectedCategory === "divertido" ? "bg-emerald-600 text-white" : "text-zinc-400 hover:text-white"
              }`}
            >
              🐾 Mascotas ({CURATED_AVATARS.filter(a => a.category === "divertido").length})
            </button>
          </div>

          {/* Avatar Thumbnails Grid */}
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 py-1 max-h-40 overflow-y-auto">
            {filteredAvatars.map((item) => {
              const isSelected = currentAvatar === item.url;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectAvatar(item.url)}
                  className={`group relative aspect-square rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                    isSelected
                      ? "border-emerald-500 ring-2 ring-emerald-500/50 scale-105"
                      : "border-zinc-700 hover:border-zinc-400 hover:scale-105"
                  }`}
                  title={item.name}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-950/50 flex items-center justify-center text-emerald-400">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Upload Custom File or Paste URL */}
          <div className="flex items-center gap-2 pt-1 border-t border-zinc-800/80 text-xs">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-bold transition border border-zinc-700 cursor-pointer text-[11px]"
            >
              <Upload className="w-3 h-3" />
              <span>Subir desde tu ordenador</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
