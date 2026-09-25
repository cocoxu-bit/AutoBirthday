"use client";

import React from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";

interface IMessageChatViewProps {
  settings: ChatSettings;
  messages: ChatMessage[];
  isTyping?: boolean;
  typingSender?: string;
  id?: string;
}

export const IMessageChatView: React.FC<IMessageChatViewProps> = ({
  settings,
  messages,
  isTyping = false,
  id = "imessage-chat-canvas",
}) => {
  const isDark = settings.theme === "dark";
  const bgClass = isDark ? "bg-black text-white" : "bg-white text-zinc-900";
  const headerBg = isDark ? "bg-zinc-900/90 border-zinc-800" : "bg-zinc-100/90 border-zinc-200";
  const incomingBubble = isDark ? "bg-[#26252A] text-white" : "bg-[#E9E9EB] text-black";
  const outgoingBubble = "bg-[#007AFF] text-white";
  const textMuted = isDark ? "text-zinc-400" : "text-zinc-500";
  const inputBg = isDark ? "bg-zinc-900 border-zinc-800 text-zinc-200" : "bg-white border-zinc-300 text-zinc-700";

  return (
    <div
      id={id}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden font-sans select-none ${bgClass}`}
    >
      {/* 1. iOS Top Status Bar */}
      <div className={`h-8 px-6 pt-2 flex items-center justify-between text-xs font-semibold z-20 ${textMuted}`}>
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

      {/* 2. iOS Header */}
      <header className={`h-16 px-4 border-b flex items-center justify-between flex-shrink-0 z-20 backdrop-blur-md ${headerBg}`}>
        <div className="flex items-center gap-1 text-[#007AFF] text-sm font-medium">
          <svg className="w-6 h-6 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </div>

        {/* Centered Avatar and Contact */}
        <div className="flex flex-col items-center">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-zinc-400 flex items-center justify-center font-bold text-white text-xs mb-0.5">
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
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold">{settings.contactName}</span>
            <span className="text-[10px] text-zinc-400">›</span>
          </div>
        </div>

        {/* FaceTime icon */}
        <div className="text-[#007AFF]">
          <svg className="w-6 h-6 fill-none stroke-current stroke-2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
      </header>

      {/* 3. Messages Stream */}
      <div className="flex-1 px-4 py-3 overflow-y-auto flex flex-col gap-2 justify-end">
        <div className={`self-center text-[10px] font-semibold mb-2 ${textMuted}`}>
          iMessage · Hoy {settings.currentTime}
        </div>

        {messages.map((msg, index) => {
          const isMe = msg.isMe;
          const isLastFromMe = isMe && index === messages.length - 1;

          return (
            <div
              key={msg.id || index}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`relative px-4.5 py-2.5 text-[16px] sm:text-[17px] leading-snug max-w-[82%] rounded-2xl ${
                  isMe
                    ? `${outgoingBubble} rounded-br-xs`
                    : `${incomingBubble} rounded-bl-xs`
                }`}
              >
                <span>{msg.text}</span>

                {/* Reaction badge */}
                {msg.reaction && (
                  <div
                    className={`absolute -top-3 ${
                      isMe ? "left-2" : "right-2"
                    } bg-white dark:bg-zinc-800 text-xs px-2 py-0.5 rounded-full shadow-md border border-zinc-200 dark:border-zinc-700 flex items-center justify-center`}
                  >
                    <span>{msg.reaction}</span>
                  </div>
                )}
              </div>

              {isLastFromMe && (
                <span className={`text-[10px] mt-1 pr-1 font-medium ${textMuted}`}>
                  Entregado
                </span>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center">
            <div className={`px-4 py-2.5 rounded-2xl rounded-bl-xs ${incomingBubble} flex items-center gap-1.5`}>
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
      </div>

      {/* 4. iOS iMessage Bottom Bar */}
      <footer className="px-3 flex flex-col gap-2 flex-shrink-0 z-20 pb-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Plus App Drawer Button */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg cursor-pointer flex-shrink-0 ${isDark ? "bg-zinc-800 text-zinc-300" : "bg-zinc-200 text-zinc-600"}`}>
            +
          </div>

          {/* Text Field */}
          <div className={`flex-1 h-9 px-3 rounded-full border flex items-center justify-between text-xs ${inputBg}`}>
            <span className="opacity-60">iMessage</span>
            <span className="opacity-50">🎙️</span>
          </div>
        </div>

        {/* iOS Home Indicator Pill */}
        <div className={`w-28 h-1 ${isDark ? "bg-white/30" : "bg-black/25"} rounded-full mx-auto`} />
      </footer>
    </div>
  );
};
