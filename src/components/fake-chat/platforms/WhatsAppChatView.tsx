"use client";

import React from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";

interface WhatsAppChatViewProps {
  settings: ChatSettings;
  messages: ChatMessage[];
  isTyping?: boolean;
  typingSender?: string;
  id?: string;
}

export const WhatsAppChatView: React.FC<WhatsAppChatViewProps> = ({
  settings,
  messages,
  isTyping = false,
  id = "whatsapp-chat-canvas",
}) => {
  const isDark = settings.theme === "dark";

  // Modern WhatsApp: Light mode uses clean white header with dark icons; dark mode uses #1F2C34
  const headerBg = isDark ? "bg-[#1F2C34] text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-200";
  const headerText = isDark ? "text-white" : "text-zinc-900";
  const headerIconColor = isDark ? "text-zinc-200" : "text-zinc-800";
  const canvasBg = isDark ? "bg-[#0B141A]" : "bg-[#EFEAE2]";
  const incomingBubble = isDark ? "bg-[#202C33] text-[#E9EDEF]" : "bg-white text-[#111B21]";
  const outgoingBubble = isDark ? "bg-[#005C4B] text-[#E9EDEF]" : "bg-[#D9FDD3] text-[#111B21]";
  const timeText = isDark ? "text-zinc-400" : "text-[#667781]";

  const fontSizeClass =
    settings.fontSize === "xlarge"
      ? "text-[18.5px] sm:text-[20.5px] leading-relaxed"
      : settings.fontSize === "normal"
      ? "text-[14px] sm:text-[15px] leading-snug"
      : "text-[16px] sm:text-[17.5px] leading-relaxed";

  return (
    <div
      id={id}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${canvasBg}`}
    >
      {/* 1. Android Top Status Bar */}
      <div className={`h-8 px-6 pt-2 flex items-center justify-between text-xs font-medium z-20 ${isDark ? "bg-[#1F2C34] text-zinc-300" : "bg-white text-zinc-700"}`}>
        <span className="font-semibold">{settings.currentTime}</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          {/* Alarm / 5G / Signal */}
          <span className="text-[10px] font-bold tracking-tighter">5G</span>
          {settings.wifi && (
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.39.37-.39 1 .01 1.38L11.3 20.08c.39.39 1.02.39 1.41 0L23.7 9.05c.39-.38.4-1.01.01-1.38C20.65 4.78 16.53 3 12 3z" />
            </svg>
          )}
          <span className="font-mono ml-0.5">{settings.batteryLevel}%</span>
          {/* Battery pill */}
          <div className="w-4.5 h-2.5 border border-current rounded-2xs p-0.5 flex items-center">
            <div
              className="h-full bg-current rounded-3xs"
              style={{ width: `${Math.min(100, Math.max(10, settings.batteryLevel))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Modern WhatsApp Top Header */}
      <header className={`h-15 px-3 flex items-center justify-between flex-shrink-0 z-20 border-b shadow-2xs ${headerBg}`}>
        <div className="flex items-center gap-2">
          {/* Thin Android Back Arrow */}
          <button type="button" className={`p-1 -ml-1 ${headerIconColor}`}>
            <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Contact Avatar */}
          <div className="w-9.5 h-9.5 rounded-full overflow-hidden bg-emerald-700 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-2xs">
            {settings.contactAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.contactAvatar}
                alt={settings.contactName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              settings.contactName.slice(0, 2).toUpperCase()
            )}
          </div>

          {/* Contact Name & Status */}
          <div className="flex flex-col ml-0.5">
            <span className={`font-semibold text-[15px] leading-snug tracking-tight ${headerText}`}>
              {settings.contactName}
            </span>
            <span className={`text-[11px] leading-none ${isTyping ? "text-emerald-500 font-medium" : "text-zinc-500 dark:text-zinc-400"}`}>
              {isTyping ? "escribiendo..." : settings.statusText || "en línea"}
            </span>
          </div>
        </div>

        {/* Action icons: Video, Call, More */}
        <div className={`flex items-center gap-4.5 ${headerIconColor}`}>
          {/* Video Icon */}
          <svg className="w-5.5 h-5.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {/* Phone Icon */}
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {/* 3 Dots */}
          <span className="font-bold text-lg leading-none cursor-pointer">⋮</span>
        </div>
      </header>

      {/* 3. Messages Stream with Authentic WhatsApp Grouping & Bubble Tails */}
      <div className="flex-1 px-3.5 py-3 overflow-y-auto flex flex-col justify-end">
        {/* Date separator pill */}
        <div className="self-center bg-white dark:bg-[#182229] text-[#54656F] dark:text-zinc-400 text-[11.5px] font-medium px-3 py-1 rounded-lg shadow-2xs mb-3 border border-black/5 dark:border-white/5">
          Hoy
        </div>

        <div className="flex flex-col gap-1">
          {messages.map((msg, index) => {
            const isMe = msg.isMe;
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFirstOfGroup = !prevMsg || prevMsg.isMe !== isMe;

            return (
              <div
                key={msg.id || index}
                className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${isFirstOfGroup && index > 0 ? "mt-2" : "mt-0.5"}`}
              >
                <div
                  className={`relative px-3.5 py-1.5 ${fontSizeClass} max-w-[84%] shadow-2xs rounded-xl ${
                    isMe
                      ? `${outgoingBubble} ${isFirstOfGroup ? "rounded-tr-2xs" : ""}`
                      : `${incomingBubble} ${isFirstOfGroup ? "rounded-tl-2xs" : ""}`
                  }`}
                >
                  {/* Subtle Corner Tail on first message of group */}
                  {isFirstOfGroup && (
                    <div
                      className={`absolute top-0 w-2.5 h-3 ${
                        isMe
                          ? "-right-1.5 [clip-path:polygon(0_0,100%_0,0_100%)] " + (isDark ? "bg-[#005C4B]" : "bg-[#D9FDD3]")
                          : "-left-1.5 [clip-path:polygon(0_0,100%_0,100%_100%)] " + (isDark ? "bg-[#202C33]" : "bg-white")
                      }`}
                    />
                  )}

                  <span>{msg.text}</span>

                  {/* Inline Footer with Timestamp and Blue Double Checks */}
                  <div className={`flex items-center justify-end gap-1 mt-0.5 -mb-0.5 text-[11px] ${timeText}`}>
                    <span>{msg.timestamp}</span>
                    {isMe && (
                      <span className="text-[#53BDEB] font-bold ml-0.5 tracking-tighter">✓✓</span>
                    )}
                  </div>

                  {/* Reaction badge */}
                  {msg.reaction && (
                    <div
                      className={`absolute -bottom-2.5 ${
                        isMe ? "left-2" : "right-2"
                      } bg-white dark:bg-[#202C33] text-xs px-1.5 py-0.5 rounded-full shadow-xs border border-zinc-200 dark:border-zinc-700 flex items-center justify-center`}
                    >
                      <span>{msg.reaction}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center mt-2">
            <div className={`px-3.5 py-2 rounded-xl rounded-tl-2xs shadow-xs ${incomingBubble} flex items-center gap-1.5`}>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">escribiendo</span>
              <div className="w-1.5 h-1.5 bg-[#00A884] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-[#00A884] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-[#00A884] rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Modern WhatsApp Floating Bottom Input Bar */}
      <footer className="px-2 flex flex-col gap-1.5 flex-shrink-0 z-20 pb-2 pt-1">
        <div className="flex items-center gap-1.5">
          {/* White Input Capsule */}
          <div className={`flex-1 h-12 px-3.5 rounded-full flex items-center justify-between shadow-xs border ${isDark ? "bg-[#1F2C34] text-zinc-400 border-zinc-800" : "bg-white text-zinc-500 border-zinc-200/80"}`}>
            <div className="flex items-center gap-2.5">
              {/* Outline Smiley */}
              <svg className="w-6 h-6 stroke-current stroke-1.5 fill-none text-zinc-500" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="9" />
                <path strokeLinecap="round" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
              </svg>
              {/* Blinking green cursor + Mensaje text */}
              <div className="flex items-center text-[15px]">
                <span className="w-0.5 h-5 bg-[#00A884] animate-pulse mr-0.5" />
                <span className="text-zinc-500 dark:text-zinc-400">Mensaje</span>
              </div>
            </div>

            {/* Paperclip & Camera Icons */}
            <div className="flex items-center gap-3 text-zinc-500 dark:text-zinc-400">
              {/* Clip */}
              <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {/* Camera */}
              <svg className="w-5.5 h-5.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </div>

          {/* Green Microphone Button */}
          <div className="w-12 h-12 rounded-full bg-[#00A884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-md flex-shrink-0 cursor-pointer transition">
            <svg className="w-5.5 h-5.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>

        {/* Android Navigation Bar (◁ ⬡ ≡) */}
        <div className="flex items-center justify-around text-zinc-400/70 pt-1 text-xs font-mono">
          <span>◁</span>
          <span className="text-sm">⬡</span>
          <span>≡</span>
        </div>
      </footer>
    </div>
  );
};
