// src/features/oaf/oafConfig.js
import { CONFIG_PROPS } from "./oafConstants";
import { VITE_OAF_APP_ID, VITE_COUPA_DEFAULT_HOST } from "./viteEnv.js";

// Parse current URL params (Coupa app appends these when launching the floating iFrame)
const urlParams = new URLSearchParams(window.location.search);

const getParam = (...names) => {
  for (const n of names) {
    const v = urlParams.get(n);
    if (v && v.trim()) return v.trim();
  }
  return null;
};

const stripHostValue = (value) =>
  String(value || "")
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

/**
 * Determine the Coupa host **domain** (no protocol).
 * - Prefer `?coupahost=` from the URL in **all** environments (Coupa appends this when the BYOA
 *   app runs in a floating iframe, including `npm run dev` against a local Vite server).
 * - Then `VITE_COUPA_DEFAULT_HOST`, then `DEFAULT_HOST` from constants.
 * - In dev only, if none of the above are set, fall back to the local bridge host (LOCALHOST).
 */
const getCoupaHostDomain = () => {
  const fromUrl = getParam(CONFIG_PROPS.URL_PARAMS.COUPA_HOST, "host");
  if (fromUrl) return stripHostValue(fromUrl);

  const fromVite = stripHostValue(VITE_COUPA_DEFAULT_HOST);
  if (fromVite) return fromVite;

  if (!import.meta.env.PROD) {
    const localBridge = stripHostValue(CONFIG_PROPS.HOST_URLS.LOCALHOST || "");
    if (localBridge) return localBridge;
  }

  const fromConstants = stripHostValue(CONFIG_PROPS.HOST_URLS.DEFAULT_HOST);
  if (fromConstants) return fromConstants;

  return "";
};

/**
 * Get the runtime floating iFrame id (from URL).
 * IMPORTANT: Never hard‑code this in PROD. Coupa generates a new id each launch.
 */
const getIframeId = () => {
  const id =
    getParam(
      CONFIG_PROPS.URL_PARAMS.IFRAME_ID, // "floating_iframe_id"
      "iframe_id",
      "iframeId",
      "floatingIframeId"
    );

  if (id) return id;

  const fallback = `standalone-${(crypto?.randomUUID?.() || Math.random().toString(36).slice(2))}`;
  if (import.meta.env.PROD) {
    console.warn("[OAF] No floating_iframe_id in URL; using fallback:", fallback);
  }
  return fallback;
};

/**
 * Final OAF config object used by the SDK.
 * NOTE: coupahost is now **domain only** (no https://).
 */
const config = {
  // Floating iframe Client ID from Coupa (see README); `.env` wins over oafConstants
  appId: VITE_OAF_APP_ID || CONFIG_PROPS.APP_ID,
  coupahost: getCoupaHostDomain(), // domain only, e.g. "ey-in-demo.coupacloud.com"
  iframeId: getIframeId(),
};

const validateConfig = (cfg) => {
  if (!cfg.appId) throw new Error("App ID is required for OAF configuration");
  if (!cfg.coupahost) throw new Error("Coupa host (domain) is required for OAF configuration");
  if (import.meta.env.PROD && cfg.iframeId.startsWith("standalone-")) {
    console.warn("[OAF] Using standalone iframeId in PROD (app not launched from Coupa?):", cfg.iframeId);
  }
};

validateConfig(config);

export default config;