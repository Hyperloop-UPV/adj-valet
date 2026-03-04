import { ADJ } from "../types/ADJ";

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export interface BackendConfig {
  backend_port: number;
  backend_url: string;
  timestamp: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseUrl: string | null = null;
  private readonly DISCOVERY_PORTS = Array.from({ length: 101 }, (_, i) => 8000 + i); // Check ports 8000-8100
  private readonly REQUEST_TIMEOUT = 5000;

  private async discoverBackend(): Promise<string> {
    // If the UI is already being served by the backend, prefer same-origin requests.
    if (window.location.protocol.startsWith('http')) {
      try {
        const sameOriginResponse = await fetch(`${window.location.origin}/health`);
        if (sameOriginResponse.ok) {
          console.log(`Backend detected on current origin: ${window.location.origin}`);
          return window.location.origin;
        }
      } catch {
        console.log('Current origin is not the backend, continuing discovery');
      }
    }

    // First, try to read the port file written by the backend
    try {
      const portFileResponse = await fetch('/.adj-valet-port');
      if (portFileResponse.ok) {
        const portInfo = await portFileResponse.json();
        if (portInfo.backend_url) {
          console.log(`Backend URL from port file: ${portInfo.backend_url}`);
          // Verify this URL is actually working
          const healthResponse = await fetch(`${portInfo.backend_url}/health`);
          if (healthResponse.ok) {
            console.log(`Backend verified at: ${portInfo.backend_url}`);
            return portInfo.backend_url;
          }
        }
      }
    } catch {
      console.log('Could not read port file, falling back to discovery');
    }

    // Fallback to port discovery
    for (const port of this.DISCOVERY_PORTS) {
      try {
        const url = `http://localhost:${port}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        
        const response = await fetch(`${url}/health`, { 
          signal: controller.signal,
          method: 'GET'
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`Backend discovered at: ${url}`);
          return url;
        }
      } catch {
        continue;
      }
    }

    console.warn('Backend auto-discovery failed, using default port 8000');
    return 'http://localhost:8000';
  }

  private async getBaseUrl(): Promise<string> {
    if (!this.baseUrl) {
      this.baseUrl = await this.discoverBackend();
    }
    return this.baseUrl;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const url = `${baseUrl}${endpoint}`;
    
    console.log(`Making ${options.method || 'GET'} request to: ${url}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.REQUEST_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      console.log(`Response from ${url}: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`Error response from ${url}:`, errorText);
        throw new ApiError(
          `HTTP ${response.status}: ${errorText}`,
          response.status,
          response
        );
      }

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text() as unknown as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      console.error(`Request failed to ${url}:`, error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 408);
      }
      
      // If it's a network error and we had a cached base URL, clear it and retry once
      const headers = options.headers as Record<string, string> || {};
      if (!headers['x-retry'] && this.baseUrl && error instanceof Error && (
        error.message.includes('Failed to fetch') || 
        error.message.includes('Network error') ||
        error.message.includes('CORS') ||
        error.message.includes('NetworkError')
      )) {
        console.log('Network error detected, clearing cached URL and retrying...');
        this.baseUrl = null;
        return this.makeRequest<T>(endpoint, { 
          ...options, 
          headers: { ...options.headers, 'x-retry': 'true' } 
        });
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : 'Network error',
        0
      );
    }
  }

  async setADJPath(adjPath: string): Promise<string> {
    if (!adjPath?.trim()) {
      throw new ApiError('ADJ path cannot be empty', 400);
    }

    return this.makeRequest<string>('/path', {
      method: 'POST',
      body: JSON.stringify({ path: adjPath.trim() }),
    });
  }

  async getConfig(): Promise<ADJ> {
    return this.makeRequest<ADJ>('/assemble');
  }

  async updateConfig(config: ADJ): Promise<ADJ> {
    try {
      return await this.makeRequest<ADJ>('/update', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    } catch (error) {
      // For save operations, if we get a network error, force rediscovery and retry once more
      if (error instanceof ApiError && error.status === 0 && this.baseUrl) {
        console.warn('Save failed with network error, forcing backend rediscovery...');
        this.baseUrl = null;
        return this.makeRequest<ADJ>('/update', {
          method: 'POST',
          body: JSON.stringify(config),
          headers: { 'x-force-retry': 'true' }
        });
      }
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest<string>('/health');
      return true;
    } catch {
      return false;
    }
  }

  resetConnection(): void {
    this.baseUrl = null;
    console.log('API connection reset - will rediscover backend on next request');
  }
}

export const apiClient = new ApiClient();

export const { setADJPath, getConfig, updateConfig, healthCheck } = apiClient;

export const sendADJPath = apiClient.setADJPath.bind(apiClient);
export const assembleJSON = apiClient.getConfig.bind(apiClient);
export const sendADJ = apiClient.updateConfig.bind(apiClient);
export const resetApiCache = apiClient.resetConnection.bind(apiClient);
