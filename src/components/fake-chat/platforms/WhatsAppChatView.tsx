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
  const headerBg = isDark ? "bg-[#1F2C34] text-white border-zinc-800" : "bg-[#075E54] text-white border-[#064e46]";
  const canvasBg = isDark ? "bg-[#0B141A]" : "bg-[#EFEAE2]";
  const incomingBubble = isDark ? "bg-[#202C33] text-white" : "bg-white text-zinc-900";
  const outgoingBubble = isDark ? "bg-[#005C4B] text-white" : "bg-[#D9FDD3] text-zinc-900";
  const timeText = isDark ? "text-zinc-400" : "text-zinc-500";

  return (
    <div
      id={id}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${canvasBg}`}
    >
      {/* 1. Android / iOS Status Bar */}
      <div className={`h-8 px-6 pt-2 flex items-center justify-between text-xs font-semibold z-20 ${isDark ? "bg-[#1F2C34] text-zinc-300" : "bg-[#075E54] text-zinc-200"}`}>
        <span>{settings.currentTime}</span>
        <div className="flex items-center gap-2">
          {settings.wifi && (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.39.37-.39 1 .01 1.38L11.3 20.08c.39.39 1.02.39 1.41 0L23.7 9.05c.39-.38.4-1.01.01-1.38C20.65 4.78 16.53 3 12 3z" />
            </svg>
          )}
          <span className="text-[11px] font-mono">{settings.batteryLevel}%</span>
          <div className="w-5 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
            <div
              className="h-full bg-current rounded-2xs"
              style={{ width: `${Math.min(100, Math.max(10, settings.batteryLevel))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. WhatsApp Top Header */}
      <header className={`h-14 px-3 flex items-center justify-between flex-shrink-0 z-20 shadow-md ${headerBg}`}>
        <div className="flex items-center gap-2">
          {/* Arrow */}
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>

          {/* Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-emerald-700 flex items-center justify-center font-bold text-white text-xs">
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

          {/* Contact Details */}
          <div className="flex flex-col">
            <span className="font-bold text-sm leading-tight">{settings.contactName}</span>
            <span className="text-[11px] opacity-80 leading-none">
              {isTyping ? "escribiendo..." : settings.statusText || "en línea"}
            </span>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-4 text-white opacity-90">
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="font-bold text-base cursor-pointer">⋮</span>
        </div>
      </header>

      {/* 3. Messages Stream */}
      <div className="flex-1 px-3 py-3 overflow-y-auto flex flex-col gap-2 justify-end">
        {/* Date separator pill */}
        <div className="self-center bg-white/80 dark:bg-zinc-800/90 text-zinc-600 dark:text-zinc-300 text-[11px] font-semibold px-3 py-1 rounded-lg shadow-2xs mb-2">
          HOY
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.isMe;

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative px-3 py-2 text-[14px] leading-relaxed max-w-[82%] shadow-xs rounded-xl ${
                  isMe
                    ? `${outgoingBubble} rounded-tr-xs`
                    : `${incomingBubble} rounded-tl-xs`
                }`}
              >
                <span>{msg.text}</span>

                {/* Bubble footer with time & double checks */}
                <div className={`flex items-center justify-end gap-1 mt-0.5 text-[10px] ${timeText}`}>
                  <span>{msg.timestamp}</span>
                  {isMe && (
                    <span className="text-blue-500 font-bold ml-0.5">✓✓</span>
                  )}
                </div>

                {/* Reaction badge */}
                {msg.reaction && (
                  <div
                    className={`absolute -bottom-2.5 ${
                      isMe ? "left-2" : "right-2"
                    } bg-white dark:bg-zinc-800 text-xs px-1.5 py-0.5 rounded-full shadow-sm border border-zinc-200 dark:border-zinc-700 flex items-center justify-center`}
                  >
                    <span>{msg.reaction}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center">
            <div className={`px-3 py-2 rounded-xl rounded-tl-xs shadow-xs ${incomingBubble} flex items-center gap-1.5`}>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">escribiendo</span>
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 4. WhatsApp Bottom Input Bar */}
      <footer className="px-3 flex flex-col gap-2 flex-shrink-0 z-20 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <div className={`flex-1 h-11 px-3 rounded-full flex items-center justify-between shadow-xs ${isDark ? "bg-[#1F2C34] text-zinc-400" : "bg-white text-zinc-500"}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">😊</span>
              <span className="text-xs sm:text-sm opacity-80">Mensaje</span>
            </div>
            <div className="flex items-center gap-2.5 opacity-75 text-sm">
              <span>📎</span>
              <span>📷</span>
            </div>
          </div>

          {/* Green Microphone Button */}
          <div className="w-11 h-11 rounded-full bg-[#00A884] text-white flex items-center justify-center shadow-md flex-shrink-0">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          </div>
        </div>

        {/* iPhone / Android Home Indicator Pill */}
        <div className="w-28 h-1 bg-zinc-400/35 rounded-full mx-auto" />
      </footer>
    </div>
  );
};
