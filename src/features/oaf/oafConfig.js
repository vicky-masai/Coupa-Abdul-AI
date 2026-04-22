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

/**
 * Determine the Coupa host **domain** (no protocol).
 * - In PROD: prefer the URL param (?coupahost=ey-in-demo.coupacloud.com),
 *            else fall back to the DEFAULT_HOST but **strip protocol**.
 * - In DEV: use local bridge hostname (strip protocol).
 */
const getCoupaHostDomain = () => {
  if (!import.meta.env.PROD) {
    // strip protocol if present
    return (CONFIG_PROPS.HOST_URLS.LOCALHOST || "")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
  }

  // coupa passes domain only: ey-in-demo.coupacloud.com
  const fromUrl = getParam(CONFIG_PROPS.URL_PARAMS.COUPA_HOST, "host");
  if (fromUrl) return fromUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  // fallback tenant (domain only); `.env` override wins over oafConstants default
  const defaultHost =
    VITE_COUPA_DEFAULT_HOST || CONFIG_PROPS.HOST_URLS.DEFAULT_HOST || "";
  return defaultHost.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
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