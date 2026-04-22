/**
 * Vite-only env reads (uses `import.meta.env`). Jest replaces this module — see `viteEnv.jest.js`.
 */
export const VITE_OAF_APP_ID = (import.meta.env?.VITE_OAF_APP_ID ?? "").trim();
export const VITE_COUPA_DEFAULT_HOST = (
  import.meta.env?.VITE_COUPA_DEFAULT_HOST ?? ""
).trim();
export const VITE_APP_TITLE = (import.meta.env?.VITE_APP_TITLE ?? "").trim();
