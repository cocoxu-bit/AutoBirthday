/**
 * High-Performance Hardware-Accelerated Canvas 2D Chat Animation & Video Engine
 * Renders WhatsApp, Instagram, and iMessage conversations with continuous 60fps/30fps mathematical fluidity.
 * Eliminates static frame freezing, frame skips, and sudden scroll snaps.
 */

import { ChatMessage, ChatSettings, PlatformType } from "./types";
import { Muxer, ArrayBufferTarget } from "mp4-muxer";

// --- Mathematical Easings & Helpers ---
export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// --- Text Word-Wrapping in Canvas 2D ---
export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const lines: string[] = [];
  const paragraphs = text.split("\n");

  for (const para of paragraphs) {
    if (!para) {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

// --- Cross-Browser Rounded Rectangle ---
export function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number | { tl: number; tr: number; br: number; bl: number }
) {
  let tl = 0;
  let tr = 0;
  let br = 0;
  let bl = 0;

  if (typeof r === "number") {
    tl = tr = br = bl = r;
  } else {
    tl = r.tl;
    tr = r.tr;
    br = r.br;
    bl = r.bl;
  }

  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

// --- Canvas Vector Glyph Helpers for Pixel-Perfect Native Rendering ---

export function drawAndroidArrow(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 3.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x - 4, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 6, y - 10);
  ctx.lineTo(x - 4, y);
  ctx.lineTo(x + 6, y + 10);
  ctx.stroke();
  ctx.restore();
}

export function drawAndroidNavBar(ctx: CanvasRenderingContext2D, width: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Back triangle (◁)
  const backX = width * 0.24;
  ctx.beginPath();
  ctx.moveTo(backX + 7, y - 8);
  ctx.lineTo(backX - 5, y);
  ctx.lineTo(backX + 7, y + 8);
  ctx.closePath();
  ctx.stroke();

  // Home circle / ring (○)
  const homeX = width * 0.5;
  ctx.beginPath();
  ctx.arc(homeX, y, 7.5, 0, Math.PI * 2);
  ctx.stroke();

  // Recents rounded square (≡ / ▢)
  const recX = width * 0.76;
  drawRoundRect(ctx, recX - 7, y - 7, 14, 14, 3);
  ctx.stroke();

  ctx.restore();
}

export function drawVideoIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawRoundRect(ctx, x - 13, y - 10, 20, 20, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + 7, y - 5);
  ctx.lineTo(x + 16, y - 10);
  ctx.lineTo(x + 16, y + 10);
  ctx.lineTo(x + 7, y + 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

export function drawPhoneIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.arc(x, y + 3, 10, -Math.PI * 0.8, -Math.PI * 0.2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 4);
  ctx.lineTo(x - 6, y - 7);
  ctx.moveTo(x + 9, y - 4);
  ctx.lineTo(x + 6, y - 7);
  ctx.stroke();
  ctx.restore();
}

export function drawThreeDots(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  for (const offset of [-9, 0, 9]) {
    ctx.beginPath();
    ctx.arc(x, y + offset, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

export function drawSmileyOutline(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - r * 0.35, y - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, y - r * 0.2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y + r * 0.1, r * 0.5, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.restore();
}

export function drawPaperclipIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 5);
  ctx.lineTo(x + 4, y - 4);
  ctx.arc(x + 6, y - 6, 3, Math.PI * 0.25, -Math.PI * 0.75, true);
  ctx.lineTo(x - 3, y + 3);
  ctx.stroke();
  ctx.restore();
}

export function drawCameraGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawRoundRect(ctx, x - 11, y - 8, 22, 16, 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, 4.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + 6, y - 4, 1.2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

export function drawMicrophoneGlyph(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  drawRoundRect(ctx, x - 4.5, y - 9, 9, 14, 4.5);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x, y - 1, 8.5, 0, Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y + 7.5);
  ctx.lineTo(x, y + 13);
  ctx.stroke();
  ctx.restore();
}

export function drawGalleryIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawRoundRect(ctx, x - 10, y - 9, 20, 18, 3.5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x - 4, y - 3, 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 8, y + 6);
  ctx.lineTo(x - 2, y);
  ctx.lineTo(x + 3, y + 4);
  ctx.lineTo(x + 7, y + 1);
  ctx.lineTo(x + 8, y + 6);
  ctx.stroke();
  ctx.restore();
}

export function drawPlusIcon(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x, y + 5);
  ctx.moveTo(x - 5, y);
  ctx.lineTo(x + 5, y);
  ctx.stroke();
  ctx.restore();
}

// --- Image Cache for Avatars ---
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  const existing = imageCache.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) {
    return existing;
  }

  if (!existing && typeof window !== "undefined") {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    imageCache.set(url, img);
  }
  return null;
}

export async function preloadImage(url: string): Promise<HTMLImageElement | null> {
  if (!url || typeof window === "undefined") return null;
  const existing = imageCache.get(url);
  if (existing && existing.complete && existing.naturalWidth > 0) return existing;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => {
      resolve(null);
    };
    img.src = url;
  });
}

