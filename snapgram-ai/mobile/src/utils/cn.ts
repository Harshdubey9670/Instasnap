// React Native equivalent of the web `cn` utility.
// In React Native, styles are JS objects — not class strings —
// so this is a no-op identity helper that passes through non-falsy values.
// Kept for API compatibility with migrated code.
export function cn(...inputs: (string | undefined | null | false)[]): string {
  return inputs.filter(Boolean).join(' ');
}
