"use client";

import React, { useState, useRef } from "react";
import { CarouselSlide, ChatSettings } from "@/lib/fake-chat/types";
import { ChatCanvas } from "./ChatCanvas";
import { toPng } from "html-to-image";
import JSZip from "jszip";
import { Download, ChevronLeft, ChevronRight, Archive, Sparkles, Layers } from "lucide-react";

interface CarouselSlideViewerProps {
  slides: CarouselSlide[];
  settings: ChatSettings;
}

export const CarouselSlideViewer: React.FC<CarouselSlideViewerProps> = ({
  slides,
  settings,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const canvasRef = useRef<HTMLDivElement>(null);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 bg-zinc-50 dark:bg-zinc-900 rounded-3xl border border-dashed border-zinc-300 dark:border-zinc-800">
        <Layers className="w-12 h-12 mb-3 opacity-40" />
        <p className="font-semibold text-base">Pega un guión para generar el carrusel de diapositivas</p>
        <p className="text-xs text-zinc-400 mt-1">El sistema dividirá automáticamente la conversación en diapositivas listas para publicar.</p>
      </div>
    );
  }

  const activeSlide = slides[currentSlideIndex] || slides[0];

  // Export current slide as PNG
  const handleDownloadCurrentSlide = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      setExportProgress("Generando PNG...");
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 2, // High resolution (Retina)
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `carrusel-slide-${activeSlide.slideIndex}-${settings.platform}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Error generating slide PNG:", err);
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  // Export all slides as a ZIP pack
  const handleDownloadAllZip = async () => {
    if (!canvasRef.current) return;
    try {
      setIsExporting(true);
      const zip = new JSZip();
      const folder = zip.folder("carrusel-autobirthday");

      const originalIndex = currentSlideIndex;

      for (let i = 0; i < slides.length; i++) {
        setExportProgress(`Procesando slide ${i + 1} de ${slides.length}...`);
        setCurrentSlideIndex(i);

        // Wait a tick for React to re-render DOM
        await new Promise((r) => setTimeout(r, 220));

        if (canvasRef.current) {
          const dataUrl = await toPng(canvasRef.current, {
            pixelRatio: 2,
            cacheBust: true,
          });
          const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
          folder?.file(`slide-${String(i + 1).padStart(2, "0")}.png`, base64Data, { base64: true });
        }
      }

      setExportProgress("Comprimiendo archivo ZIP...");
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);

      const link = document.createElement("a");
      link.download = `carrusel-${settings.platform}-${Date.now()}.zip`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      // Restore original slide index
      setCurrentSlideIndex(originalIndex);
    } catch (err) {
      console.error("Error creating ZIP carousel pack:", err);
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* 1. Carousel Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/90 text-white p-3.5 rounded-2xl border border-zinc-800 backdrop-blur-md shadow-lg">
        {/* Slide Counter & Subtitle */}
        <div className="flex items-center gap-2.5">
          <span className="bg-emerald-500/20 text-emerald-400 text-xs font-black px-2.5 py-1 rounded-full border border-emerald-500/30">
            Slide {activeSlide.slideIndex} / {slides.length}
          </span>
          <span className="text-xs text-zinc-300 font-medium hidden sm:inline">
            {activeSlide.subtitle}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCurrentSlide}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold rounded-xl border border-zinc-700 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar PNG</span>
          </button>

          <button
            onClick={handleDownloadAllZip}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Descargar Pack ZIP</span>
          </button>
        </div>
      </div>

      {/* Export progress toast indicator */}
      {isExporting && (
        <div className="flex items-center justify-center gap-2 p-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-xl animate-pulse">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>{exportProgress}</span>
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
          messages={activeSlide.messages}
          canvasId="carousel-current-slide-canvas"
        />
      </div>

      {/* 3. Slide Thumbnails & Stepper */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentSlideIndex === 0}
          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 transition cursor-pointer"
          title="Slide anterior"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Thumbnail Dots */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {slides.map((slide, idx) => (
            <button
              key={slide.slideIndex}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2.5 rounded-full transition-all duration-200 cursor-pointer ${
                idx === currentSlideIndex
                  ? "w-8 bg-emerald-500 shadow-xs"
                  : "w-2.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
              }`}
              title={`Ir a Diapositiva ${slide.slideIndex}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
          disabled={currentSlideIndex === slides.length - 1}
          className="p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 disabled:opacity-30 transition cursor-pointer"
          title="Siguiente slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
