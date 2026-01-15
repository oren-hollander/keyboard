export type Language = 'hebrew' | 'english';

export const config = {
  language: 'hebrew' as Language,
  maxVisibleLines: 6,
  storageBufferSize: 20, // Keep more messages in storage than displayed to detect write conflicts
};
