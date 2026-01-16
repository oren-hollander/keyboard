export type Language = 'hebrew' | 'english';

export const config = {
  language: 'hebrew' as Language,
  maxVisibleLines: 6,
  storageBufferSize: 20, // Keep more messages in storage than displayed to detect write conflicts
  pantry: {
    id: '5333342e-35ae-4f62-a399-3717dadb8a56',
    basketName: 'messages',
    rateLimit: 2,
  },
  polling: {
    interval: 4000,      // Poll every 4 seconds
    cleanupInterval: 20000, // Cleanup every 20 seconds
  },
};
