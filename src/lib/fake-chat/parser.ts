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
 * Generates just enough slides to tell the story without overwhelming the carousel.
 * - 1 to 3 messages: 1 slide (all messages)
 * - 4 to 6 messages: 2 slides (Hook -> Full punchline)
 * - 7 to 10 messages: 3 slides (Hook -> Development -> Climax)
 * - > 10 messages: 4 slides max
 * Or explicit slideCount if requested.
 */
export function generateCarouselSlides(
  messages: ChatMessage[],
  targetSlides?: number | "auto"
): CarouselSlide[] {
  if (messages.length === 0) return [];

  const total = messages.length;

  // Single slide requested or very short conversation
  if (targetSlides === 1 || total <= 2) {
    return [
      {
        slideIndex: 1,
        visibleMessagesCount: total,
        messages: [...messages],
        subtitle: "Conversación completa",
      },
    ];
  }

  // Determine ideal number of slides:
  let countOfSlides: number;
  if (typeof targetSlides === "number" && targetSlides > 1) {
    countOfSlides = Math.min(targetSlides, total);
  } else {
    // Smart auto:
    if (total <= 3) countOfSlides = 1;
    else if (total <= 6) countOfSlides = 2; // e.g. 4-6 messages -> exactly 2 slides!
    else if (total <= 10) countOfSlides = 3; // e.g. 7-10 messages -> 3 slides
    else countOfSlides = 4; // max 4 slides for long chats
  }

  if (countOfSlides <= 1) {
    return [
      {
        slideIndex: 1,
        visibleMessagesCount: total,
        messages: [...messages],
        subtitle: "Conversación completa",
      },
    ];
  }

  const slides: CarouselSlide[] = [];

  // Calculate message cutoffs for each slide
  for (let i = 1; i <= countOfSlides; i++) {
    let msgCount: number;
    if (i === 1) {
      // First slide: hook (typically 2 or 3 messages)
      msgCount = Math.max(2, Math.floor(total / countOfSlides));
    } else if (i === countOfSlides) {
      // Final slide: all messages
      msgCount = total;
    } else {
      // Intermediate slides: evenly spaced
      msgCount = Math.min(total - 1, Math.round((total * i) / countOfSlides));
    }

    // Ensure strictly increasing
    const prevCount = slides.length > 0 ? slides[slides.length - 1].visibleMessagesCount : 0;
    msgCount = Math.max(prevCount + 1, Math.min(total, msgCount));

    let subtitle = `Parte ${i} de ${countOfSlides} 👉`;
    if (i === 1) subtitle = "1/ El gancho inicial 👀";
    if (i === countOfSlides) subtitle = "Desenlace de la conversación ✨";

    slides.push({
      slideIndex: i,
      visibleMessagesCount: msgCount,
      messages: messages.slice(0, msgCount),
      subtitle,
    });
  }

  return slides;
}
