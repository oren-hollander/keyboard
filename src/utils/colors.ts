export const COLOR_PALETTE = [
  '#E57373', // Red
  '#81C784', // Green
  '#64B5F6', // Blue
  '#FFB74D', // Orange
  '#BA68C8', // Purple
  '#4DB6AC', // Teal
  '#F06292', // Pink
  '#AED581', // Light Green
  '#7986CB', // Indigo
  '#FFD54F', // Amber
  '#4DD0E1', // Cyan
  '#A1887F', // Brown
];

export function getColorForUsername(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = ((hash << 5) - hash) + username.charCodeAt(i);
    hash = hash & hash;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}
