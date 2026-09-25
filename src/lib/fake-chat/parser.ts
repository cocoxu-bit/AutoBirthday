import { ChatMessage, CarouselSlide } from "./types";

/**
 * Intelligent Script Parser
 * Parses natural dialogue scripts like:
 *   Lucas: Hola Laura! Qué tal todo?
 *   Laura: Hola Lucas!! Muy bien, preparando mi cumple jaja [❤️]
 *   Lucas: Justo por eso te escribía! Felices 28!! 🎉
 */
export function parseChatScript(
  rawText: string,
  primarySpeakerName?: string,
  baseTime: string = "14:02"
): { messages: ChatMessage[]; speakers: string[] } {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return { messages: [], speakers: [] };
  }

  const detectedSpeakers = new Set<string>();
  const rawItems: { speaker: string; text: string; reaction?: string }[] = [];

  // Parse each line
  lines.forEach((line) => {
    // Check for reaction tags like [❤️] or [reaccion: 😂] or (❤️)
    let reaction: string | undefined;
    let cleanLine = line;

    const reactionMatch = cleanLine.match(/\[(?:reacci[oó]n:?\s*)?([\p{Emoji}\u200d\uFE0F]+)\]/u);
    if (reactionMatch) {
      reaction = reactionMatch[1];
      cleanLine = cleanLine.replace(reactionMatch[0], "").trim();
    }

    // Match Speaker: Message or [14:02] Speaker: Message
    const speakerMatch = cleanLine.match(/^(?:\[?\d{1,2}:\d{2}\]?\s*)?([A-Za-zÁÉÍÓÚáéíóúÑñ0-9_\s]+?):\s*(.+)$/);

    if (speakerMatch) {
      const speaker = speakerMatch[1].trim();
      const text = speakerMatch[2].trim();
      detectedSpeakers.add(speaker);
      rawItems.push({ speaker, text, reaction });
    } else {
      // Line without speaker prefix (fallback)
      rawItems.push({
        speaker: detectedSpeakers.size > 0 ? Array.from(detectedSpeakers)[0] : "Yo",
        text: cleanLine,
        reaction,
      });
    }
  });

  const speakerList = Array.from(detectedSpeakers);
  const meSpeaker = primarySpeakerName || (speakerList.length > 0 ? speakerList[0] : "Yo");

  // Parse base time into hours & minutes
  let [baseH, baseM] = [14, 2];
  if (baseTime && baseTime.includes(":")) {
    const parts = baseTime.split(":").map((p) => parseInt(p, 10));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      baseH = parts[0];
      baseM = parts[1];
    }
  }

  // Construct structured messages with realistic incremental timestamps
  const messages: ChatMessage[] = rawItems.map((item, index) => {
    // Add 1 minute every 2 messages
    const currentTotalMin = baseH * 60 + baseM + Math.floor(index / 2);
    const h = Math.floor(currentTotalMin / 60) % 24;
    const m = currentTotalMin % 60;
    const timeFormatted = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const isMe = item.speaker.toLowerCase() === meSpeaker.toLowerCase();

    return {
      id: `msg-${index + 1}-${Date.now().toString(36)}`,
      sender: item.speaker,
      text: item.text,
      timestamp: timeFormatted,
      isMe,
      reaction: item.reaction,
      status: isMe ? "read" : undefined,
    };
  });

  return {
    messages,
    speakers: speakerList,
  };
}

/**
 * Generate Progressive Carousel Slides for Instagram / TikTok
 * Each slide reveals a progressive part of the conversation (Hook -> Curiosity -> Climax).
 */
export function generateCarouselSlides(
  messages: ChatMessage[],
  minStep: number = 2
): CarouselSlide[] {
  if (messages.length === 0) return [];

  const slides: CarouselSlide[] = [];
  const total = messages.length;

  if (total <= 3) {
    // For very short conversations, just 1 or 2 slides
    return [
      {
        slideIndex: 1,
        visibleMessagesCount: total,
        messages: [...messages],
        subtitle: "Conversación completa",
      },
    ];
  }

  // Determine reveal steps: e.g. for 6 messages:
  // Slide 1: 2 messages (El gancho / Hook)
  // Slide 2: 4 messages (El conflicto / Desarrollo)
  // Slide 3: 6 messages (El desenlace / Clímax)
  const stepSize = Math.max(1, Math.min(minStep, Math.ceil(total / 4)));
  let currentCount = Math.min(2, total);

  let slideIndex = 1;
  while (currentCount <= total) {
    let subtitle = "Desliza para continuar 👉";
    if (slideIndex === 1) subtitle = "1/ El comienzo...";
    if (currentCount >= total) subtitle = "Final de la conversación ✨";

    slides.push({
      slideIndex,
      visibleMessagesCount: currentCount,
      messages: messages.slice(0, currentCount),
      subtitle,
    });

    if (currentCount === total) break;
    currentCount = Math.min(total, currentCount + stepSize);
    slideIndex++;
  }

  return slides;
}
