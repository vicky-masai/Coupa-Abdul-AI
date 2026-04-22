// src/features/oaf/useOaf.js
import { useContext, useEffect, useState } from "react";
import { OafContext } from "./OafContext";
import {
  navigatePath,
  openEasyForm,
  readForm,
  writeForm,
  subscribeToLocation,
  subscribeToEvents,
  getPageContext,
  getUserContext,
  getElementMeta,
  launchUiButtonClickProcess,
  ensureOafClient,
  getOafAppEventsSync,
} from "./oafClient";
import {
  closeCalculator,
  handleOAFResizeOperation,
  dockLeftCalculator,
  dockRightCalculator,
  sidePanelCalculator,
  maximizeCalculator,
  minimizeCalculator,
  oafExecuteAction,
} from "./oafUtils";
import {
  LAYOUT_POSITIONS,
  LAYOUT_STATES,
  ERROR_MESSAGES,
} from "./oafConstants";

/**
 * Custom React hook for interacting with OAF (Open Application Framework).
 * Provides state and a set of actions for controlling OAF layout and features.
 */
export const useOaf = () => {
  // Access OAF context (state and dispatch)
  const context = useContext(OafContext);

  // Ensure hook is used within an OafProvider
  if (!context) {
    throw new Error(ERROR_MESSAGES.USE_OAF);
  }

  const { state, dispatch } = context;

  // Extract layout-related state
  const { currLayoutPosition, currLayoutState, prevLayoutState } = state;

  /**
   * Dock OAF app to the left side of the screen
   * No-op if already docked
   * @returns {Promise<void>}
   */
  const dockAppToLeft = async () => {
    if (currLayoutPosition === LAYOUT_POSITIONS.DOCKED_LEFT) {
      return; // Already docked left, no-op
    }

    await handleOAFResizeOperation(
      dispatch,
      dockLeftCalculator,
      LAYOUT_POSITIONS.DOCKED_LEFT,
      currLayoutState
    );
  };

  /**
   * Dock app to the right side of the screen
   */
  const dockAppToRight = async () => {
    if (currLayoutPosition === LAYOUT_POSITIONS.DOCKED_RIGHT) {
      return; // Already docked right, no-op
    }
    await handleOAFResizeOperation(
      dispatch,
      dockRightCalculator,
      LAYOUT_POSITIONS.DOCKED_RIGHT,
      currLayoutState
    );
  };

  /**
   * Maximize the OAF app window
   * No-op if already maximized
   */
  const maximiseApp = async () => {
    if (currLayoutState === LAYOUT_STATES.MAXIMIZED) {
      return; // Already maximized, no-op
    }
    await handleOAFResizeOperation(
      dispatch,
      maximizeCalculator,
      currLayoutPosition,
      LAYOUT_STATES.MAXIMIZED
    );
  };

  /**
   * Make the OAF app a side panel
   */
  const makeAppSidepanel = async () => {
    if (currLayoutState === LAYOUT_STATES.SIDE_PANEL) {
      return; // Already a side panel, no-op
    }
    await handleOAFResizeOperation(
      dispatch,
      sidePanelCalculator,
      currLayoutPosition,
      LAYOUT_STATES.SIDE_PANEL
    );
  };

  /**
   * Minimize the app window
   */
  const minimiseApp = async () => {
    await handleOAFResizeOperation(
      dispatch,
      minimizeCalculator,
      currLayoutPosition,
      LAYOUT_STATES.MINIMIZED
    );
  };

  /**
   * Expand the app to its previous layout state (maximized or side-panel)
   */
  const expandApp = async () => {
    const targetLayoutState = prevLayoutState || LAYOUT_STATES.MAXIMIZED;
    if (targetLayoutState === LAYOUT_STATES.MAXIMIZED) {
      await handleOAFResizeOperation(
        dispatch,
        maximizeCalculator,
        currLayoutPosition,
        targetLayoutState
      );
    } else if (targetLayoutState === LAYOUT_STATES.SIDE_PANEL) {
      await handleOAFResizeOperation(
        dispatch,
        sidePanelCalculator,
        currLayoutPosition,
        targetLayoutState
      );
    } else {
      // default fallback
      await handleOAFResizeOperation(
        dispatch,
        maximizeCalculator,
        currLayoutPosition,
        targetLayoutState
      );
    }
  };

  /**
   * Close the app
   */
  const closeApp = async () => {
    await handleOAFResizeOperation(
      dispatch,
      closeCalculator,
      currLayoutPosition,
      currLayoutState
    );
  };

  /**
   * Navigate to a specific URL using OAF
   * @param {string} path - URL to navigate to
   */
  const oafNavigatePath = async (path) => {
    return oafExecuteAction(() => navigatePath(path));
  };

  /**
   * Open an EasyForm using OAF
   * @param {string} formId - ID of the form to open
   */
  const oafOpenEasyForm = async (formId) => {
    return oafExecuteAction(() => openEasyForm(formId));
  };

  /**
   * Read a form using OAF
   * @param {object} readMetaData - Metadata for reading the form
   */
  const oafReadForm = async (readMetaData) => {
    return oafExecuteAction(() => readForm(readMetaData));
  };

  /**
   * Write data to a form using OAF
   * @param {object} writeData - Data to write to the form
   */
  const oafWriteForm = async (writeData) => {
    return oafExecuteAction(() => writeForm(writeData));
  };

  /**
   * Subscribe to location changes using OAF
   * @param {object} subscriptionData - Data for subscription
   */
  const oafSubscribeToLocation = async (subscriptionData) => {
    return oafExecuteAction(() => subscribeToLocation(subscriptionData));
  };

  /**
   * Subscribe to OAF push events
   * @param {object} eventsSubscriptionData - Events to Subscribe Data
   */
  const oafSubscribeToEvents = async (eventsSubscriptionData) => {
    return oafExecuteAction(() => subscribeToEvents(eventsSubscriptionData));
  };

  /**
   * Get the page context using OAF
   * @returns {Promise<object>} The page context data
   */
  const oafGetPageContext = async () => {
    return oafExecuteAction(() => getPageContext());
  };

  /**
   * Get the signed-in Coupa user context (requires running inside Coupa with permission).
   */
  const oafGetUserContext = async () => {
    return oafExecuteAction(() => getUserContext());
  };

  /**
   * Get metadata from a form or element using OAF
   * @param {object} formStructure - The form structure data
   * @returns {Promise<object>} The metadata response
   */
  const oafGetElementMeta = async (formStructure) => {
    return oafExecuteAction(() => getElementMeta(formStructure));
  };

  /**
   * Execute a workflow process by its ID using OAF
   * @param {number} processId - The ID of the workflow process to execute
   * @returns {Promise<object>} The execution response
   */
  const oafLaunchUiButtonClickProcess = async (processId) => {
    return oafExecuteAction(() => launchUiButtonClickProcess(processId));
  };

  // OAF `events` emitter is created when the SDK loads; prime client then read cached emitter.
  const [oafAppEvents, setOafAppEvents] = useState(() => getOafAppEventsSync());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await ensureOafClient();
      if (!cancelled) setOafAppEvents(getOafAppEventsSync());
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Return state and all app actions
  return {
    // State
    ...state,

    // Actions
    expandApp,
    maximiseApp,
    minimiseApp,
    makeAppSidepanel,
    dockAppToLeft,
    dockAppToRight,
    oafNavigatePath,
    oafOpenEasyForm,
    oafReadForm,
    oafWriteForm,
    oafAppEvents,
    closeApp,
    oafSubscribeToLocation,
    oafSubscribeToEvents,
    oafGetPageContext,
    oafGetUserContext,
    oafGetElementMeta,
    oafLaunchUiButtonClickProcess,
  };
};