/// <reference types="vite/client" />

interface AdjDesktopApi {
    selectDirectory: () => Promise<string | null>;
}

interface Window {
    adjDesktop?: AdjDesktopApi;
}
