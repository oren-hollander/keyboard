export type Language = 'hebrew' | 'english';

export const config = {
  language: 'hebrew' as Language,
  maxVisibleLines: 6,
  storageBufferSize: 20,
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
  },
  polling: {
    interval: 4000,
    cleanupInterval: 20000,
  },
};
