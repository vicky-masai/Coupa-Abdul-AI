// oafClient.js
// Runtime-safe wrapper for Coupa Open Assistant Framework (OAF)
// Safe for:
// - Browser / Vercel (standalone, no OAF)
// - Coupa iframe (OAF injected at runtime)

import config from "./oafConfig";

// --------------------------------------------------
// Dynamic OAF loader (CRITICAL for Vercel)
// --------------------------------------------------

let oafApp = null;
let loadAttempted = false;

const noopEmitter = {
  on: () => {},
  off: () => {},
  emit: () => {},
};

const resolveEventsEmitter = (app) => {
  const ev = app?.events;
  return ev &&
    typeof ev.on === "function" &&
    typeof ev.off === "function"
    ? ev
    : noopEmitter;
};

/** Updated whenever `getOafApp()` finishes (success or stub). */
let cachedEventsEmitter = noopEmitter;

async function getOafApp() {
  if (oafApp || loadAttempted) return oafApp;
  loadAttempted = true;

  try {
    const { initOAFInstance } = await import(
      "@coupa/open-assistant-framework-client"
    );
    oafApp = initOAFInstance(config);
    cachedEventsEmitter = resolveEventsEmitter(oafApp);
  } catch (_err) {
    // Expected outside Coupa
    oafApp = null;
    cachedEventsEmitter = noopEmitter;
  }

  return oafApp;
}

/** Await once so the SDK (or stub) is initialized; safe to call multiple times. */
export async function ensureOafClient() {
  return getOafApp();
}

