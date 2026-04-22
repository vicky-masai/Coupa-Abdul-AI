import { moveAndResize, getPageContext } from "./oafClient";
import {
  LAYOUT_POSITIONS,
  DISPATCH_ACTIONS,
  STATUSES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LAYOUT_DIMENSIONS,
} from "./oafConstants";

/**
 * Safely extract a readable message from any response/error shape
 */
const pickMessage = (resp) => {
  if (!resp) return null;

  // 1) Coupa aggregated errors (prefer over generic `message` when both exist)
  if (Array.isArray(resp.error_data) && resp.error_data.length > 0) {
    return resp.error_data
      .map(
        (e) =>
          `${e?.error_key || STATUSES.ERROR} : ${e?.error_attribute || e?.error_message || "Unknown"}`
      )
      .join("\n");
  }

  // 2) direct message
  if (resp.message && typeof resp.message === "string") return resp.message;

  // 3) standard error object
  if (resp.error && typeof resp.error?.message === "string") return resp.error.message;

  // 4) rawError/exception
  if (resp.rawError && typeof resp.rawError?.message === "string") return resp.rawError.message;

  return null;
};

/**
 * Handles the resize operation for the app window by calculating new dimensions,
 * moving and resizing the window, and updating layout state and position.
 */
const handleOAFResizeOperation = async (
  dispatch,
  dimensionCalculator,
  newLayoutPosition,
  newLayoutState
) => {
  try {
    // 1. Fetch Page Context
    const pageContext = await getPageContext();

    if (!pageContext || pageContext.status !== STATUSES.SUCCESS) {
      dispatch({
        type: DISPATCH_ACTIONS.SET_ERROR,
        payload: ERROR_MESSAGES.PAGE_CONTEXT,
      });
      return;
    }

    // Extract viewport and window dimensions
    const viewPortHeight = pageContext?.data?.pageDetails?.viewPortHeight ?? window.innerHeight;
    const viewPortWidth = pageContext?.data?.pageDetails?.viewPortWidth ?? window.innerWidth;
    const windowHeight = window.innerHeight;
    const windowWidth = window.innerWidth;

    // 2. Calculate new dimensions using provided calculator
    const { top, left, height, width } = dimensionCalculator(
      { viewPortHeight, viewPortWidth },
      { windowHeight, windowWidth },
      newLayoutPosition
    );

    // 3. Move and resize the app window
    const resp = await moveAndResize(top, left, height, width, false);

    if (resp && resp.status === STATUSES.SUCCESS) {
      // Dispatch success response
      dispatch({
        type: DISPATCH_ACTIONS.SET_RESPONSE,
        payload: { message: SUCCESS_MESSAGES.RESIZE(height, width) },
      });

      // 4. Optionally update the layout
      if (newLayoutPosition) {
        dispatch({
          type: DISPATCH_ACTIONS.SET_LAYOUT_POSITION,
          payload: newLayoutPosition,
        });
      }

      if (newLayoutState) {
        dispatch({
          type: DISPATCH_ACTIONS.SET_LAYOUT_STATE,
          payload: newLayoutState,
        });
      }
    } else {
      // Dispatch error response
      dispatch({
        type: DISPATCH_ACTIONS.SET_ERROR,
        payload: pickMessage(resp) || ERROR_MESSAGES.UNKNOWN,
      });
    }
  } catch (error) {
    // Dispatch error for exceptions
    dispatch({
      type: DISPATCH_ACTIONS.SET_ERROR,
      payload: error?.message || ERROR_MESSAGES.UNKNOWN,
    });
  }
};

/**
 * Calculates dimensions for docking the App fully to the left.
 * @returns {Object} {top, left, height, width}
 */
const dockLeftCalculator = (
  { viewPortHeight },
  { windowHeight, windowWidth }
) => {
  const height = windowHeight;
  const width = windowWidth;
  const top = Math.round(viewPortHeight - height);
  const left = 0;
  return { top, left, height, width };
};

/**
 * Calculates dimensions for docking the App fully to the right.
 * @returns {Object} {top, left, height, width}
 */
const dockRightCalculator = (
  { viewPortHeight, viewPortWidth },
  { windowHeight, windowWidth }
) => {
  const height = windowHeight;
  const width = windowWidth;
  const top = Math.round(viewPortHeight - height);
  const left = Math.round(viewPortWidth - width);
  return { top, left, height, width };
};