// --- Timeline Calculation ---
export interface MessageTimelineEvent {
  message: ChatMessage;
  index: number;
  isIncoming: boolean;
  isFirstOfGroup: boolean;
  typingStart: number;
  typingDuration: number;
  appearTime: number;
  readDuration: number;
  bubbleWidth: number;
  bubbleHeight: number;
  lines: string[];
}

export interface ChatTimeline {
  events: MessageTimelineEvent[];
  totalDuration: number;
  speedMultiplier: number;
}

// --- Font Sizing & Typography for Mobile Feeds (Reels / TikTok / Stories) ---
export function getFontMetrics(fontSize: "normal" | "large" | "xlarge" = "large") {
  switch (fontSize) {
    case "normal":
      return {
        fontSize: 32,
        lineHeight: 42,
        paddingX: 28,
        paddingY: 20,
        minWidth: 190,
        minHeight: 88,
        basePadBottom: 54,
        timeSize: 18,
        timePadY: 22,
        headerNameSize: 32,
        headerStatusSize: 21,
      };
    case "xlarge":
      return {
        fontSize: 42,
        lineHeight: 56,
        paddingX: 34,
        paddingY: 26,
        minWidth: 230,
        minHeight: 110,
        basePadBottom: 64,
        timeSize: 21,
        timePadY: 28,
        headerNameSize: 36,
        headerStatusSize: 24,
      };
    case "large":
    default:
      // Optimized specifically for TikTok / Reels 9:16 mobile feeds!
      return {
        fontSize: 37,
        lineHeight: 48,
        paddingX: 30,
        paddingY: 22,
        minWidth: 210,
        minHeight: 98,
        basePadBottom: 58,
        timeSize: 19,
        timePadY: 24,
        headerNameSize: 34,
        headerStatusSize: 22,
      };
  }
}

export function computeChatTimeline(
  messages: ChatMessage[],
  settings: ChatSettings,
  canvasWidth: number,
  speedMultiplier = 1
): ChatTimeline {
  const tempCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  const ctx = tempCanvas ? tempCanvas.getContext("2d") : null;
  const isInstagram = settings.platform === "instagram";
  const events: MessageTimelineEvent[] = [];
  const metrics = getFontMetrics(settings.fontSize || "large");

  let currentTime = 0.4 / speedMultiplier; // Small clean lead-in

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const isIncoming = !msg.isMe;
    const isFirstOfGroup = i === 0 || messages[i - 1].isMe !== msg.isMe;
    const words = Math.max(2, msg.text.trim().split(/\s+/).length);

    // Max bubble width (incoming Instagram leaves room for avatar)
    const maxBubbleWidth = isInstagram && isIncoming ? canvasWidth * 0.71 : canvasWidth * 0.76;
    // Instagram does not have inside timestamps, so bottom padding is tighter
    const basePadBottom = isInstagram ? metrics.paddingY * 2 : metrics.basePadBottom;

    // Measure bubble size
    let lines: string[] = [msg.text];
    let bubbleWidth = 240;
    let bubbleHeight = 110;

    if (ctx) {
      ctx.font = `normal ${metrics.fontSize}px system-ui, -apple-system, sans-serif`;
      lines = wrapText(ctx, msg.text, maxBubbleWidth - metrics.paddingX * 2);
      let maxLineWidth = 0;
      for (const line of lines) {
        const w = ctx.measureText(line).width;
        if (w > maxLineWidth) maxLineWidth = w;
      }
      bubbleWidth = Math.max(metrics.minWidth, Math.min(maxBubbleWidth, maxLineWidth + metrics.paddingX * 2));
      bubbleHeight = Math.max(metrics.minHeight, lines.length * metrics.lineHeight + basePadBottom);
      if (msg.reaction) bubbleHeight += 18;
    } else {
      // Fallback text estimation for non-DOM/SSR environments (~18px per char)
      const approxCharsPerLine = Math.floor((maxBubbleWidth - metrics.paddingX * 2) / (metrics.fontSize * 0.55));
      lines = [];
      const wordsArr = msg.text.split(" ");
      let curr = "";
      for (const w of wordsArr) {
        if ((curr + " " + w).length > approxCharsPerLine) {
          lines.push(curr);
          curr = w;
        } else {
          curr = curr ? curr + " " + w : w;
        }
      }
      if (curr) lines.push(curr);
      bubbleWidth = Math.min(maxBubbleWidth, Math.max(metrics.minWidth, msg.text.length * (metrics.fontSize * 0.5) + metrics.paddingX * 2));
      bubbleHeight = Math.max(metrics.minHeight, lines.length * metrics.lineHeight + basePadBottom);
      if (msg.reaction) bubbleHeight += 18;
    }

    // Dynamic typing delay before incoming messages
    let typingDuration = 0;
    let typingStart = currentTime;

    if (isIncoming && i > 0) {
      typingDuration = Math.max(0.85, Math.min(1.6, words * 0.08 + 0.6)) / speedMultiplier;
      currentTime += typingDuration;
    } else if (i > 0) {
      // Short breath before outgoing
      const breath = 0.25 / speedMultiplier;
      currentTime += breath;
    }

    const appearTime = currentTime;
    const isLast = i === messages.length - 1;
    // Comfortable reading time (last message held for 4.2s)
    const readDuration = (isLast ? 4.2 : Math.max(2.0, Math.min(3.6, words * 0.22 + 1.1))) / speedMultiplier;
    currentTime += readDuration;

    events.push({
      message: msg,
      index: i,
      isIncoming,
      isFirstOfGroup,
      typingStart,
      typingDuration,
      appearTime,
      readDuration,
      bubbleWidth,
      bubbleHeight,
      lines,
    });
  }

  return {
    events,
    totalDuration: currentTime,
    speedMultiplier,
  };
}

