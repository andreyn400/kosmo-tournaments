export const SHORT_CODE_LEN = 6;

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateShortCode(): string {
  const bytes = new Uint8Array(SHORT_CODE_LEN);
  crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < SHORT_CODE_LEN; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}
