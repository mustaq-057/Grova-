// API client with retry logic and exponential backoff
interface RequestOptions extends RequestInit {
  retries?: number;
  retryDelay?: number;
}

export async function fetchWithRetry(url: string, options: RequestOptions = {}): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (response.ok || response.status < 500) {
        return response;
      }

      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on abort
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      // Exponential backoff
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Request failed after retries');
}

// Request deduplication
const pendingRequests = new Map<string, Promise<Response>>();

export async function fetchDeduped(url: string, options: RequestOptions = {}): Promise<Response> {
  const key = `${options.method || 'GET'}:${url}`;
  
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const promise = fetchWithRetry(url, options).finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}
