/**
 * Utility functions for formatting and cleaning phone numbers for WhatsApp integration.
 */

/**
 * Cleans a phone number by stripping all non-digit characters (including '+', spaces, dashes, parentheses).
 * If the number is a standard Spanish mobile number without country code (9 digits starting with 6 or 7),
 * prepends the Spanish country code '34'.
 *
 * @param phone Raw phone number string (e.g. "+34 600 12 34 56", "600-123-456", "0034600123456")
 * @returns Clean numeric phone string in [countryCode][number] format (e.g. "34600123456")
 */
export function formatToWhatsappJid(phone: string): string {
  if (!phone) return '';

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If number starts with 00 (international call prefix), replace leading 00
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // If it's a 9-digit Spanish mobile number starting with 6 or 7, prepend 34
  if (digits.length === 9 && (digits.startsWith('6') || digits.startsWith('7'))) {
    digits = `34${digits}`;
  }

  return digits;
}

/**
 * Validates whether a phone number has a plausible length after cleaning.
 */
export function isValidPhoneNumber(phone: string): boolean {
  const clean = formatToWhatsappJid(phone);
  return clean.length >= 8 && clean.length <= 15;
}

/**
 * Formats a clean phone number with a '+' prefix for UI display.
 */
export function formatPhoneDisplay(phone: string): string {
  const clean = formatToWhatsappJid(phone);
  if (!clean) return '';
  return `+${clean}`;
}
