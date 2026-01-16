import { pantryRateLimiter } from '../utils/rateLimiter';

const PANTRY_ID = '5333342e-35ae-4f62-a399-3717dadb8a56';
const BASKET_NAME = 'messages';
const BASE_URL = `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}`;
const BASKET_URL = `${BASE_URL}/basket/${BASKET_NAME}`;

interface StoredMessage {
  id: string;
  text: string;
  timestamp: number;
}

export type BasketData = Record<string, StoredMessage[]>;

async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  maxRetries = 5
): Promise<Response | null> {
  let retryDelay = 2000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        console.warn(`Rate limited (429), waiting ${retryDelay}ms before retry ${attempt + 1}/${maxRetries}`);
        await delay(retryDelay);
        retryDelay *= 2;
        continue;
      }

      return response;
    } catch {
      // Network errors often mean 429 with missing CORS headers
      console.warn(`Network error (likely rate limit), waiting ${retryDelay}ms before retry ${attempt + 1}/${maxRetries}`);
      await delay(retryDelay);
      retryDelay *= 2;
    }
  }

  console.error(`Failed after ${maxRetries} retries`);
  return null;
}

export const pantryService = {
  async readBasket(): Promise<BasketData | null> {
    return pantryRateLimiter.schedule(async () => {
      const response = await fetchWithRetry(BASKET_URL);

      if (!response) {
        return null;
      }

      if (response.status === 400) {
        // Basket doesn't exist yet
        return {};
      }

      if (!response.ok) {
        console.error('Pantry read error:', response.status);
        return null;
      }

      const text = await response.text();
      try {
        return JSON.parse(text) as BasketData;
      } catch {
        console.error('Failed to parse Pantry response:', text);
        return null;
      }
    });
  },

  async updateBasket(data: BasketData): Promise<boolean> {
    return pantryRateLimiter.schedule(async () => {
      const response = await fetchWithRetry(BASKET_URL, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response?.ok ?? false;
    });
  },

  async replaceBasket(data: BasketData): Promise<boolean> {
    return pantryRateLimiter.schedule(async () => {
      const response = await fetchWithRetry(BASKET_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      return response?.ok ?? false;
    });
  },
};
