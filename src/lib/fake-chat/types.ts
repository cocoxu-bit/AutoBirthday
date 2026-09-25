export type PlatformType = "instagram" | "whatsapp" | "imessage";

export type ThemeMode = "dark" | "light";

export type AspectRatio = "4:5" | "9:16";

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
  isMe: boolean;
  reaction?: string;
  status?: "sent" | "delivered" | "read";
}

export interface ChatSettings {
  contactName: string;
  contactHandle: string;
  contactAvatar: string;
  isVerified: boolean;
  statusText: string;
  currentTime: string;
  batteryLevel: number;
  wifi: boolean;
  platform: PlatformType;
  theme: ThemeMode;
  aspectRatio: AspectRatio;
}

export interface CarouselSlide {
  slideIndex: number;
  visibleMessagesCount: number;
  messages: ChatMessage[];
  subtitle?: string;
}

export interface ScriptPreset {
  id: string;
  title: string;
  description: string;
  platform: PlatformType;
  theme: ThemeMode;
  contactName: string;
  contactHandle: string;
  contactAvatar: string;
  isVerified: boolean;
  script: string;
}
