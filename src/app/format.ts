export function groupDigits(value: number): string {
  return Math.round(value).toLocaleString('en-US').replaceAll(',', '\u00a0');
}
