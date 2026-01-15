import type { RouteInfo } from '../types/chat';

export function parseRoute(): RouteInfo {
  // Use hash-based routing: /keyboard/#test123
  const hash = window.location.hash.slice(1); // Remove the #

  if (hash) {
    return {
      conversationToken: decodeURIComponent(hash),
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
