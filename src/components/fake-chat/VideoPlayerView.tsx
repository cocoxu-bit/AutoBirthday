"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";
import {
  computeChatTimeline,
  drawChatFrame,
  exportCanvasVideoMP4,
  preloadImage,
} from "@/lib/fake-chat/canvas-renderer";
import { playSentSound, playReceivedSound } from "@/lib/fake-chat/sound";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Video, Sparkles } from "lucide-react";

interface VideoPlayerViewProps {
  messages: ChatMessage[];
  settings: ChatSettings;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  messages,
  settings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState("");
  const [exportPercent, setExportPercent] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rAFRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const lastSoundEventIndexRef = useRef<number>(-1);

  const canvasWidth = 1080;
  const canvasHeight = settings.aspectRatio === "4:5" ? 1350 : 1920;

  // Precompute conversation timeline
  const timeline = useMemo(() => {
    return computeChatTimeline(messages, settings, canvasWidth, speedMultiplier);
  }, [messages, settings, canvasWidth, speedMultiplier]);

  const totalDuration = timeline.totalDuration;

  // Render a specific frame on the canvas
  const renderFrameAt = useCallback(
    (t: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      drawChatFrame(ctx, canvasWidth, canvasHeight, t, messages, settings, timeline);
    },
    [canvasWidth, canvasHeight, messages, settings, timeline]
  );

  // Preload avatar image on mount or when avatar changes
  useEffect(() => {
    if (settings.contactAvatar) {
      preloadImage(settings.contactAvatar).then(() => {
        renderFrameAt(currentTimeRef.current);
      });
    }
  }, [settings.contactAvatar, renderFrameAt]);

  // Redraw when timeline, messages or settings change
  useEffect(() => {
    renderFrameAt(currentTimeRef.current);
  }, [timeline, renderFrameAt]);