/**
 * Calculates dimensions for a maximized/default layout.
 * Standard: 60% height, 30% width of viewport.
 * @returns {Object} {top, left, height, width}
 */
const maximizeCalculator = (
  { viewPortHeight, viewPortWidth },
  _,
  newLayoutPosition
) => {
  const height = Math.round(
    viewPortHeight * LAYOUT_DIMENSIONS.MAXIMIZE_HEIGHT_RATIO
  );
  const width = Math.round(
    viewPortWidth * LAYOUT_DIMENSIONS.MAXIMIZE_WIDTH_RATIO
  );
  const top = Math.round(viewPortHeight - height);

  // Align left if previously docked left, else right
  let left = Math.round(viewPortWidth - width);
  if (newLayoutPosition === LAYOUT_POSITIONS.DOCKED_LEFT) {
    left = 0;
  }
  return { top, left, height, width };
};

/**
 * Calculates dimensions for a side panel (95% height, 30% width).
 * Aligns left if previously docked left, else right.
 * @returns {Object} {top, left, height, width}
 */
const sidePanelCalculator = (
  { viewPortHeight, viewPortWidth },
  _,
  newLayoutPosition
) => {
  const height = Math.round(
    viewPortHeight * LAYOUT_DIMENSIONS.SIDE_PANEL_HEIGHT_RATIO
  );
  const width = Math.round(
    viewPortWidth * LAYOUT_DIMENSIONS.SIDE_PANEL_WIDTH_RATIO
  );
  const top = Math.round(viewPortHeight - height);
  let left = Math.round(viewPortWidth - width);
  if (newLayoutPosition === LAYOUT_POSITIONS.DOCKED_LEFT) {
    left = 0;
  }
  return { top, left, height, width };
};

/**
 * Calculates dimensions for minimizing the OAF.
 * Fixed size: 200x200.
 * @returns {Object} {top, left, height, width}
 */
const minimizeCalculator = ({ viewPortHeight, viewPortWidth }) => {
  const height = LAYOUT_DIMENSIONS.MINIMIZE_SIZE;
  const width = LAYOUT_DIMENSIONS.MINIMIZE_SIZE;
  const top = Math.round(viewPortHeight - height);
  const left = Math.round(viewPortWidth - width);
  return { top, left, height, width };
};

/**
 * Calculates dimensions for closing the OAF (size 0x0).
 * @returns {Object} {top, left, height, width}
 */
const closeCalculator = ({ viewPortHeight, viewPortWidth }) => {
  const height = 0;
  const width = 0;
  const top = Math.round(viewPortHeight - height);
  const left = Math.round(viewPortWidth - width);
  return { top, left, height, width };
};

/**
 * Executes an OAF action and returns a normalized result object.
 * It never throws and never assumes resp/message exist.
 * @param {Function} action - Async function to execute
 * @returns {Promise<Object>} { message, status, data?, error_data?, error_action?, rawResponse?, error? }
 */
const oafExecuteAction = async (action) => {
  try {
    const resp = await action();

    // No response at all
    if (resp == null) {
      return {
        message: "No response from OAF (are you outside Coupa?)",
        status: STATUSES.ERROR,
        rawResponse: resp,
      };
    }

    const status =
      resp.status !== undefined && resp.status !== null && resp.status !== ""
        ? resp.status
        : resp.success
          ? STATUSES.SUCCESS
          : STATUSES.ERROR;
    const message =
      pickMessage(resp) ||
      (status === STATUSES.SUCCESS ? SUCCESS_MESSAGES.GENERIC : ERROR_MESSAGES.UNKNOWN);

    if (status === STATUSES.SUCCESS) {
      return {
        message,
        status,
        ...(resp.data && { data: resp.data }),
        rawResponse: resp,
      };
    }

    // Non-success: preserve host-reported status (e.g. custom values), not only `failure`
    return {
      message,
      status,
      error_action: resp.action,
      error_data: resp.error_data,
      rawResponse: resp,
    };
  } catch (error) {
    return {
      message: error?.message || ERROR_MESSAGES.UNKNOWN,
      status: STATUSES.ERROR,
      error_data: null,
      error_action: null,
      rawResponse: null,
      error,
    };
  }
};

export {
  handleOAFResizeOperation,
  dockLeftCalculator,
  dockRightCalculator,
  maximizeCalculator,
  sidePanelCalculator,
  minimizeCalculator,
  closeCalculator,
  oafExecuteAction,
};