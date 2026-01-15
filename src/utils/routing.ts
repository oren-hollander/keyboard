import type { RouteInfo } from '../types/chat';

export function parseRoute(): RouteInfo {
  // Check if we were redirected from 404.html
  const redirectPath = sessionStorage.getItem('redirect-path');
  if (redirectPath) {
    sessionStorage.removeItem('redirect-path');
  }

  const pathname = redirectPath || window.location.pathname;
  const basePath = '/keyboard/';

  const relativePath = pathname.startsWith(basePath)
    ? pathname.slice(basePath.length)
    : pathname.slice(1);

  const segments = relativePath.split('/').filter(Boolean);

  // Only need conversation token now (username comes from localStorage)
  if (segments.length >= 1) {
    return {
      conversationToken: decodeURIComponent(segments[0]),
      username: null,
      isValid: true,
    };
  }

  return {
    conversationToken: null,
    username: null,
    isValid: false,
  };
}
