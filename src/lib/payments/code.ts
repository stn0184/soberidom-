// Код покупки: 'SD-' + 6 символов A-Z0-9 без похожих O,0,I,1 (SPEC 3.6).
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePurchaseCode(): string {
  let suffix = '';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  for (const byte of bytes) {
    suffix += ALPHABET[byte % ALPHABET.length];
  }
  return `SD-${suffix}`;
}
