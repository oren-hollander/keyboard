import type { RouteInfo } from '../types/chat';

export function parseRoute(): RouteInfo {
  const pathname = window.location.pathname;
  const basePath = '/keyboard/';

  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname.slice(1);

  const segments = relativePath.split('/').filter(Boolean);

  // Only need conversation token now (username comes from localStorage)
  if (segments.length >= 1) {
    return {
      conversationToken: decodeURIComponent(segments[0]),
      username: null, // No longer in URL
      isValid: true,
    };
  }

  return {
    conversationToken: null,
    username: null,
    isValid: false,
  };
}
