interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: Error) => void;
}

class RateLimiter {
  private minInterval: number;
  private lastRequestTime = 0;
  private queue: QueuedRequest<unknown>[] = [];
  private processing = false;

  constructor(minIntervalMs: number) {
    this.minInterval = minIntervalMs;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const elapsed = now - this.lastRequestTime;

      if (elapsed < this.minInterval) {
        // Wait until we can make the next request
        await new Promise(resolve => setTimeout(resolve, this.minInterval - elapsed));
      }

      this.lastRequestTime = Date.now();
      const request = this.queue.shift()!;

      try {
        const result = await request.execute();
        request.resolve(result);
      } catch (error) {
        request.reject(error instanceof Error ? error : new Error(String(error)));
      }
    }

    this.processing = false;
  }

  schedule<T>(execute: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.processQueue();
    });
  }
}

export const pantryRateLimiter = new RateLimiter(2000); // 2 seconds between requests
