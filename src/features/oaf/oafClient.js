// oafClient.js
// Runtime-safe wrapper for the Open Assistant Framework (OAF)
// Works in:
// - Browser / Vercel (standalone, no OAF)
// - Coupa iframe (OAF injected at runtime)

import config from "./oafConfig";

// --------------------------------------------------
// Internal OAF loader (dynamic, runtime-only)
// --------------------------------------------------

let oafApp = null;
let attemptedLoad = false;

async function getOafApp() {
  if (oafApp || attemptedLoad) return oafApp;
  attemptedLoad = true;

  try {
    const module = await import("@coupa/open-assistant-framework-client");
    const { initOAFInstance } = module;
    oafApp = initOAFInstance(config);
  } catch (err) {
    // Outside Coupa → OAF is unavailable (expected)
    oafApp = null;
  }

  return oafApp;
}

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const failure = (op) => ({
  status: "failure",
  message: `OAF is not available (${op}). Open the app inside Coupa.`,
});

const noopEmitter = {
  on: () => {},
  off: () => {},
  emit: () => {},
};

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
// Context & Navigation
// --------------------------------------------------

export const getPageContext = async () => {
  const app = await getOafApp();

  if (!app) {
    // Fallback so UI can still render layout
    return {
      status: "success",
      data: {
        pageDetails: {
          viewPortHeight: window.innerHeight,
          viewPortWidth: window.innerWidth,
        },
      },
      message: "Standalone fallback context",
    };
  }

  return app.getPageContext();
};

const normalizePath = (path) => {
  const p = (path || "").trim();
  if (!p) return "";
  if (/^(https?:|\/\/|\/)/.test(p)) return p;
  return `/${p}`;
};

export const navigatePath = async (path) => {
  const app = await getOafApp();
  if (!app) return failure("navigatePath");

  const normalized = normalizePath(path);
  if (!normalized) {
    return { status: "failure", message: "Navigation path is empty" };
  }

  await app.navigateToPath(normalized);
  return { status: "success" };
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
  return app?.events || noopEmitter;
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
``