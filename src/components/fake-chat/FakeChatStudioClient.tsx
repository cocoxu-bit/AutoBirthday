"use client";

import React, { useState, useMemo, useEffect } from "react";
import { parseChatScript, generateCarouselSlides } from "@/lib/fake-chat/parser";
import { DEFAULT_PRESETS } from "@/lib/fake-chat/presets";
import { ChatSettings, PlatformType, ThemeMode, AspectRatio } from "@/lib/fake-chat/types";
import { CarouselSlideViewer } from "@/components/fake-chat/CarouselSlideViewer";
import { VideoPlayerView } from "@/components/fake-chat/VideoPlayerView";
import { AvatarPicker } from "@/components/fake-chat/AvatarPicker";
import Link from "next/link";
import {
  MessageSquare,
  Sparkles,
  Smartphone,
  Layers,
  Video,
  Sun,
  Moon,
  CheckCircle2,
  Settings2,
  Copy,
  Check,
  ArrowLeft,
  ShieldCheck,
  Trash2,
  Eraser,
  Type,
} from "lucide-react";

export function FakeChatStudioClient() {
  // Preset or raw script
  const [selectedPresetId, setSelectedPresetId] = useState<string>("autobirthday-viral-ig");
  const [scriptText, setScriptText] = useState<string>(DEFAULT_PRESETS[0].script);

  // Settings
  const [platform, setPlatform] = useState<PlatformType>("instagram");
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("4:5");
  const [contactName, setContactName] = useState<string>("Laura García");
  const [contactHandle, setContactHandle] = useState<string>("lauragarcia_");
  const [contactAvatar, setContactAvatar] = useState<string>(
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80"
  );
  const [isVerified, setIsVerified] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<string>("00:01");
  const [batteryLevel, setBatteryLevel] = useState<number>(88);
  const [wifi, setWifi] = useState<boolean>(true);
  const [primarySpeaker, setPrimarySpeaker] = useState<string>("Lucas");
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");

  // Output mode tab: "carousel" | "video"
  const [outputMode, setOutputMode] = useState<"carousel" | "video">("carousel");
  const [targetSlides, setTargetSlides] = useState<number | "auto">("auto");
  const [copiedScript, setCopiedScript] = useState(false);

  // Load a preset
  const handleSelectPreset = (presetId: string) => {
    const preset = DEFAULT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedPresetId(preset.id);
    setScriptText(preset.script);
    setPlatform(preset.platform);
    setTheme(preset.theme);
    setContactName(preset.contactName);
    setContactHandle(preset.contactHandle);
    setContactAvatar(preset.contactAvatar);
    setIsVerified(preset.isVerified);
  };

  // Clear entire script textarea
  const handleClearScript = () => {
    setScriptText("");
    setSelectedPresetId("");
  };

  // Strip leading hyphens/dashes from lines
  const handleRemoveHyphens = () => {
    const cleaned = scriptText
      .split("\n")
      .map((line) => line.replace(/^[ \t]*[-–—•*][ \t]*/, ""))
      .join("\n");
    setScriptText(cleaned);
  };

  // Parse conversation whenever script or primarySpeaker changes
  const { messages, speakers } = useMemo(() => {
    return parseChatScript(scriptText, primarySpeaker, currentTime);
  }, [scriptText, primarySpeaker, currentTime]);

  // If first speaker detected and primarySpeaker not in list, auto-select
  useEffect(() => {
    if (speakers.length > 0 && !speakers.includes(primarySpeaker)) {
      setPrimarySpeaker(speakers[0]);
    }
  }, [speakers, primarySpeaker]);

  // Generate carousel slides with smart density
  const slides = useMemo(() => {
    return generateCarouselSlides(messages, targetSlides);
  }, [messages, targetSlides]);

  // Compiled ChatSettings object
  const settings: ChatSettings = useMemo(
    () => ({
      contactName,
      contactHandle,
      contactAvatar,
      isVerified,
      statusText: "en línea",
      currentTime,
      batteryLevel,
      wifi,
      platform,
      theme,
      aspectRatio,
      fontSize,
    }),
    [
      contactName,
      contactHandle,
      contactAvatar,
      isVerified,
      currentTime,
      batteryLevel,
      wifi,
      platform,
      theme,
      aspectRatio,
      fontSize,
    ]
  );

  const copyScriptToClipboard = () => {
    navigator.clipboard.writeText(scriptText);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur-md sticky top-0 z-50 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition cursor-pointer"
            title="Volver al Panel de Admin"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-black text-lg text-white tracking-tight">Fake Chat Studio</h1>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Solo Admin GTM
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Generador privado de capturas carrusel y vídeos animados para adquisición en redes
            </p>
          </div>
        </div>

        {/* Quick links & platform pills */}
        <div className="flex items-center gap-2 text-xs">
          <Link
            href="/admin"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold border border-zinc-700 transition"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>Panel Admin</span>
          </Link>

          <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-zinc-800 text-purple-300 font-semibold border border-purple-500/30">
            Instagram DM
          </span>
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-zinc-800 text-emerald-300 font-semibold border border-emerald-500/30">
            WhatsApp
          </span>
          <span className="hidden md:inline-flex px-2.5 py-1 rounded-lg bg-zinc-800 text-blue-300 font-semibold border border-blue-500/30">
            iMessage
          </span>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ========================================================
            LEFT COLUMN: SCRIPT INPUT & CUSTOMIZATION (5 Cols)
            ======================================================== */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Preset Selector */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plantillas Virales</span>
              </label>
              <span className="text-[11px] text-zinc-500">1 clic para cargar</span>
            </div>

            <select
              value={selectedPresetId}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full bg-zinc-800 text-white text-xs font-semibold rounded-xl px-3 py-2.5 border border-zinc-700 focus:outline-none focus:border-emerald-500 transition"
            >
              {DEFAULT_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.title}
                </option>
              ))}
            </select>
          </div>

          {/* Script Textarea */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-2.5 shadow-sm flex-1 min-h-[300px]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
                <span>Guión de la Conversación</span>
              </label>

              <div className="flex items-center gap-1.5">
                {/* Remove hyphens/bullets */}
                <button
                  type="button"
                  onClick={handleRemoveHyphens}
                  className="text-[11px] text-zinc-300 hover:text-amber-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 transition cursor-pointer border border-zinc-700 font-medium"
                  title="Quitar guiones (-) o viñetas de cada línea"
                >
                  <Eraser className="w-3 h-3 text-amber-400" />
                  <span>Quitar guiones (-)</span>
                </button>

                {/* Clear/Delete script */}
                <button
                  type="button"
                  onClick={handleClearScript}
                  className="text-[11px] text-zinc-300 hover:text-rose-400 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 transition cursor-pointer border border-zinc-700 font-medium"
                  title="Borrar todo el guión para empezar uno nuevo"
                >
                  <Trash2 className="w-3 h-3 text-rose-400" />
                  <span>Borrar guión</span>
                </button>

                {/* Copy script */}
                <button
                  type="button"
                  onClick={copyScriptToClipboard}
                  className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700/80 transition cursor-pointer border border-zinc-700 font-medium"
                  title="Copiar guión al portapapeles"
                >
                  {copiedScript ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedScript ? "Copiado" : "Copiar"}</span>
                </button>
              </div>
            </div>

            <textarea
              value={scriptText}
              onChange={(e) => setScriptText(e.target.value)}
              placeholder="Lucas: Hola Laura! Qué tal todo?&#10;Laura: Hola Lucas!! Muy bien jaja [❤️]&#10;Lucas: Felices 28!! 🎉"
              rows={11}
              className="w-full flex-1 bg-zinc-950 text-zinc-100 font-mono text-xs rounded-xl p-3 border border-zinc-800 focus:outline-none focus:border-emerald-500 transition resize-none leading-relaxed"
            />

            {/* Speaker Selector: Who is "Me"? */}
            {speakers.length > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-zinc-800 text-xs">
                <span className="text-zinc-400 font-medium">Interlocutor a la derecha (Yo):</span>
                <div className="flex items-center gap-1">
                  {speakers.map((spk) => (
                    <button
                      key={spk}
                      onClick={() => setPrimarySpeaker(spk)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                        primarySpeaker === spk
                          ? "bg-emerald-600 text-white shadow-xs"
                          : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {spk}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Platform & Theme Settings */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estilo y Plataforma</span>
              </span>
            </div>

            {/* Platform Selector Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setPlatform("instagram")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  platform === "instagram"
                    ? "bg-purple-600/20 text-purple-300 border-purple-500 shadow-xs"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
              >
                📸 Instagram
              </button>
              <button
                onClick={() => setPlatform("whatsapp")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  platform === "whatsapp"
                    ? "bg-emerald-600/20 text-emerald-300 border-emerald-500 shadow-xs"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
              >
                💬 WhatsApp
              </button>
              <button
                onClick={() => setPlatform("imessage")}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                  platform === "imessage"
                    ? "bg-blue-600/20 text-blue-300 border-blue-500 shadow-xs"
                    : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200"
                }`}
              >
                🍎 iMessage
              </button>
            </div>

            {/* Theme & Ratio Controls */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">Tema Visual</label>
                <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      theme === "dark" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Moon className="w-3 h-3" />
                    <span>Oscuro</span>
                  </button>
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      theme === "light" ? "bg-zinc-100 text-zinc-900" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    <Sun className="w-3 h-3" />
                    <span>Claro</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-zinc-400 block mb-1 font-semibold">Formato Canvas</label>
                <div className="flex items-center gap-1 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
                  <button
                    onClick={() => setAspectRatio("4:5")}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      aspectRatio === "4:5" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    4:5 Post
                  </button>
                  <button
                    onClick={() => setAspectRatio("9:16")}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                      aspectRatio === "9:16" ? "bg-zinc-900 text-white" : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    9:16 Reel
                  </button>
                </div>
              </div>
            </div>

            {/* Font Size Selector for Reels/TikTok */}
            <div className="pt-2 border-t border-zinc-800">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Type className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Tamaño de Letra</span>
                </label>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {fontSize === "large" ? "Óptimo Reels / TikTok 🔥" : fontSize === "xlarge" ? "Extra Grande" : "Normal"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 bg-zinc-800 p-1 rounded-xl border border-zinc-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFontSize("normal")}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    fontSize === "normal"
                      ? "bg-zinc-900 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Normal
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("large")}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    fontSize === "large"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Grande (Reels) 🔥
                </button>
                <button
                  type="button"
                  onClick={() => setFontSize("xlarge")}
                  className={`py-1.5 rounded-lg transition cursor-pointer ${
                    fontSize === "xlarge"
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Extra Grande
                </button>
              </div>
            </div>

            {/* Profile Customization with Interactive Avatar Gallery & Randomizer */}
            <div className="pt-2 border-t border-zinc-800 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                <Settings2 className="w-3 h-3" />
                <span>Datos del Contacto</span>
              </span>

              {/* Avatar Picker Component */}
              <AvatarPicker
                currentAvatar={contactAvatar}
                onSelectAvatar={(url) => setContactAvatar(url)}
                contactName={contactName}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500">Nombre</label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full bg-zinc-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Usuario / Handle</label>
                  <input
                    type="text"
                    value={contactHandle}
                    onChange={(e) => setContactHandle(e.target.value)}
                    className="w-full bg-zinc-800 text-white text-xs rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-zinc-500">Hora</label>
                  <input
                    type="text"
                    value={currentTime}
                    onChange={(e) => setCurrentTime(e.target.value)}
                    className="w-full bg-zinc-800 text-white text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500">Batería %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={batteryLevel}
                    onChange={(e) => setBatteryLevel(parseInt(e.target.value, 10) || 100)}
                    className="w-full bg-zinc-800 text-white text-xs rounded-lg px-2 py-1.5 border border-zinc-700 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <button
                    onClick={() => setIsVerified(!isVerified)}
                    className={`h-[30px] rounded-lg text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                      isVerified
                        ? "bg-blue-600/20 text-blue-400 border-blue-500"
                        : "bg-zinc-800 text-zinc-500 border-zinc-700"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verif.</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            RIGHT COLUMN: DUAL-MODE PREVIEW & EXPORT (7 Cols)
            ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-2 bg-zinc-900 p-1.5 rounded-2xl border border-zinc-800 shadow-sm">
            <button
              onClick={() => setOutputMode("carousel")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                outputMode === "carousel"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>📸 Capturas / Carrusel ({slides.length} diapositivas)</span>
            </button>

            <button
              onClick={() => setOutputMode("video")}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                outputMode === "video"
                  ? "bg-purple-600 text-white shadow-md"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>🎬 Vídeo Animado (Tiempo Real)</span>
            </button>
          </div>

          {/* Active Mode Viewport */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-xl backdrop-blur-sm">
            {outputMode === "carousel" ? (
              <CarouselSlideViewer
                slides={slides}
                settings={settings}
                targetSlides={targetSlides}
                onTargetSlidesChange={setTargetSlides}
              />
            ) : (
              <VideoPlayerView messages={messages} settings={settings} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
