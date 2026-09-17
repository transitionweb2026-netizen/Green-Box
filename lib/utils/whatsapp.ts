/** wa.me needs an international number with no leading 0 -- admin enters
 * the familiar local Egyptian format (e.g. 010...), so a leading 0 is
 * swapped for the 20 country code specifically for this link. */
export function toWhatsAppDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `20${digits.slice(1)}` : digits;
}

export function buildWhatsAppLink(phone: string, message: string): string {
  return `https://wa.me/${toWhatsAppDigits(phone)}?text=${encodeURIComponent(message)}`;
}
