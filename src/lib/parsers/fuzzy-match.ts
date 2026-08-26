import { WhatsAppChatContact } from '@/types';

/**
 * Normalizes text for comparison (removes accents, emojis, punctuation, lowercase).
 */
export function normalizeString(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^\w\s]/gi, '') // remove special chars/emojis
    .trim();
}

/**
 * Calculates Levenshtein Distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  
  const matrix = Array.from({ length: bn + 1 }, () => Array(an + 1).fill(0));
  for (let i = 0; i <= an; ++i) matrix[0][i] = i;
  for (let j = 0; j <= bn; ++j) matrix[j][0] = j;

  for (let j = 1; j <= bn; ++j) {
    for (let i = 1; i <= an; ++i) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

/**
 * Calculates similarity percentage between 0 and 100.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 100;

  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    const minLen = Math.min(norm1.length, norm2.length);
    const maxLen = Math.max(norm1.length, norm2.length);
    return Math.round((minLen / maxLen) * 90);
  }

  // Check word overlap (e.g. "Lucas Gana" vs "Lucas")
  const words1 = norm1.split(/\s+/);
  const words2 = norm2.split(/\s+/);
  const matchingWords = words1.filter(w => words2.includes(w));
  if (matchingWords.length > 0) {
    const score = (matchingWords.length / Math.max(words1.length, words2.length)) * 85;
    return Math.round(score);
  }

  // Levenshtein similarity
  const maxLen = Math.max(norm1.length, norm2.length);
  const dist = levenshteinDistance(norm1, norm2);
  const ratio = (maxLen - dist) / maxLen;
  return Math.max(0, Math.round(ratio * 100));
}

export interface MatchResult {
  matchedContact?: WhatsAppChatContact;
  confidence: number;
  suggestedPhone?: string;
}

/**
 * Finds best matching WhatsApp contact for a given person's name.
 */
export function findBestWhatsAppMatch(
  searchName: string,
  whatsappContacts: WhatsAppChatContact[],
  minThreshold = 40
): MatchResult {
  let bestMatch: WhatsAppChatContact | undefined;
  let highestScore = 0;

  for (const contact of whatsappContacts) {
    // Compare against contact.name and contact.pushName
    const score1 = calculateSimilarity(searchName, contact.name);
    const score2 = contact.pushName ? calculateSimilarity(searchName, contact.pushName) : 0;
    const maxScore = Math.max(score1, score2);

    if (maxScore > highestScore) {
      highestScore = maxScore;
      bestMatch = contact;
    }
  }

  if (highestScore >= minThreshold && bestMatch) {
    return {
      matchedContact: bestMatch,
      confidence: highestScore,
      suggestedPhone: bestMatch.phone,
    };
  }

  return {
    confidence: 0,
  };
}