  // Stop animation loop
  const stopPlayback = useCallback(() => {
    if (rAFRef.current !== null) {
      cancelAnimationFrame(rAFRef.current);
      rAFRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  // Animation frame loop for continuous 60fps playback
  const tick = useCallback(
    (now: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = now;
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Advance time smoothly according to speed
      const newTime = currentTimeRef.current + dt * speedMultiplier;
      currentTimeRef.current = newTime;

      // Trigger sound effects exactly when a message appears
      if (soundEnabled) {
        for (let i = 0; i < timeline.events.length; i++) {
          const ev = timeline.events[i];
          if (
            newTime >= ev.appearTime &&
            lastSoundEventIndexRef.current < i &&
            ev.appearTime > 0.1
          ) {
            lastSoundEventIndexRef.current = i;
            if (ev.isIncoming) {
              playReceivedSound();
            } else {
              playSentSound();
            }
          }
        }
      }

      // Check if finished
      if (newTime >= totalDuration) {
        currentTimeRef.current = totalDuration;
        setCurrentTime(totalDuration);
        renderFrameAt(totalDuration);
        stopPlayback();
        return;
      }

      setCurrentTime(newTime);
      renderFrameAt(newTime);

      rAFRef.current = requestAnimationFrame(tick);
    },
    [speedMultiplier, soundEnabled, timeline.events, totalDuration, renderFrameAt, stopPlayback]
  );

  // Toggle Play / Pause
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      if (currentTimeRef.current >= totalDuration - 0.1) {
        currentTimeRef.current = 0;
        lastSoundEventIndexRef.current = -1;
        setCurrentTime(0);
      }
      lastTimeRef.current = performance.now();
      setIsPlaying(true);
      rAFRef.current = requestAnimationFrame(tick);
    }
  };

  // Reset playback to start
  const handleReset = () => {
    stopPlayback();
    currentTimeRef.current = 0;
    lastSoundEventIndexRef.current = -1;
    setCurrentTime(0);
    renderFrameAt(0);
  };

  // Scrubber dragging
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    stopPlayback();
    currentTimeRef.current = seekTime;
    setCurrentTime(seekTime);

    // Recalculate sound trigger state to avoid missing or repeated sounds
    let lastIdx = -1;
    for (let i = 0; i < timeline.events.length; i++) {
      if (seekTime >= timeline.events[i].appearTime) {
        lastIdx = i;
      }
    }
    lastSoundEventIndexRef.current = lastIdx;

    renderFrameAt(seekTime);
  };

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (rAFRef.current !== null) {
        cancelAnimationFrame(rAFRef.current);
      }
    };
  }, []);

  // Export high-fidelity 30fps MP4 video
  const handleExportVideo = async () => {
    if (messages.length === 0 || isExporting) return;

    try {
      setIsExporting(true);
      stopPlayback();

      const blob = await exportCanvasVideoMP4(
        messages,
        settings,
        (progressText, percent) => {
          setExportProgress(progressText);
          setExportPercent(percent);
        }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.download = `video-chat-${settings.platform}-${Date.now()}.mp4`;
      a.href = url;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error exporting chat video:", err);
    } finally {
      setIsExporting(false);
      setExportProgress("");
      setExportPercent(0);
    }
  };

  // Format seconds into MM:SS
  const formatTime = (secs: number) => {
    const s = Math.floor(Math.max(0, secs));
    const m = Math.floor(s / 60);
    const remS = s % 60;
    return `${m}:${remS < 10 ? "0" : ""}${remS}`;
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Video Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 text-white p-3.5 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-lg">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pausar" : currentTime >= totalDuration - 0.1 ? "Repetir" : "Reproducir"}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isExporting}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition cursor-pointer disabled:opacity-50"
            title="Reiniciar conversación"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border transition cursor-pointer ${
              soundEnabled
                ? "bg-zinc-800 text-emerald-400 border-emerald-500/40"
                : "bg-zinc-800 text-zinc-500 border-zinc-700"
            }`}
            title={soundEnabled ? "Silenciar efectos" : "Activar efectos sonoros"}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-zinc-800 rounded-xl p-0.5 border border-zinc-700 text-[11px] font-bold">
            {[1, 1.5, 2].map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeedMultiplier(sp)}
                className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
                  speedMultiplier === sp ? "bg-emerald-500 text-white" : "text-zinc-400 hover:text-white"
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Video Export Button */}
        <button
          onClick={handleExportVideo}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Exportar Vídeo MP4 (Fluido 30fps)</span>
        </button>
      </div>

      {/* Recording progress indicator */}
      {isExporting && (
        <div className="flex flex-col gap-2 p-3.5 bg-purple-950/90 border border-purple-500/40 text-purple-200 text-xs font-bold rounded-2xl shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
              <span>{exportProgress || "Procesando fotogramas fluidos..."}</span>
            </div>
            <span className="font-mono text-purple-300">{exportPercent}%</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-2 bg-purple-900/60 rounded-full overflow-hidden border border-purple-500/30">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-emerald-400 transition-all duration-150 rounded-full"
              style={{ width: `${exportPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* 2. Interactive High-FPS Canvas Preview */}
      <div
        className={`relative mx-auto w-full transition-all duration-300 ${
          settings.aspectRatio === "9:16"
            ? "max-w-[340px] sm:max-w-[360px] aspect-[9/16]"
            : "max-w-[420px] aspect-[4/5]"
        }`}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="w-full h-full object-contain rounded-[36px] shadow-2xl border border-zinc-200 dark:border-zinc-800 bg-black transition-all duration-300"
        />
      </div>

      {/* 3. Smooth Timeline Scrubber Bar */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs font-mono text-zinc-500 w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.02}
            value={currentTime}
            onChange={handleSeek}
            disabled={isExporting}
            className="w-full h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
        </div>
        <span className="text-xs font-mono text-zinc-500 w-10">
          {formatTime(totalDuration)}
        </span>
      </div>
    </div>
  );
};
