"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";
import { ChatCanvas } from "./ChatCanvas";
import { playSentSound, playReceivedSound } from "@/lib/fake-chat/sound";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Video, Sparkles } from "lucide-react";
import { toPng } from "html-to-image";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

interface VideoPlayerViewProps {
  messages: ChatMessage[];
  settings: ChatSettings;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  messages,
  settings,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingProgress, setRecordingProgress] = useState("");

  const canvasRef = useRef<HTMLDivElement>(null);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSteps = messages.length;
  const currentMessages = messages.slice(0, currentStep);

  // Stop animation
  const stopAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearTimeout(animationTimerRef.current);
      animationTimerRef.current = null;
    }
    setIsPlaying(false);
    setIsTyping(false);
  }, []);

  // Advance step with realistic typing delay & comfortable reading time
  const advanceStep = useCallback(
    (step: number) => {
      if (step >= totalSteps) {
        setIsPlaying(false);
        setIsTyping(false);
        return;
      }

      const nextMessage = messages[step];
      const isNextIncoming = !nextMessage.isMe;

      // Realistic words calculation (~220ms per word + 1.2s base absorption)
      const words = Math.max(3, nextMessage.text.trim().split(/\s+/).length);
      const isLast = step + 1 >= totalSteps;
      const naturalReadDelay =
        (isLast ? 3800 : Math.max(2200, Math.min(4600, words * 240 + 1200))) / speedMultiplier;

      // Realistic typing indicator before incoming messages
      if (isNextIncoming && step > 0) {
        setIsTyping(true);
        const typingDelay = Math.max(900, Math.min(1800, words * 110 + 600)) / speedMultiplier;

        animationTimerRef.current = setTimeout(() => {
          setIsTyping(false);
          setCurrentStep(step + 1);
          if (soundEnabled) playReceivedSound();

          animationTimerRef.current = setTimeout(() => {
            advanceStep(step + 1);
          }, naturalReadDelay);
        }, typingDelay);
      } else {
        // Outgoing message
        setCurrentStep(step + 1);
        if (soundEnabled) playSentSound();

        animationTimerRef.current = setTimeout(() => {
          advanceStep(step + 1);
        }, naturalReadDelay);
      }
    },
    [messages, totalSteps, speedMultiplier, soundEnabled]
  );

  // Play / Pause toggle
  const handleTogglePlay = () => {
    if (isPlaying) {
      stopAnimation();
    } else {
      if (currentStep >= totalSteps) {
        setCurrentStep(0);
      }
      setIsPlaying(true);
    }
  };

  // Reset animation
  const handleReset = () => {
    stopAnimation();
    setCurrentStep(0);
  };

  useEffect(() => {
    if (isPlaying) {
      advanceStep(currentStep);
    }
    return () => {
      if (animationTimerRef.current) clearTimeout(animationTimerRef.current);
    };
  }, [isPlaying, advanceStep, currentStep]);

  // Video recording engine using frame-by-frame capture + mp4-muxer / WebCodecs (fallback to MediaRecorder)
  const handleExportVideo = async () => {
    if (!canvasRef.current || messages.length === 0) return;

    try {
      setIsRecording(true);
      stopAnimation();

      // Create an offscreen recording canvas
      const offscreenCanvas = document.createElement("canvas");
      const ctx = offscreenCanvas.getContext("2d");
      if (!ctx) throw new Error("Could not initialize 2D context");

      // Match exact vertical export resolution (1080x1920 for 9:16 vertical stories/reels, 1080x1350 for 4:5 feed)
      const videoWidth = 1080;
      const videoHeight = settings.aspectRatio === "4:5" ? 1350 : 1920;
      offscreenCanvas.width = videoWidth;
      offscreenCanvas.height = videoHeight;

      const isDark = settings.theme === "dark";
      const canvasBg =
        settings.platform === "whatsapp"
          ? isDark
            ? "#0B141A"
            : "#EFEAE2"
          : isDark
          ? "#000000"
          : "#FFFFFF";

      const fps = 30;
      const frameDurationMicroseconds = Math.round(1_000_000 / fps);

      // Helper to draw snapshot with aspect-fit centering & zero distortion
      const drawSnapshotToCanvas = async (imgDataUrl: string) => {
        const img = new Image();
        img.src = imgDataUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.fillStyle = canvasBg;
            ctx.fillRect(0, 0, videoWidth, videoHeight);

            const scale = Math.min(videoWidth / img.width, videoHeight / img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const drawX = (videoWidth - drawWidth) / 2;
            const drawY = (videoHeight - drawHeight) / 2;

            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            resolve(true);
          };
        });
      };

      // Check if WebCodecs VideoEncoder + mp4-muxer is available in browser
      const supportsWebCodecs =
        typeof window !== "undefined" &&
        typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" &&
        typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame === "function";

      if (supportsWebCodecs) {
        const target = new ArrayBufferTarget();
        const muxer = new Muxer({
          target,
          video: {
            codec: "avc",
            width: videoWidth,
            height: videoHeight,
            frameRate: fps,
          },
          fastStart: "in-memory",
          firstTimestampBehavior: "offset",
        });

        const videoEncoder = new VideoEncoder({
          output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
          error: (e) => console.error("VideoEncoder error:", e),
        });

        const encoderConfig: VideoEncoderConfig = {
          codec: "avc1.4d002a", // H.264 Main Profile level 4.2
          width: videoWidth,
          height: videoHeight,
          bitrate: 5_000_000,
          framerate: fps,
        };

        try {
          const check = await VideoEncoder.isConfigSupported(encoderConfig);
          if (!check.supported) {
            encoderConfig.codec = "avc1.42001f"; // Fallback to baseline profile
          }
        } catch {
          encoderConfig.codec = "avc1.42001f";
        }

        videoEncoder.configure(encoderConfig);

        let currentTimestampMicroseconds = 0;
        let frameCount = 0;

        const encodeFrames = (seconds: number) => {
          const framesToEncode = Math.round(seconds * fps);
          for (let f = 0; f < framesToEncode; f++) {
            const frame = new VideoFrame(offscreenCanvas, {
              timestamp: currentTimestampMicroseconds,
            });
            videoEncoder.encode(frame, { keyFrame: frameCount % (fps * 2) === 0 });
            frame.close();
            currentTimestampMicroseconds += frameDurationMicroseconds;
            frameCount++;
          }
        };

        // Render each message step
        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const isIncoming = !msg.isMe;

          // 1. If incoming message and not the very first message, render authentic typing indicator first
          if (isIncoming && i > 0) {
            setRecordingProgress(`Escribiendo mensaje ${i + 1} de ${messages.length}...`);
            setCurrentStep(i);
            setIsTyping(true);
            await new Promise((r) => setTimeout(r, 220));

            if (canvasRef.current) {
              const typingImg = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
              await drawSnapshotToCanvas(typingImg);
              // Hold typing bubble for 0.85s (smooth conversational pause)
              encodeFrames(0.85);
            }
            setIsTyping(false);
          }

          // 2. Reveal message i+1
          setRecordingProgress(`Mostrando mensaje ${i + 1} de ${messages.length}...`);
          setCurrentStep(i + 1);
          await new Promise((r) => setTimeout(r, 220));

          if (canvasRef.current) {
            const msgImg = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
            await drawSnapshotToCanvas(msgImg);

            // Natural reading time based on word count
            const words = Math.max(3, msg.text.trim().split(/\s+/).length);
            const isLast = i === messages.length - 1;
            // Last message holds for 4.2s for complete reading & reflection; intermediate holds 2.2s - 3.8s
            const readingSeconds = isLast ? 4.2 : Math.max(2.2, Math.min(3.8, words * 0.22 + 1.2));
            encodeFrames(readingSeconds);
          }
        }

        setRecordingProgress("Generando archivo MP4...");
        await videoEncoder.flush();
        muxer.finalize();

        const blob = new Blob([target.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.download = `video-chat-${settings.platform}-${Date.now()}.mp4`;
        a.href = url;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Fallback using MediaRecorder if WebCodecs is not supported
        const stream = offscreenCanvas.captureStream(fps);
        const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
          ? "video/mp4;codecs=avc1"
          : MediaRecorder.isTypeSupported("video/mp4")
          ? "video/mp4"
          : MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm";

        const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };

        recorder.start();

        for (let i = 0; i < messages.length; i++) {
          const msg = messages[i];
          const isIncoming = !msg.isMe;

          if (isIncoming && i > 0) {
            setRecordingProgress(`Escribiendo mensaje ${i + 1} de ${messages.length}...`);
            setCurrentStep(i);
            setIsTyping(true);
            await new Promise((r) => setTimeout(r, 220));

            if (canvasRef.current) {
              const typingImg = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
              await drawSnapshotToCanvas(typingImg);
              await new Promise((r) => setTimeout(r, 850));
            }
            setIsTyping(false);
          }

          setRecordingProgress(`Mostrando mensaje ${i + 1} de ${messages.length}...`);
          setCurrentStep(i + 1);
          await new Promise((r) => setTimeout(r, 220));

          if (canvasRef.current) {
            const msgImg = await toPng(canvasRef.current, { pixelRatio: 2, cacheBust: true });
            await drawSnapshotToCanvas(msgImg);

            const words = Math.max(3, msg.text.trim().split(/\s+/).length);
            const isLast = i === messages.length - 1;
            const readingMs = (isLast ? 4200 : Math.max(2200, Math.min(3800, words * 220 + 1200)));
            await new Promise((r) => setTimeout(r, readingMs));
          }
        }

        setRecordingProgress("Finalizando vídeo...");
        recorder.stop();

        await new Promise((resolve) => {
          recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            const ext = mimeType.includes("mp4") ? "mp4" : "webm";
            a.download = `video-chat-${settings.platform}-${Date.now()}.${ext}`;
            a.href = url;
            a.click();
            URL.revokeObjectURL(url);
            resolve(true);
          };
        });
      }
    } catch (err) {
      console.error("Error exporting chat video:", err);
    } finally {
      setIsRecording(false);
      setRecordingProgress("");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Animated Video Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 text-white p-3.5 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-lg">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            disabled={isRecording}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? "Pausar" : currentStep >= totalSteps ? "Repetir" : "Reproducir"}</span>
          </button>

          <button
            onClick={handleReset}
            disabled={isRecording}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition cursor-pointer"
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
          disabled={isRecording}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
        >
          <Video className="w-3.5 h-3.5" />
          <span>Exportar Vídeo MP4</span>
        </button>
      </div>

      {/* Recording progress indicator */}
      {isRecording && (
        <div className="flex items-center justify-center gap-2 p-2.5 bg-purple-950/80 border border-purple-500/40 text-purple-300 text-xs font-bold rounded-xl animate-pulse">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{recordingProgress}</span>
        </div>
      )}

      {/* 2. Device Canvas Preview */}
      <div
        className={`relative mx-auto w-full transition-all duration-300 ${
          settings.aspectRatio === "9:16"
            ? "max-w-[340px] sm:max-w-[360px] aspect-[9/16]"
            : "max-w-[420px] aspect-[4/5]"
        }`}
      >
        <ChatCanvas
          ref={canvasRef}
          settings={settings}
          messages={currentMessages}
          isTyping={isTyping}
          canvasId="video-player-canvas"
        />
      </div>

      {/* 3. Message Progress Bar */}
      <div className="flex items-center gap-3 px-2">
        <span className="text-xs font-mono text-zinc-500">0</span>
        <div className="flex-1 h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
            style={{ width: `${totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0}%` }}
          />
        </div>
        <span className="text-xs font-mono text-zinc-500">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  );
};
