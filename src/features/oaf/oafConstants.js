/**
 * Shared constants for OAF feature.
 *
 * NOTE:
 * - APP_ID and DEFAULT_HOST here are harmless defaults; we hard-force your real values in oafConfig.js.
 * - URL_PARAMS.* MUST be the PARAMETER NAMES Coupa passes (e.g., "coupahost", "floating_iframe_id"),
 *   NOT your actual domain or numeric values.
 */

/**
 * Configuration properties for OAF initialization
 * @readonly
 * @typedef {Object}
 */
export const CONFIG_PROPS = {
  /**
   * Default iframe Client ID; overridden by `VITE_OAF_APP_ID` in `oafConfig.js` (see `.env.example`).
   */
  APP_ID: "1234567890",

  HOST_URLS: {
    /**
     * Used when running Vite dev server (npm run dev), not in production deploys.
     * Keep as-is unless your local bridge uses a different port.
     */
    LOCALHOST: "http://localhost:46880",

    /** Protocol prefix used when coupahost comes without scheme */
    HTTPS_PROTOCOL: "https://",

    /**
     * Default tenant when no `?coupahost=` is present (production).
     * Override with `VITE_COUPA_DEFAULT_HOST` in `.env` (handled in `oafConfig.js`).
     */
    DEFAULT_HOST: "https://ey-in-demo.coupacloud.com",
  },

  // IMPORTANT: these are the query parameter NAMES Coupa appends to your BYOA app URL
  URL_PARAMS: {
    /** Coupa passes the domain (no protocol) using this param name, e.g. ?coupahost=ey-in-demo.coupacloud.com */
    COUPA_HOST: "coupahost",

    /** Coupa provides the floating iframe id with this param name, e.g. ?floating_iframe_id=69 */
    IFRAME_ID: "floating_iframe_id",
  },
};

export const LAYOUT_POSITIONS = {
  DOCKED_LEFT: "docked-left",
  DOCKED_RIGHT: "docked-right",
};

export const LAYOUT_STATES = {
  MAXIMIZED: "maximized",
  MINIMIZED: "minimized",
  SIDE_PANEL: "side-panel",
  DEFAULT: "default",
};

export const LAYOUT_DIMENSIONS = {
  MAXIMIZE_HEIGHT_RATIO: 0.6,     // 60% of viewport height
  MAXIMIZE_WIDTH_RATIO: 0.3,      // 30% of viewport width
  SIDE_PANEL_HEIGHT_RATIO: 0.95,  // 95% of viewport height
  SIDE_PANEL_WIDTH_RATIO: 0.3,    // 30% of viewport width
  MINIMIZE_SIZE: 200,             // 200px x 200px for minimized state
};

export const DISPATCH_ACTIONS = {
  SET_ERROR: "SET_ERROR",
  SET_RESPONSE: "SET_RESPONSE",
  SET_LAYOUT_POSITION: "SET_LAYOUT_POSITION",
  SET_LAYOUT_STATE: "SET_LAYOUT_STATE",
};

export const STATUSES = {
  SUCCESS: "success",
  ERROR: "failure",
};

export const ERROR_MESSAGES = {
  GENERIC: "An error occurred",
  PAGE_CONTEXT: "Failed to get page context",
  RESIZE: "Failed to resize the window",
  UNKNOWN: "An unknown error occurred",
  USE_OAF: "useOaf must be used within an OafProvider",
};

export const SUCCESS_MESSAGES = {
  GENERIC: "Operation completed successfully",
  RESIZE: (height, width) => `Window resized successfully to ${height}x${width}`,
};