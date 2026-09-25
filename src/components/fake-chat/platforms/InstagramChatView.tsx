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
  const headerBg = isDark ? "bg-black/95 border-zinc-800" : "bg-white/95 border-zinc-100";
  const bottomBg = isDark ? "bg-black/95 border-zinc-800" : "bg-white/95 border-zinc-100";
  const incomingBubble = isDark ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-900";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const inputBg = isDark ? "bg-zinc-900 text-zinc-300 border-zinc-800" : "bg-zinc-100 text-zinc-600 border-zinc-200";

  return (
    <div
      id={id}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${bgClass}`}
    >
      {/* 1. iOS / Android Top Status Bar */}
      <div className={`h-8 px-6 pt-2 flex items-center justify-between text-xs font-semibold z-20 ${textMuted}`}>
        <span>{settings.currentTime}</span>
        <div className="flex items-center gap-2">
          {settings.wifi && (
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 3C7.46 3 3.34 4.78.29 7.67c-.39.37-.39 1 .01 1.38L11.3 20.08c.39.39 1.02.39 1.41 0L23.7 9.05c.39-.38.4-1.01.01-1.38C20.65 4.78 16.53 3 12 3z" />
            </svg>
          )}
          <span className="text-[11px] font-mono">{settings.batteryLevel}%</span>
          {/* Battery pill */}
          <div className="w-5 h-2.5 border border-current rounded-sm p-0.5 flex items-center">
            <div
              className="h-full bg-current rounded-2xs"
              style={{ width: `${Math.min(100, Math.max(10, settings.batteryLevel))}%` }}
            />
          </div>
        </div>
      </div>

      {/* 2. Instagram Header */}
      <header className={`h-14 px-4 border-b flex items-center justify-between flex-shrink-0 z-20 ${headerBg}`}>
        <div className="flex items-center gap-3">
          {/* Back Chevron */}
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>

          {/* Avatar with gradient border if active */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px]">
              <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-xs font-bold text-white">
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
            </div>
            {/* Active green dot */}
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-black" />
          </div>

          {/* User Name & Handle */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-bold text-sm leading-tight">{settings.contactName}</span>
              {settings.isVerified && (
                <svg className="w-3.5 h-3.5 fill-blue-500 text-white" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L11 14.17l7.59-7.59L20 8l-9 9z" />
                </svg>
              )}
            </div>
            <span className={`text-[11px] leading-none ${textMuted}`}>
              @{settings.contactHandle || settings.contactName.toLowerCase().replace(/\s+/g, "_")}
            </span>
          </div>
        </div>

        {/* Action Icons */}
        <div className="flex items-center gap-4">
          <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </header>

      {/* 3. Messages Chat Canvas */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex flex-col gap-2.5 justify-end">
        {/* Profile Card Center Header */}
        <div className="flex flex-col items-center my-4 text-center">
          <div className="w-16 h-16 rounded-full overflow-hidden mb-2 bg-gradient-to-tr from-yellow-400 via-rose-500 to-purple-600 p-[2px]">
            <div className="w-full h-full rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center text-lg font-bold text-white">
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
          </div>
          <span className="font-bold text-base">{settings.contactName}</span>
          <span className={`text-xs ${textMuted}`}>Instagram · 2.4k seguidores</span>
          <div className={`mt-2 text-xs font-semibold px-3 py-1 rounded-lg ${isDark ? "bg-zinc-900 text-zinc-300" : "bg-zinc-100 text-zinc-700"}`}>
            Ver perfil
          </div>
        </div>

        {/* Message Stream */}
        {messages.map((msg, index) => {
          const isMe = msg.isMe;
          const isLastFromMe = isMe && index === messages.length - 1;

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div className="relative group max-w-[80%]">
                <div
                  className={`px-4 py-2.5 text-[14px] leading-relaxed font-normal shadow-xs ${
                    isMe
                      ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white rounded-3xl rounded-br-xs"
                      : `${incomingBubble} rounded-3xl rounded-bl-xs`
                  }`}
                >
                  <span>{msg.text}</span>
                </div>

                {/* Optional Reaction Tag (Heart / Emoji) */}
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

              {/* Status on last message from Me */}
              {isLastFromMe && (
                <span className={`text-[10px] mt-1 pr-1 ${textMuted}`}>Visto</span>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-zinc-800 text-[10px] text-white flex items-center justify-center font-bold">
              {settings.contactAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={settings.contactAvatar}
                  alt={settings.contactName}
                  className="w-full h-full object-cover"
                />
              ) : (
                settings.contactName.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className={`px-3 py-2 rounded-2xl rounded-bl-xs ${incomingBubble} flex items-center gap-1`}>
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Instagram Native Bottom Bar */}
      <footer className={`px-4 border-t flex flex-col gap-2 flex-shrink-0 z-20 pb-3 pt-2 ${bottomBg}`}>
        <div className="flex items-center gap-3">
          {/* Blue Camera Circle */}
          <div className="w-9 h-9 rounded-full bg-blue-500 text-white flex items-center justify-center flex-shrink-0 cursor-pointer">
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 15.2a3.2 3.2 0 100-6.4 3.2 3.2 0 000 6.4z" />
              <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
            </svg>
          </div>

          {/* Input field */}
          <div className={`flex-1 h-10 px-4 rounded-full border flex items-center justify-between text-xs ${inputBg}`}>
            <span>Mensaje...</span>
            <div className="flex items-center gap-2 opacity-80">
              <span>🎙️</span>
              <span>🖼️</span>
              <span>❤️</span>
            </div>
          </div>
        </div>

        {/* iPhone Home Indicator */}
        <div className="w-32 h-1 bg-zinc-400/35 rounded-full mx-auto" />
      </footer>
    </div>
  );
};
