"use client";

import React from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";

interface InstagramChatViewProps {
  settings: ChatSettings;
  messages: ChatMessage[];
  isTyping?: boolean;
  typingSender?: string;
  id?: string;
}

export const InstagramChatView: React.FC<InstagramChatViewProps> = ({
  settings,
  messages,
  isTyping = false,
  id = "instagram-chat-canvas",
}) => {
  const isDark = settings.theme === "dark";
  const bgClass = isDark ? "bg-black text-white" : "bg-white text-zinc-900";
  const headerBg = isDark ? "bg-black border-zinc-900" : "bg-white border-zinc-100";
  const incomingBubble = isDark ? "bg-[#262626] text-white" : "bg-[#EFEFEF] text-zinc-900";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";

  const fontSizeClass =
    settings.fontSize === "xlarge"
      ? "text-[18.5px] sm:text-[20.5px] leading-relaxed"
      : settings.fontSize === "normal"
      ? "text-[14px] sm:text-[15px] leading-snug"
      : "text-[16px] sm:text-[17.5px] leading-relaxed";

  return (
    <div
      id={id}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${bgClass}`}
    >
      {/* 1. Android Top Status Bar */}
      <div className={`h-8 px-6 pt-2 flex items-center justify-between text-xs font-medium z-20 ${textMuted}`}>
        <span className="font-semibold">{settings.currentTime}</span>
        <div className="flex items-center gap-1.5 text-[11px]">
          <span className="text-[10px] font-bold tracking-tighter">5G</span>
          {settings.wifi && (
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.39.37-.39 1 .01 1.38L11.3 20.08c.39.39 1.02.39 1.41 0L23.7 9.05c.39-.38.4-1.01.01-1.38C20.65 4.78 16.53 3 12 3z" />
            </svg>
          )}
          <span className="font-mono ml-0.5">{settings.batteryLevel}%</span>
          <div className="w-4.5 h-2.5 border border-current rounded-2xs p-0.5 flex items-center">
            <div
              className="h-full bg-current rounded-3xs"
              style={{ width: `${Math.min(100, Math.max(10, settings.batteryLevel))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Instagram Header */}
      <header className={`h-15 px-3.5 border-b flex items-center justify-between flex-shrink-0 z-20 ${headerBg}`}>
        <div className="flex items-center gap-2.5">
          {/* Thin Back Arrow */}
          <button type="button" className="p-1 -ml-1 text-current">
            <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          {/* Contact Avatar */}
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-800 shrink-0">
            {settings.contactAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.contactAvatar}
                alt={settings.contactName}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white">
                {settings.contactName.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          {/* User Name with chevron & Handle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-[15px] leading-tight text-current">
                {settings.contactName}
              </span>
              <span className="text-zinc-400 text-xs">›</span>
              {settings.isVerified && (
                <svg className="w-3.5 h-3.5 fill-[#0095F6] text-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
                </svg>
              )}
            </div>
            <span className={`text-[11px] leading-none ${textMuted}`}>
              {settings.contactHandle || settings.contactName.toLowerCase().replace(/\s+/g, "_")}
            </span>
          </div>
        </div>

        {/* Action Icons: Call, Video */}
        <div className="flex items-center gap-4 text-current">
          {/* Call icon */}
          <svg className="w-5.5 h-5.5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {/* Video camera icon */}
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </header>

      {/* 3. Messages Chat Canvas */}
      <div className="flex-1 px-3.5 py-3 overflow-y-auto flex flex-col justify-end gap-1.5">
        {/* Centered Timestamp Header */}
        <div className={`self-center text-[11px] font-medium tracking-tight mb-2 ${textMuted}`}>
          DOM, {settings.currentTime}
        </div>

        {/* Message Stream */}
        {messages.map((msg, index) => {
          const isMe = msg.isMe;
          const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
          // In Instagram DM, show avatar on the last message of an incoming group
          const showAvatar = !isMe && (!nextMsg || nextMsg.isMe);

          return (
            <div
              key={msg.id || index}
              className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {/* Incoming Avatar next to bubble */}
              {!isMe && (
                showAvatar ? (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 shrink-0 mb-0.5">
                    {settings.contactAvatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={settings.contactAvatar}
                        alt={settings.contactName}
                        className="w-full h-full object-cover"
                        crossOrigin="anonymous"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white">
                        {settings.contactName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-7 h-7 shrink-0 mb-0.5" />
                )
              )}

              {/* Message Bubble */}
              <div
                className={`px-4 py-2.5 ${fontSizeClass} max-w-[80%] rounded-[22px] ${
                  isMe
                    ? "bg-gradient-to-r from-[#7000FF] via-[#A824FF] to-[#D80070] text-white"
                    : `${incomingBubble}`
                }`}
              >
                <span>{msg.text}</span>

                {/* Reaction Tag */}
                {msg.reaction && (
                  <div
                    className={`absolute -bottom-2 ${
                      isMe ? "left-2" : "right-2"
                    } bg-zinc-800 text-xs px-1.5 py-0.5 rounded-full border border-zinc-700 shadow-md flex items-center justify-center scale-90`}
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
          <div className="flex items-center gap-2 mt-1">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-800 shrink-0 mb-0.5">
              {settings.contactAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.contactAvatar}
                  alt={settings.contactName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-white">
                  {settings.contactName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div className={`px-4 py-2.5 rounded-[20px] ${incomingBubble} flex items-center gap-1.5`}>
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Instagram Bottom Input Bar */}
      <footer className="px-2 flex flex-col gap-1.5 flex-shrink-0 z-20 pb-2 pt-1">
        <div className={`h-12 px-2 rounded-full flex items-center justify-between shadow-xs border ${isDark ? "bg-[#262626] border-zinc-800 text-zinc-300" : "bg-[#F2F2F2] border-zinc-200 text-zinc-700"}`}>
          {/* Blue Camera Button */}
          <div className="w-9 h-9 rounded-full bg-[#0095F6] flex items-center justify-center text-white shrink-0 shadow-xs cursor-pointer">
            <svg className="w-4.5 h-4.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>

          {/* Placeholder */}
          <span className="flex-1 text-[14.5px] px-3 text-zinc-400 select-none">
            Envía un mens...
          </span>

          {/* Action Icons: Mic, Gallery, Sticker, Plus */}
          <div className="flex items-center gap-2.5 text-zinc-300 pr-1.5">
            {/* Microphone */}
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
            {/* Gallery Image */}
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15l-5-5L5 21" />
            </svg>
            {/* Sticker Smiley */}
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" d="M9 10h.01M15 10h.01M9.5 15a3.5 3.5 0 005 0" />
            </svg>
            {/* Plus in circle */}
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
            </svg>
          </div>
        </div>

        {/* Android Navigation Bar */}
        <div className="flex items-center justify-around text-zinc-500 pt-1 text-xs font-mono">
          <span>◁</span>
          <span className="text-sm">⬡</span>
          <span>≡</span>
        </div>
      </footer>
    </div>
  );
};
