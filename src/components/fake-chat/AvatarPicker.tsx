"use client";

import React, { useState, useRef } from "react";
import {
  CURATED_AVATARS,
  getRandomAvatar,
  AvatarCategory,
} from "@/lib/fake-chat/avatars";
import { Shuffle, Upload, Check, ChevronDown, ChevronUp } from "lucide-react";

interface AvatarPickerProps {
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
  contactName: string;
}

const CATEGORIES: { id: AvatarCategory; label: string; icon: string }[] = [
  { id: "arquetipos", label: "Arquetipos", icon: "👨‍👩‍👦" },
  { id: "sin_foto", label: "Sin Foto", icon: "👤" },
  { id: "anime", label: "Anime", icon: "✨" },
  { id: "tipicas", label: "Típicas", icon: "🚗" },
  { id: "chica", label: "Chicas", icon: "👩" },
  { id: "chico", label: "Chicos", icon: "👨" },
];

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  currentAvatar,
  onSelectAvatar,
  contactName,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AvatarCategory>("arquetipos");
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

          {/* Upload Custom Photo */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition border border-zinc-700 cursor-pointer"
            title="Subir foto desde tu ordenador"
          >
            <Upload className="w-3 h-3" />
            <span className="hidden sm:inline">Subir</span>
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
        <div className="pt-2 border-t border-zinc-800/80 flex flex-col gap-2.5 animate-in fade-in duration-200">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 overflow-x-auto text-[11px] font-bold scrollbar-none">
            {CATEGORIES.map((cat) => {
              const count = CURATED_AVATARS.filter((a) => a.category === cat.id).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className="opacity-60 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          {/* Avatar Thumbnails Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-9 gap-2 py-1 max-h-48 overflow-y-auto">
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
                    className="w-full h-full object-cover bg-zinc-900"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-emerald-950/60 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Hint with current selection label */}
          <div className="text-[11px] text-zinc-400 flex items-center justify-between px-1">
            <span>
              Mostrando:{" "}
              <strong className="text-zinc-300">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.label}
              </strong>
            </span>
            <span className="text-[10px] text-zinc-500">
              Pasa el ratón sobre cualquier foto para ver su arquetipo
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
