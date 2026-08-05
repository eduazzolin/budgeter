declare const __APP_VERSION__: string;

/**
 * Single source of truth for application version.
 * Injected at build time by Vite from package.json version.
 */
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '1.0.0';