// --- Smooth Viewport & Scroll Calculation ---
export function calculateSmoothScroll(
  time: number,
  timeline: ChatTimeline,
  viewportHeight: number
): number {
  let targetScroll = 0;
  const GAP = 18;
  const TYPING_BUBBLE_HEIGHT = 80;

  // Find currently active state
  let cumulativeHeight = 60; // top padding

  for (const ev of timeline.events) {
    // Check if typing for this event is active
    if (ev.isIncoming && ev.typingDuration > 0 && time >= ev.typingStart && time < ev.appearTime) {
      const typingHeight = cumulativeHeight + TYPING_BUBBLE_HEIGHT + GAP;
      if (typingHeight > viewportHeight) {
        targetScroll = typingHeight - viewportHeight;
      }
      break;
    }

    if (time >= ev.appearTime) {
      cumulativeHeight += ev.bubbleHeight + GAP;
      if (cumulativeHeight > viewportHeight) {
        targetScroll = cumulativeHeight - viewportHeight;
      }
    } else {
      break;
    }
  }

  return targetScroll;
}

// --- Master Frame Drawing Engine ---
export function drawChatFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  time: number,
  messages: ChatMessage[],
  settings: ChatSettings,
  timeline: ChatTimeline
) {
  const isDark = settings.theme === "dark";
  const platform = settings.platform;

  // 1. Clear background
  ctx.save();
  let bgColor = "#FFFFFF";
  if (platform === "whatsapp") {
    bgColor = isDark ? "#0B141A" : "#EFEAE2";
  } else if (platform === "instagram") {
    bgColor = isDark ? "#000000" : "#FFFFFF";
  } else {
    bgColor = isDark ? "#000000" : "#FFFFFF";
  }
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // 2. Status Bar (Y: 0 -> 64px)
  drawStatusBar(ctx, width, settings, isDark);

  // 3. Top Header (Y: 64 -> 190px)
  const headerHeight = 126;
  const headerBottomY = 64 + headerHeight;

  // Check if someone is actively typing at this exact time `time`
  let isSomeoneTyping = false;
  let activeTypingEvent: MessageTimelineEvent | null = null;
  for (const ev of timeline.events) {
    if (ev.isIncoming && ev.typingDuration > 0 && time >= ev.typingStart && time < ev.appearTime) {
      isSomeoneTyping = true;
      activeTypingEvent = ev;
      break;
    }
  }

  drawHeader(ctx, width, settings, isDark, isSomeoneTyping);

  // 4. Messages Viewport (Between Header and Bottom Bar)
  const bottomBarHeight = 150;
  const viewportTopY = headerBottomY;
  const viewportBottomY = height - bottomBarHeight;
  const viewportHeight = viewportBottomY - viewportTopY;

  // Calculate smooth scroll offset
  const targetScroll = calculateSmoothScroll(time, timeline, viewportHeight);

  // Clip to viewport so bubbles don't overlap header or bottom bar
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, viewportTopY, width, viewportHeight);
  ctx.clip();

  // Translate by scroll offset
  ctx.translate(0, viewportTopY - targetScroll);

  // Render Platform-Specific Date Header
  ctx.save();
  if (platform === "whatsapp") {
    ctx.font = "600 20px system-ui, -apple-system, sans-serif";
    const dateText = "Hoy";
    const dateMetrics = ctx.measureText(dateText);
    const pillW = dateMetrics.width + 36;
    const pillH = 38;
    const pillX = (width - pillW) / 2;
    const pillY = 16;
    ctx.fillStyle = isDark ? "#182229" : "#FFFFFF";
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, pillX, pillY, pillW, pillH, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isDark ? "#8696A0" : "#54656F";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dateText, width / 2, pillY + pillH / 2);
  } else if (platform === "instagram") {
    ctx.font = "500 22px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#8E8E8E" : "#737373";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`DOM, ${settings.currentTime || "12:00"}`, width / 2, 34);
  } else {
    ctx.font = "600 21px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#8E8E93" : "#8E8E93";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`Hoy ${settings.currentTime || "12:00"}`, width / 2, 34);
  }
  ctx.restore();

  // Render Messages
  let currentY = 74; // starts below date pill
  const GAP = 18;

  for (const ev of timeline.events) {
    if (time < ev.appearTime) {
      // If typing indicator is active right now for this incoming event, render bouncing typing bubble
      if (ev === activeTypingEvent) {
        drawTypingBubble(ctx, currentY, time, platform, isDark, settings);
      }
      break;
    }

    // Message is visible! Calculate entrance animation (0 to 0.28s)
    const timeSinceAppear = time - ev.appearTime;
    let animProgress = 1;
    if (timeSinceAppear < 0.28) {
      animProgress = easeOutCubic(timeSinceAppear / 0.28);
    }

    const scale = 0.88 + 0.12 * animProgress;
    const alpha = animProgress;
    const translateY = (1 - animProgress) * 20;

    // Draw message bubble
    drawMessageBubble(
      ctx,
      width,
      currentY + translateY,
      ev,
      platform,
      isDark,
      scale,
      alpha,
      settings.fontSize || "large",
      settings
    );

    currentY += ev.bubbleHeight + GAP;
  }

  // Restore clipping and translation
  ctx.restore();

  // 5. Bottom Input Bar (Fixed at bottom)
  drawBottomBar(ctx, width, height, bottomBarHeight, platform, isDark);

  ctx.restore();
}

