"use client";

import React, { forwardRef } from "react";
import { ChatMessage, ChatSettings } from "@/lib/fake-chat/types";
import { InstagramChatView } from "./platforms/InstagramChatView";
import { WhatsAppChatView } from "./platforms/WhatsAppChatView";
import { IMessageChatView } from "./platforms/IMessageChatView";

interface ChatCanvasProps {
  settings: ChatSettings;
  messages: ChatMessage[];
  isTyping?: boolean;
  typingSender?: string;
  canvasId?: string;
}

export const ChatCanvas = forwardRef<HTMLDivElement, ChatCanvasProps>(
  ({ settings, messages, isTyping = false, typingSender, canvasId = "active-chat-canvas" }, ref) => {
    return (
      <div
        ref={ref}
        id={canvasId}
        className="w-full h-full relative overflow-hidden rounded-[36px] shadow-2xl border border-zinc-200 dark:border-zinc-800 transition-all duration-300"
      >
        {settings.platform === "instagram" && (
          <InstagramChatView
            settings={settings}
            messages={messages}
            isTyping={isTyping}
            typingSender={typingSender}
          />
        )}

        {settings.platform === "whatsapp" && (
          <WhatsAppChatView
            settings={settings}
            messages={messages}
            isTyping={isTyping}
            typingSender={typingSender}
          />
        )}

        {settings.platform === "imessage" && (
          <IMessageChatView
            settings={settings}
            messages={messages}
            isTyping={isTyping}
            typingSender={typingSender}
          />
        )}
      </div>
    );
  }
);

ChatCanvas.displayName = "ChatCanvas";