/** Event emitter from the last successful init; use after `ensureOafClient()`. */
export function getOafAppEventsSync() {
  return cachedEventsEmitter;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const failure = (op) => ({
  status: "failure",
  message: `OAF is not available (${op}). Open the app inside Coupa.`,
});

// --------------------------------------------------
// Window & Layout APIs
// --------------------------------------------------

export const setSize = async (height, width) => {
  const app = await getOafApp();
  if (!app) return failure("setSize");

  await app.setSize({ height, width });
  return { status: "success" };
};

export const moveAppToLocation = async (top, left, resetToDock) => {
  const app = await getOafApp();
  if (!app) return failure("moveToLocation");

  await app.moveToLocation({ top, left, resetToDock });
  return { status: "success" };
};

export const moveAndResize = async (
  top,
  left,
  height,
  width,
  resetToDock
) => {
  const app = await getOafApp();
  if (!app) return failure("moveAndResize");

  await app.moveAndResize({ top, left, height, width, resetToDock });
  return { status: "success" };
};

// --------------------------------------------------
// Context APIs
// --------------------------------------------------

export const getPageContext = async () => {
  const app = await getOafApp();

  if (!app) {
    // Standalone fallback (browser / Vercel)
    return {
      status: "success",
      data: {
        pageDetails: {
          viewPortHeight: window.innerHeight,
          viewPortWidth: window.innerWidth,
        },
      },
      message: "Standalone fallback page context",
    };
  }

  return app.getPageContext();
};

export const getUserContext = async () => {
  const app = await getOafApp();

  if (!app) {
    // Standalone fallback
    return {
      status: "success",
      data: { user: null },
      message: "Standalone fallback user context",
    };
  }

  if (typeof app.getUserContext !== "function") {
    return {
      status: "success",
      data: { user: null },
      message: "getUserContext is not available on this OAF runtime",
    };
  }

  return app.getUserContext();
};

// --------------------------------------------------
// Navigation
// --------------------------------------------------

/** Domain from config (no scheme, no path). */
const coupaHostDomain = () =>
  String(config.coupahost || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();

/**
 * Normalize any reasonable navigation input into a single string for `navigateToPath`.
 * Supports:
 * - `/requisition_headers`, `requisition_headers`
 * - `/invoices?status=pending`, `/foo#section` (query + hash kept)
 * - `//host/path` (protocol-relative)
 * - `https://<coupahost>/path?query#hash` → `/path?query#hash` when host matches tenant
 * Returns "" if input is empty or a full URL whose host does not match `config.coupahost` (when coupahost is set).
 */
const normalizePath = (path) => {
  const p = (path || "").trim();
  if (!p) return "";

  const tenant = coupaHostDomain();

  const fromAbsoluteUrl = (urlString) => {
    try {
      const u = new URL(urlString);
      const host = u.hostname.toLowerCase();
      if (tenant && host !== tenant) {
        console.warn(
          "[OAF] Navigation URL host does not match coupahost; use paths under your tenant:",
          host,
          "expected",
          tenant
        );
        return "";
      }
      const out = `${u.pathname}${u.search}${u.hash}`;
      if (!out || out === "/") return "/";
      return out;
    } catch {
      return "";
    }
  };

  if (/^https?:\/\//i.test(p)) {
    return fromAbsoluteUrl(p);
  }

  if (p.startsWith("//")) {
    return fromAbsoluteUrl(`https:${p}`);
  }

  // Fix accidental duplicate slashes: ///foo -> /foo
  let rel = p.startsWith("/") ? p : `/${p}`;
  rel = rel.replace(/\/{2,}/g, "/");
  return rel;
};

/** True when this document is inside a parent frame (e.g. Coupa floating iframe). */
const isEmbeddedInParentFrame = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

export const navigatePath = async (path) => {
  const normalized = normalizePath(path);
  if (!normalized) {
    return {
      status: "failure",
      message:
        "Navigation path is empty or the URL host does not match this app’s coupahost (use a path like /requisition_headers or a full URL on your Coupa tenant).",
    };
  }

  const app = await getOafApp();

  if (!app) {
    if (isEmbeddedInParentFrame()) {
      return {
        status: "failure",
        message:
          "OAF client is not available inside this iframe. Use the official Coupa BYOA client package so navigateToPath can talk to Coupa Core (do not guess postMessage actions — undocumented messages can break the parent page).",
      };
    }
    // Top-level window only: full redirect for local testing without OAF.
    const host = String(config.coupahost || "").includes("localhost")
      ? "https://ey-in-demo.coupacloud.com"
      : `https://${config.coupahost}`;
    const fullUrl = `${host}${normalized}`;
    console.log("[OAF FALLBACK] Navigating to:", fullUrl);
    window.location.href = fullUrl;
    return {
      status: "success",
      message: `Navigating to ${normalized} (standalone)`,
    };
  }

  const resp = await app.navigateToPath(normalized);
  return resp || { status: "success" };
};

// --------------------------------------------------
// Forms & Enterprise APIs
// --------------------------------------------------

export const openEasyForm = async (formId) => {
  const app = await getOafApp();
  if (!app || !app.enterprise) return failure("openEasyForm");

  await app.enterprise.openEasyForm(formId);
  return { status: "success" };
};

export const readForm = async (readMetaData) => {
  const app = await getOafApp();
  if (!app) return failure("readForm");

  return app.readForm({ formMetaData: readMetaData });
};

export const writeForm = async (writeData) => {
  const app = await getOafApp();
  if (!app) return failure("writeForm");

  return app.writeForm(writeData);
};

// --------------------------------------------------
// Subscriptions & Events
// --------------------------------------------------

export const subscribeToLocation = async (subscriptionData) => {
  const app = await getOafApp();
  if (!app) return failure("listenToDataLocation");

  return app.listenToDataLocation(subscriptionData);
};

export const subscribeToEvents = async (subscriptionData) => {
  const app = await getOafApp();
  if (!app) return failure("listenToOafEvents");

  return app.listenToOafEvents(subscriptionData);
};

export const oafEvents = async () => {
  const app = await getOafApp();
  return resolveEventsEmitter(app);
};

export const getElementMeta = async (formStructure) => {
  const app = await getOafApp();
  if (!app) return failure("getElementMeta");

  return app.getElementMeta(formStructure);
};

export const launchUiButtonClickProcess = async (processId) => {
  const app = await getOafApp();
  if (!app || !app.enterprise)
    return failure("launchUiButtonClickProcess");

  await app.enterprise.launchUiButtonClickProcess(processId);
  return { status: "success" };
};
