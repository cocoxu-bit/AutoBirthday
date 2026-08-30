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
/**
 * Calculates similarity percentage between 0 and 100 with intelligent name heuristics.
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeString(str1);
  const norm2 = normalizeString(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 100;

  const words1 = norm1.split(/\s+/).filter(Boolean);
  const words2 = norm2.split(/\s+/).filter(Boolean);

  // Exact word set match (order might differ, e.g. "Jimenez Lucas" vs "Lucas Jimenez")
  const matchingWords = words1.filter(w => words2.includes(w));
  const totalUniqueWords = new Set([...words1, ...words2]).size;

  if (matchingWords.length > 0) {
    const minWords = Math.min(words1.length, words2.length);
    const maxWords = Math.max(words1.length, words2.length);

    // If all words of the shorter name are present in the longer name (e.g. "Lucas" in "Lucas Jimenez", "Alicia" in "Alicia Martinez")
    if (matchingWords.length === minWords) {
      const coverageRatio = minWords / maxWords;
      return Math.round(75 + coverageRatio * 20); // 85% to 95%
    }

    // Some words match (e.g. "Lucas Gana" vs "Lucas Jimenez")
    const overlapRatio = matchingWords.length / totalUniqueWords;
    return Math.round(50 + overlapRatio * 40); // 60% to 90%
  }

  // Check if the first name (word) has high typo similarity (e.g. "Alejandro" vs "Alejandra")
  if (words1.length > 0 && words2.length > 0) {
    const first1 = words1[0];
    const first2 = words2[0];
    const maxFirstLen = Math.max(first1.length, first2.length);
    const firstDist = levenshteinDistance(first1, first2);
    const firstSim = (maxFirstLen - firstDist) / maxFirstLen;

    if (firstSim >= 0.8 && maxFirstLen >= 4) {
      return Math.round(firstSim * 70); // 56% to 70%
    }
  }

  // Full string Levenshtein similarity fallback
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
 * Single-contact best match fallback (used by vcard and ics parsers)
 */
export function findBestWhatsAppMatch(
  searchName: string,
  whatsappContacts: WhatsAppChatContact[],
  minThreshold = 40
): MatchResult {
  let bestMatch: WhatsAppChatContact | undefined;
  let highestScore = 0;

  for (const contact of whatsappContacts) {
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

export interface BirthdayToMatch {
  id: string;
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  rawSummary?: string;
}

export interface Unique1to1MatchResult<T extends BirthdayToMatch = BirthdayToMatch> {
  birthday: T;
  matchedContact?: WhatsAppChatContact;
  confidence: number;
  isAutoMatched: boolean;
}

/**
 * Strict 1-to-1 unique matcher:
 * Ensures NO single WhatsApp contact is ever assigned to multiple calendar events.
 */
export function matchAllBirthdaysToWhatsApp1to1<T extends BirthdayToMatch>(
  birthdays: T[],
  whatsappContacts: WhatsAppChatContact[],
  minThreshold = 60
): Unique1to1MatchResult<T>[] {
  // 1. Deduplicate identical calendar events (same name & same day/month)
  const uniqueBirthdays: T[] = [];
  const seenEvents = new Set<string>();

  for (const b of birthdays) {
    const key = `${normalizeString(b.name)}_${b.birthDay}_${b.birthMonth}`;
    if (!seenEvents.has(key)) {
      seenEvents.add(key);
      uniqueBirthdays.push(b);
    }
  }

  // 2. Generate all potential candidate pairs with similarity >= minThreshold
  interface CandidatePair {
    birthdayIndex: number;
    contactPhone: string;
    contact: WhatsAppChatContact;
    score: number;
  }

  const candidatePairs: CandidatePair[] = [];

  uniqueBirthdays.forEach((bday, bIndex) => {
    for (const contact of whatsappContacts) {
      const score1 = calculateSimilarity(bday.name, contact.name);
      const score2 = contact.pushName ? calculateSimilarity(bday.name, contact.pushName) : 0;
      const maxScore = Math.max(score1, score2);

      if (maxScore >= minThreshold) {
        const cleanPhone = (contact.phone || contact.jid || '').replace(/\D/g, '');
        candidatePairs.push({
          birthdayIndex: bIndex,
          contactPhone: cleanPhone,
          contact,
          score: maxScore,
        });
      }
    }
  });

  // 3. Sort candidate pairs descending by match score
  candidatePairs.sort((a, b) => b.score - a.score);

  // 4. Greedy 1-to-1 assignment: each WhatsApp contact can only be claimed ONCE
  const matchedBirthdayMap = new Map<number, { contact: WhatsAppChatContact; score: number }>();
  const claimedPhoneNumbers = new Set<string>();

  for (const pair of candidatePairs) {
    if (
      !matchedBirthdayMap.has(pair.birthdayIndex) &&
      !claimedPhoneNumbers.has(pair.contactPhone)
    ) {
      matchedBirthdayMap.set(pair.birthdayIndex, {
        contact: pair.contact,
        score: pair.score,
      });
      claimedPhoneNumbers.add(pair.contactPhone);
    }
  }

  // 5. Build final result array
  return uniqueBirthdays.map((bday, bIndex) => {
    const match = matchedBirthdayMap.get(bIndex);
    if (match) {
      return {
        birthday: bday,
        matchedContact: match.contact,
        confidence: match.score,
        isAutoMatched: match.score >= 70,
      };
    }
    return {
      birthday: bday,
      matchedContact: undefined,
      confidence: 0,
      isAutoMatched: false,
    };
  });
}
