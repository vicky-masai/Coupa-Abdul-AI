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

const normalizePath = (path) => {
  const p = (path || "").trim();
  if (!p) return "";
  if (/^(https?:|\/\/|\/)/.test(p)) return p;
  return `/${p}`;
};

export const navigatePath = async (path) => {
  const app = await getOafApp();
  const normalized = normalizePath(path);
  if (!normalized) {
    return { status: "failure", message: "Navigation path is empty" };
  }

  if (!app) {
    // Local fallback for testing outside Coupa
    const host = config.coupahost.includes("localhost")
      ? "https://ey-in-demo.coupacloud.com"
      : `https://${config.coupahost}`;
    const fullUrl = `${host}${normalized}`;
    console.log("[OAF FALLBACK] Navigating to:", fullUrl);
    window.location.href = fullUrl;
    return {
      status: "success",
      message: `Navigating to ${normalized} (Standalone Fallback)`,
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