// --- Sub-renderers: Status Bar, Header, Bubbles, Bottom Bar ---

function drawStatusBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  settings: ChatSettings,
  isDark: boolean
) {
  ctx.save();
  const textColor = isDark ? "#FFFFFF" : "#111B21";
  ctx.fillStyle = textColor;
  ctx.font = "600 24px system-ui, -apple-system, sans-serif";
  ctx.textBaseline = "middle";

  // Time on left (e.g. 9:41)
  ctx.textAlign = "left";
  ctx.fillText(settings.currentTime || "9:41", 54, 34);

  // Status icons on right: 5G, Wifi, Battery % and capsule
  const rightX = width - 54;

  // Battery capsule
  const batW = 42;
  const batH = 22;
  const batX = rightX - batW;
  const batY = 23;
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 2.5;
  drawRoundRect(ctx, batX, batY, batW, batH, 6);
  ctx.stroke();

  // Battery terminal bump
  ctx.fillStyle = textColor;
  drawRoundRect(ctx, rightX + 2, batY + 6, 3, 10, 2);
  ctx.fill();

  // Battery fill
  const fillPct = clamp(settings.batteryLevel / 100, 0.1, 1.0);
  const fillW = (batW - 8) * fillPct;
  drawRoundRect(ctx, batX + 4, batY + 4, fillW, batH - 8, 3);
  ctx.fill();

  // Battery percentage text
  ctx.font = "500 20px monospace, system-ui";
  ctx.textAlign = "right";
  ctx.fillText(`${settings.batteryLevel}%`, batX - 10, 34);

  // Wifi icon
  let nextX = batX - 70;
  if (settings.wifi) {
    const wifiX = nextX;
    const wifiY = 34;
    ctx.beginPath();
    ctx.arc(wifiX, wifiY, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(wifiX, wifiY + 2, 10, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(wifiX, wifiY + 2, 16, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    nextX -= 34;
  }

  // 5G Network text
  ctx.font = "bold 18px system-ui";
  ctx.textAlign = "right";
  ctx.fillText("5G", nextX, 34);

  ctx.restore();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  width: number,
  settings: ChatSettings,
  isDark: boolean,
  isTyping: boolean
) {
  ctx.save();
  const platform = settings.platform;
  const headerHeight = 126;
  const headerY = 64;
  const centerY = headerY + headerHeight / 2;

  // Header background
  let headerBg = "#FFFFFF";
  let textColor = "#000000";
  let subtitleColor = "#8696A0";

  if (platform === "whatsapp") {
    // Modern WhatsApp: clean white in light mode, #1F2C34 in dark mode
    headerBg = isDark ? "#1F2C34" : "#FFFFFF";
    textColor = isDark ? "#FFFFFF" : "#111B21";
    subtitleColor = isTyping
      ? "#00A884"
      : isDark ? "#8696A0" : "#667781";
  } else if (platform === "instagram") {
    headerBg = isDark ? "#000000" : "#FFFFFF";
    textColor = isDark ? "#FFFFFF" : "#000000";
    subtitleColor = isDark ? "#8E8E8E" : "#737373";
  } else {
    // iMessage
    headerBg = isDark ? "#1C1C1E" : "#F6F6F6";
    textColor = isDark ? "#FFFFFF" : "#000000";
    subtitleColor = isDark ? "#8E8E93" : "#8E8E93";
  }

  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, width, headerY + headerHeight);

  // Subtle separator border
  ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerY + headerHeight);
  ctx.lineTo(width, headerY + headerHeight);
  ctx.stroke();

  // Back Button / Arrow
  const arrowColor = platform === "imessage" ? "#007AFF" : textColor;
  if (platform === "imessage") {
    ctx.strokeStyle = arrowColor;
    ctx.lineWidth = 3.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const chevronX = 48;
    ctx.beginPath();
    ctx.moveTo(chevronX + 10, centerY - 14);
    ctx.lineTo(chevronX, centerY);
    ctx.lineTo(chevronX + 10, centerY + 14);
    ctx.stroke();
  } else {
    // Android arrow (WhatsApp & Instagram)
    drawAndroidArrow(ctx, 46, centerY, arrowColor);
  }

  // Avatar drawing
  const avatarRadius = 38;
  const avatarX = 126;
  const avatarY = centerY;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
  ctx.clip();

  const avatarImg = getCachedImage(settings.contactAvatar);
  if (avatarImg) {
    ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
  } else {
    ctx.fillStyle = platform === "whatsapp" ? "#00A884" : "#262626";
    ctx.fillRect(avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(settings.contactName.slice(0, 2).toUpperCase(), avatarX, avatarY);
  }
  ctx.restore();

  const metrics = getFontMetrics(settings.fontSize || "large");

  // Contact name
  ctx.fillStyle = textColor;
  ctx.font = `bold ${metrics.headerNameSize}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  const textStartX = avatarX + avatarRadius + 22;
  const displayName = platform === "instagram" ? `${settings.contactName} ›` : settings.contactName;
  ctx.fillText(displayName, textStartX, centerY - 4);

  // Blue verification badge
  if (settings.isVerified) {
    const nameWidth = ctx.measureText(displayName).width;
    const badgeX = textStartX + nameWidth + 12;
    const badgeY = centerY - 14;
    ctx.fillStyle = "#0095F6";
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 14px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✓", badgeX, badgeY + 1);
  }

  // Status subtitle
  ctx.font = `500 ${metrics.headerStatusSize}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = subtitleColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  let statusText = "en línea";
  if (isTyping) {
    statusText = "escribiendo...";
  } else if (settings.statusText) {
    statusText = settings.statusText;
  } else if (platform === "instagram") {
    statusText = `@${settings.contactHandle || settings.contactName.toLowerCase().replace(/\s+/g, "_")}`;
  }
  ctx.fillText(statusText, textStartX, centerY + 26);

  // Right action icons
  const iconColor = textColor;

  if (platform === "whatsapp") {
    // Video icon
    drawVideoIcon(ctx, width - 150, centerY, iconColor);
    // Phone icon
    drawPhoneIcon(ctx, width - 96, centerY, iconColor);
    // 3 vertical dots
    drawThreeDots(ctx, width - 44, centerY, iconColor);
  } else if (platform === "instagram") {
    // Phone call icon
    drawPhoneIcon(ctx, width - 100, centerY, iconColor);
    // Video camera icon
    drawVideoIcon(ctx, width - 48, centerY, iconColor);
  }

  ctx.restore();
}

function drawMessageBubble(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  y: number,
  ev: MessageTimelineEvent,
  platform: PlatformType,
  isDark: boolean,
  scale: number,
  alpha: number,
  fontSize: "normal" | "large" | "xlarge" = "large",
  settings: ChatSettings
) {
  const metrics = getFontMetrics(fontSize);
  const isMe = ev.message.isMe;
  const isFirstOfGroup = ev.isFirstOfGroup;
  const bw = ev.bubbleWidth;
  const bh = ev.bubbleHeight;

  // Calculate horizontal bubble position
  let marginX = 40;
  if (platform === "instagram" && !isMe) {
    marginX = 94; // leave space for avatar on left
  }
  const x = isMe ? canvasWidth - 40 - bw : marginX;

  ctx.save();
  ctx.globalAlpha = alpha;

  // Draw avatar next to incoming Instagram bubbles
  if (platform === "instagram" && !isMe) {
    const avatarR = 21;
    const avatarCX = 48;
    const avatarCY = y + bh - avatarR - 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
    ctx.clip();
    const avatarImg = getCachedImage(settings.contactAvatar);
    if (avatarImg) {
      ctx.drawImage(avatarImg, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
    } else {
      ctx.fillStyle = "#262626";
      ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 16px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(settings.contactName.slice(0, 2).toUpperCase(), avatarCX, avatarCY);
    }
    ctx.restore();
  }

  // Apply pop-in scale from bubble corner anchor
  const anchorX = isMe ? x + bw : x;
  const anchorY = y + bh;
  ctx.translate(anchorX, anchorY);
  ctx.scale(scale, scale);
  ctx.translate(-anchorX, -anchorY);

  // Bubble Background Color & Corner Shape
  if (platform === "whatsapp") {
    ctx.fillStyle = isMe
      ? isDark ? "#005C4B" : "#D9FDD3"
      : isDark ? "#202C33" : "#FFFFFF";

    // Speech bubble tail & corner radius
    if (isFirstOfGroup) {
      if (isMe) {
        // Outgoing first: sharp top-right with triangular tail
        drawRoundRect(ctx, x, y, bw, bh, { tl: 18, tr: 4, br: 18, bl: 18 });
        ctx.fill();
        // Tail triangle on top-right
        ctx.beginPath();
        ctx.moveTo(x + bw, y);
        ctx.lineTo(x + bw + 10, y);
        ctx.lineTo(x + bw, y + 14);
        ctx.closePath();
        ctx.fill();
      } else {
        // Incoming first: sharp top-left with triangular tail
        drawRoundRect(ctx, x, y, bw, bh, { tl: 4, tr: 18, br: 18, bl: 18 });
        ctx.fill();
        // Tail triangle on top-left
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 10, y);
        ctx.lineTo(x, y + 14);
        ctx.closePath();
        ctx.fill();
      }
    } else {
      // Consecutive messages: rounded corners
      drawRoundRect(ctx, x, y, bw, bh, 18);
      ctx.fill();
    }
  } else if (platform === "instagram") {
    if (isMe) {
      const grad = ctx.createLinearGradient(x, y, x + bw, y + bh);
      grad.addColorStop(0, "#7000FF");
      grad.addColorStop(0.5, "#A824FF");
      grad.addColorStop(1, "#D80070");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = isDark ? "#262626" : "#EFEFEF";
    }
    drawRoundRect(ctx, x, y, bw, bh, 24);
    ctx.fill();
  } else {
    // iMessage
    ctx.fillStyle = isMe
      ? "#007AFF"
      : isDark ? "#26252A" : "#E9E9EB";
    drawRoundRect(ctx, x, y, bw, bh, 24);
    ctx.fill();
  }

  // Subtle shadow
  ctx.shadowColor = "rgba(0,0,0,0.06)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  // Draw message text
  ctx.font = `normal ${metrics.fontSize}px system-ui, -apple-system, sans-serif`;
  let textColor = "#000000";
  if (platform === "whatsapp") {
    textColor = isDark ? "#E9EDEF" : "#111B21";
  } else if (platform === "instagram") {
    textColor = isMe ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000";
  } else {
    textColor = isMe ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000";
  }

  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  const paddingX = metrics.paddingX;
  const paddingY = metrics.paddingY;
  const lineHeight = metrics.lineHeight;

  for (let l = 0; l < ev.lines.length; l++) {
    ctx.fillText(ev.lines[l], x + paddingX, y + paddingY + l * lineHeight);
  }

  // Draw timestamp & double checkmarks (WhatsApp & iMessage only; Instagram has no inside timestamp!)
  if (platform !== "instagram") {
    const timeY = y + bh - metrics.timePadY;
    ctx.font = `500 ${metrics.timeSize}px system-ui, -apple-system, sans-serif`;
    const timeColor = isMe
      ? platform === "whatsapp" && !isDark ? "#53bdeb" : "rgba(255,255,255,0.7)"
      : isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
    ctx.fillStyle = timeColor;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";

    let timeString = ev.message.timestamp || "12:00";
    if (isMe && platform === "whatsapp") {
      timeString += " ✓✓";
    }
    ctx.fillText(timeString, x + bw - 20, timeY);
  }

  // Reaction badge
  if (ev.message.reaction) {
    const rxW = 46;
    const rxH = 34;
    const rxX = isMe ? x + 16 : x + bw - rxW - 16;
    const rxY = y + bh - 16;

    ctx.fillStyle = isDark ? "#202C33" : "#FFFFFF";
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
    ctx.lineWidth = 1.5;
    drawRoundRect(ctx, rxX, rxY, rxW, rxH, 17);
    ctx.fill();
    ctx.stroke();

    ctx.font = "20px system-ui, Apple Color Emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ev.message.reaction, rxX + rxW / 2, rxY + rxH / 2);
  }

  ctx.restore();
}

function drawTypingBubble(
  ctx: CanvasRenderingContext2D,
  y: number,
  time: number,
  platform: PlatformType,
  isDark: boolean,
  settings?: ChatSettings
) {
  let marginX = 40;
  if (platform === "instagram") {
    marginX = 94; // leave space for avatar
    if (settings) {
      const avatarR = 21;
      const avatarCX = 48;
      const avatarCY = y + 64 - avatarR - 2;
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
      ctx.clip();
      const avatarImg = getCachedImage(settings.contactAvatar);
      if (avatarImg) {
        ctx.drawImage(avatarImg, avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
      } else {
        ctx.fillStyle = "#262626";
        ctx.fillRect(avatarCX - avatarR, avatarCY - avatarR, avatarR * 2, avatarR * 2);
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 16px system-ui";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(settings.contactName.slice(0, 2).toUpperCase(), avatarCX, avatarCY);
      }
      ctx.restore();
    }
  }

  const bw = 120;
  const bh = 64;

  ctx.save();
  // Bubble background
  ctx.fillStyle = platform === "whatsapp"
    ? isDark ? "#202C33" : "#FFFFFF"
    : platform === "instagram"
    ? isDark ? "#262626" : "#EFEFEF"
    : isDark ? "#26252A" : "#E9E9EB";

  drawRoundRect(ctx, marginX, y, bw, bh, 20);
  ctx.fill();

  // 3 Bouncing Dots with continuous smooth sine wave
  const dotColor = platform === "whatsapp"
    ? isDark ? "#00A884" : "#25D366"
    : isDark ? "#8E8E8E" : "#8E8E93";
  ctx.fillStyle = dotColor;

  const dotRadius = 5.5;
  const startDotX = marginX + 34;
  const dotSpacing = 26;
  const centerY = y + bh / 2;

  for (let i = 0; i < 3; i++) {
    const offset = Math.sin(time * 8.5 - i * 0.8) * 6.5;
    ctx.beginPath();
    ctx.arc(startDotX + i * dotSpacing, centerY + offset, dotRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBottomBar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  barHeight: number,
  platform: PlatformType,
  isDark: boolean
) {
  ctx.save();
  const barY = height - barHeight;

  if (platform === "whatsapp") {
    // Seamless chat canvas background underneath
    ctx.fillStyle = isDark ? "#0B141A" : "#EFEAE2";
    ctx.fillRect(0, barY, width, barHeight);

    // Floating white/dark capsule on left
    const capsuleMarginX = 18;
    const capsuleW = width - capsuleMarginX * 2 - 82;
    const capsuleH = 72;
    const capsuleY = barY + 12;

    ctx.fillStyle = isDark ? "#1F2C34" : "#FFFFFF";
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, capsuleMarginX, capsuleY, capsuleW, capsuleH, 36);
    ctx.fill();
    ctx.stroke();

    // Outline smiley icon inside capsule
    const iconColor = isDark ? "#8696A0" : "#667781";
    drawSmileyOutline(ctx, capsuleMarginX + 34, capsuleY + 36, 15, iconColor);

    // Blinking green cursor + Mensaje placeholder
    ctx.fillStyle = "#00A884";
    ctx.fillRect(capsuleMarginX + 68, capsuleY + 22, 2.5, 28);

    ctx.font = "normal 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = iconColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Mensaje", capsuleMarginX + 80, capsuleY + 36);

    // Paperclip & Camera on right inside capsule
    drawPaperclipIcon(ctx, capsuleMarginX + capsuleW - 74, capsuleY + 36, iconColor);
    drawCameraGlyph(ctx, capsuleMarginX + capsuleW - 32, capsuleY + 36, iconColor);

    // Circular green mic button on right
    const micX = width - capsuleMarginX - 36;
    const micY = capsuleY + 36;
    ctx.fillStyle = "#00A884";
    ctx.beginPath();
    ctx.arc(micX, micY, 34, 0, Math.PI * 2);
    ctx.fill();
    drawMicrophoneGlyph(ctx, micX, micY, "#FFFFFF");

    // Android Navigation Bar (◁ ⬡ ≡)
    drawAndroidNavBar(ctx, width, height - 26, isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)");
  } else if (platform === "instagram") {
    ctx.fillStyle = isDark ? "#000000" : "#FFFFFF";
    ctx.fillRect(0, barY, width, barHeight);

    const capsuleMarginX = 18;
    const capsuleW = width - capsuleMarginX * 2;
    const capsuleH = 72;
    const capsuleY = barY + 12;

    ctx.fillStyle = isDark ? "#262626" : "#F2F2F2";
    ctx.strokeStyle = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)";
    ctx.lineWidth = 1;
    drawRoundRect(ctx, capsuleMarginX, capsuleY, capsuleW, capsuleH, 36);
    ctx.fill();
    ctx.stroke();

    // Blue circular camera button on left
    const camX = capsuleMarginX + 36;
    const camY = capsuleY + 36;
    ctx.fillStyle = "#0095F6";
    ctx.beginPath();
    ctx.arc(camX, camY, 24, 0, Math.PI * 2);
    ctx.fill();
    drawCameraGlyph(ctx, camX, camY, "#FFFFFF");

    // Placeholder text
    ctx.font = "normal 25px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "#8E8E8E" : "#737373";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("Envía un mens...", capsuleMarginX + 78, capsuleY + 36);

    // Action icons on right inside capsule: Mic, Gallery, Smiley, Plus
    const iconColor = isDark ? "#CCCCCC" : "#555555";
    drawMicrophoneGlyph(ctx, capsuleMarginX + capsuleW - 146, capsuleY + 36, iconColor);
    drawGalleryIcon(ctx, capsuleMarginX + capsuleW - 108, capsuleY + 36, iconColor);
    drawSmileyOutline(ctx, capsuleMarginX + capsuleW - 70, capsuleY + 36, 12, iconColor);
    drawPlusIcon(ctx, capsuleMarginX + capsuleW - 32, capsuleY + 36, iconColor);

    // Android Navigation Bar (◁ ⬡ ≡)
    drawAndroidNavBar(ctx, width, height - 26, isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)");
  } else {
    // iMessage
    ctx.fillStyle = isDark ? "#1C1C1E" : "#F6F6F6";
    ctx.fillRect(0, barY, width, barHeight);

    const pillMarginX = 36;
    const pillW = width - pillMarginX * 2;
    const pillH = 68;
    const pillY = barY + 16;

    ctx.fillStyle = isDark ? "#2C2C2E" : "#FFFFFF";
    drawRoundRect(ctx, pillMarginX, pillY, pillW, pillH, 34);
    ctx.fill();

    ctx.font = "normal 26px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText("iMessage", pillMarginX + 32, pillY + pillH / 2);

    // iOS Home Indicator Bar
    const homeBarW = 360;
    const homeBarH = 8;
    const homeBarX = (width - homeBarW) / 2;
    const homeBarY = height - 20;
    ctx.fillStyle = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
    drawRoundRect(ctx, homeBarX, homeBarY, homeBarW, homeBarH, 4);
    ctx.fill();
  }

  ctx.restore();
}

// --- High-Speed MP4 Video Exporter ---
export async function exportCanvasVideoMP4(
  messages: ChatMessage[],
  settings: ChatSettings,
  onProgress?: (progressText: string, percent: number) => void
): Promise<Blob> {
  const width = 1080;
  const height = settings.aspectRatio === "4:5" ? 1350 : 1920;
  const fps = 30;

  // Preload avatar
  if (settings.contactAvatar) {
    onProgress?.("Cargando imagen de perfil...", 5);
    await preloadImage(settings.contactAvatar);
  }

  // Precompute exact animation timeline
  onProgress?.("Calculando timeline de conversación...", 10);
  const timeline = computeChatTimeline(messages, settings, width, 1.0);
  const totalFrames = Math.ceil(timeline.totalDuration * fps);

  // Setup offscreen canvas
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not initialize Canvas 2D context");

  // Check if WebCodecs is supported
  const supportsWebCodecs =
    typeof window !== "undefined" &&
    typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder === "function" &&
    typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame === "function";

  if (supportsWebCodecs) {
    // Setup MP4 Muxer + WebCodecs VideoEncoder
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({
      target,
      video: {
        codec: "avc",
        width,
        height,
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
      width,
      height,
      bitrate: 6_000_000,
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

    const frameDurationMicroseconds = Math.round(1_000_000 / fps);
    let currentTimestamp = 0;

    for (let f = 0; f < totalFrames; f++) {
      const time = f / fps;

      // Draw this frame with mathematical continuity
      drawChatFrame(ctx, width, height, time, messages, settings, timeline);

      const videoFrame = new VideoFrame(canvas, {
        timestamp: currentTimestamp,
      });
      videoEncoder.encode(videoFrame, { keyFrame: f % (fps * 2) === 0 });
      videoFrame.close();
      currentTimestamp += frameDurationMicroseconds;

      // Allow event loop to breathe & report progress
      if (f % 15 === 0 || f === totalFrames - 1) {
        const pct = Math.round(10 + (f / totalFrames) * 85);
        onProgress?.(`Generando fotograma ${f + 1} de ${totalFrames} (30 fps)...`, pct);
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress?.("Empaquetando archivo MP4 de alta fidelidad...", 98);
    await videoEncoder.flush();
    muxer.finalize();

    onProgress?.("¡Vídeo completado!", 100);
    return new Blob([target.buffer], { type: "video/mp4" });
  } else {
    // Fallback: Real-time rendering via canvas.captureStream()
    onProgress?.("Grabando secuencia fluida en tiempo real...", 20);
    const stream = canvas.captureStream(fps);
    const mimeType = MediaRecorder.isTypeSupported("video/mp4;codecs=avc1")
      ? "video/mp4;codecs=avc1"
      : MediaRecorder.isTypeSupported("video/mp4")
      ? "video/mp4"
      : "video/webm";

    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 6000000 });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.start();

    const startTime = performance.now();
    await new Promise<void>((resolve) => {
      const renderLoop = () => {
        const elapsedSeconds = (performance.now() - startTime) / 1000;
        drawChatFrame(ctx, width, height, elapsedSeconds, messages, settings, timeline);

        const pct = Math.min(95, Math.round(20 + (elapsedSeconds / timeline.totalDuration) * 75));
        onProgress?.(`Grabando vídeo en tiempo real (${Math.round(elapsedSeconds)}s / ${Math.round(timeline.totalDuration)}s)...`, pct);

        if (elapsedSeconds < timeline.totalDuration) {
          requestAnimationFrame(renderLoop);
        } else {
          recorder.stop();
          resolve();
        }
      };
      requestAnimationFrame(renderLoop);
    });

    return new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        onProgress?.("¡Vídeo completado!", 100);
        resolve(new Blob(chunks, { type: mimeType }));
      };
    });
  }
}

