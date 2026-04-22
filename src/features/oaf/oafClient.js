// oafClient.js
// Wrapper for the Open Assistant Framework (OAF) API: window, navigation, forms, events.
// Matches the working pattern used internally: static init + direct oafApp.* calls (see init below).
// Still guards for standalone / failed init so Vercel and local dev do not crash.

import { initOAFInstance } from "@coupa/open-assistant-framework-client";
import config from "./oafConfig";

// --------------------------------------------------
// OAF instance (same lifecycle as colleague reference code)
// --------------------------------------------------

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

/** Singleton from initOAFInstance(config); null if init throws. */
export let oafApp = null;

try {
  oafApp = initOAFInstance(config);
} catch (err) {
  console.warn("[OAF] initOAFInstance failed:", err);
  oafApp = null;
}

let cachedEventsEmitter = resolveEventsEmitter(oafApp);

function getOafApp() {
  return oafApp;
}

/** Same as getOafApp(); kept async for callers that await it. */
export async function ensureOafClient() {
  return getOafApp();
}

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
  const app = getOafApp();
  if (!app) return failure("setSize");

  await app.setSize({ height, width });
  return { status: "success" };
};

export const moveAppToLocation = async (top, left, resetToDock) => {
  const app = getOafApp();
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
  const app = getOafApp();
  if (!app) return failure("moveAndResize");

  await app.moveAndResize({ top, left, height, width, resetToDock });
  return { status: "success" };
};

// --------------------------------------------------
// Context APIs
// --------------------------------------------------

export const getPageContext = async () => {
  const app = getOafApp();

  if (!app) {
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
  const app = getOafApp();

  if (!app) {
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

const coupaHostDomain = () =>
  String(config.coupahost || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "")
    .split("/")[0]
    .split(":")[0]
    .toLowerCase();

/**
 * Normalize navigation input for Coupa navigateToPath (paths, query, hash, tenant URLs).
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
          "[OAF] Navigation URL host does not match coupahost:",
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

  let rel = p.startsWith("/") ? p : `/${p}`;
  rel = rel.replace(/\/{2,}/g, "/");
  return rel;
};

const isEmbeddedInParentFrame = () => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

/**
 * Navigate Coupa UI via OAF (delegates to oafApp.navigateToPath when the client is loaded).
 */
export const navigatePath = async (path) => {
  const normalizedPath = normalizePath(path);
  if (!normalizedPath) {
    return {
      status: "failure",
      message:
        "Path cannot be empty, or the URL host does not match this app's coupahost.",
    };
  }

  const app = getOafApp();

  if (!app) {
    if (isEmbeddedInParentFrame()) {
      return {
        status: "failure",
        message:
          "OAF client is not available inside this iframe. Confirm @coupa/open-assistant-framework-client initializes (official Coupa build).",
      };
    }
    const host = String(config.coupahost || "").includes("localhost")
      ? "https://ey-in-demo.coupacloud.com"
      : `https://${config.coupahost}`;
    const fullUrl = `${host}${normalizedPath}`;
    console.log("[OAF FALLBACK] Navigating to:", fullUrl);
    window.location.href = fullUrl;
    return {
      status: "success",
      message: `Navigating to ${normalizedPath} (standalone)`,
    };
  }

  return app.navigateToPath(normalizedPath);
};

// --------------------------------------------------
// Forms & Enterprise APIs
// --------------------------------------------------

export const openEasyForm = async (formId) => {
  const app = getOafApp();
  if (!app || !app.enterprise) return failure("openEasyForm");

  await app.enterprise.openEasyForm(formId);
  return { status: "success" };
};

export const readForm = async (readMetaData) => {
  const app = getOafApp();
  if (!app) return failure("readForm");

  return app.readForm({ formMetaData: readMetaData });
};

export const writeForm = async (writeData) => {
  const app = getOafApp();
  if (!app) return failure("writeForm");

  return app.writeForm(writeData);
};

// --------------------------------------------------
// Subscriptions & Events
// --------------------------------------------------

export const subscribeToLocation = async (subscriptionData) => {
  const app = getOafApp();
  if (!app) return failure("listenToDataLocation");

  return app.listenToDataLocation(subscriptionData);
};

export const subscribeToEvents = async (subscriptionData) => {
  const app = getOafApp();
  if (!app) return failure("listenToOafEvents");

  return app.listenToOafEvents(subscriptionData);
};

export const oafEvents = async () => {
  return resolveEventsEmitter(getOafApp());
};

export const getElementMeta = async (formStructure) => {
  const app = getOafApp();
  if (!app) return failure("getElementMeta");

  return app.getElementMeta(formStructure);
};

export const launchUiButtonClickProcess = async (processId) => {
  const app = getOafApp();
  if (!app || !app.enterprise)
    return failure("launchUiButtonClickProcess");

  await app.enterprise.launchUiButtonClickProcess(processId);
  return { status: "success" };
};
