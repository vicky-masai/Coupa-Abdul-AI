// Minimal stub implementation of the Open Assistant Framework client API.
// This file exists so that the package can be built and consumed by the demo app.

const stubEventEmitter = {
  on: (_event: string, _handler: (...args: unknown[]) => void) => {},
  off: (_event: string, _handler: (...args: unknown[]) => void) => {},
  emit: (_event?: string, _payload?: unknown) => {},
};

export interface OafApp {
  setSize?: (opts: {height: number; width: number}) => Promise<any>;
  moveToLocation?: (opts: {top: number; left: number; resetToDock?: boolean}) => Promise<any>;
  moveAndResize?: (opts: {
    top: number;
    left: number;
    height: number;
    width: number;
    resetToDock?: boolean;
  }) => Promise<any>;
  getPageContext?: () => Promise<any>;
  getUserContext?: () => Promise<any>;
  navigateToPath?: (path: string) => Promise<any>;
  triggerHostEvent?: (data: any) => Promise<any>;
  performAction?: (data: any) => Promise<any>;
  enterprise?: {
    openEasyForm?: (formId: string) => Promise<any>;
    launchUiButtonClickProcess?: (processId: number) => Promise<any>;
  };
  readForm?: (opts: any) => Promise<any>;
  writeForm?: (data: any) => Promise<any>;
  listenToDataLocation?: (data: any) => Promise<any>;
  listenToOafEvents?: (data: any) => Promise<any>;
  events?: any;
  getElementMeta?: (formStructure: any) => Promise<any>;
}

// simple initializer that returns an object with no-op async functions
export function initOAFInstance(config: any): OafApp {
  // consume the config parameter to avoid unused variable errors
  if (config && typeof config !== 'object') {
    console.warn('initOAFInstance: unexpected config', config);
  }

  const noop = async () => {};
  return {
    setSize: noop,
    moveToLocation: noop,
    moveAndResize: noop,
    triggerHostEvent: noop,
    performAction: noop,
    getPageContext: async () => ({}),
    getUserContext: async () => ({
      status: 'success',
      data: { user: null },
      message: 'Stub user context (run inside Coupa for real user)',
    }),
    navigateToPath: async (path: string) => {
      const normalizedPath = path.startsWith('/') ? path : `/${path}`;
      let embedded = false;
      try {
        embedded = typeof window !== 'undefined' && window.self !== window.top;
      } catch {
        embedded = true;
      }
      const tenantDomain = String(config?.coupahost || '')
        .replace(/^https?:\/\//i, '')
        .replace(/\/+$/, '')
        .split('/')[0];

      /**
       * Do NOT load the full Coupa SPA inside the BYOA iframe (`location.assign` on self):
       * that often triggers frame-busting / extra windows ("popup") or a broken mini view.
       * Prefer navigating the top Coupa window via GET form + `_top` / `_parent`, then
       * `window.open(..., '_top')`. Works best when called synchronously from a user click;
       * after `await` in React it may be ignored — use Coupa's real OAF client for production.
       */
      const navigateEmbeddedStub = (url: string): boolean => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return false;

        const submitTo = (target: '_top' | '_parent'): boolean => {
          try {
            const form = document.createElement('form');
            form.method = 'get';
            form.action = url;
            form.target = target;
            form.style.cssText = 'display:none!important';
            document.body.appendChild(form);
            form.submit();
            document.body.removeChild(form);
            return true;
          } catch {
            return false;
          }
        };

        try {
          const topWin = window.top;
          if (topWin && topWin !== window.self) {
            try {
              topWin.location.href = url;
              return true;
            } catch {
              /* cross-origin: cannot set top.location */
            }
          }
        } catch {
          /* ignore */
        }

        if (submitTo('_top')) return true;
        if (submitTo('_parent')) return true;

        try {
          window.open(url, '_top');
          return true;
        } catch {
          return false;
        }
      };

      // Stub: ask top/parent window to navigate (avoid loading Coupa inside the BYOA iframe).
      if (embedded) {
        if (tenantDomain && typeof window !== 'undefined') {
          const url = `https://${tenantDomain}${normalizedPath}`;
          if (navigateEmbeddedStub(url)) {
            return {
              status: 'success',
              message: `Stub: ${normalizedPath} (parent routing needs Coupa OAF client in package2/packages/@coupa/open-assistant-framework-client).`,
            };
          }
        }
        const hintUrl =
          tenantDomain && typeof window !== 'undefined'
            ? `https://${tenantDomain}${normalizedPath}`
            : '';
        console.warn(
          '[OAF STUB] navigateToPath in iframe (blocked or missing/invalid coupahost):',
          normalizedPath,
          hintUrl || '(no tenant URL)'
        );
        return {
          status: 'failure',
          message: hintUrl
            ? `Stub: could not navigate to ${hintUrl}. Add Coupa OAF client or check coupahost.`
            : 'Stub: missing coupahost (?coupahost= or VITE_COUPA_DEFAULT_HOST).',
        };
      }
      if (typeof window !== 'undefined') {
        const host = tenantDomain ? `https://${tenantDomain}` : 'https://ey-in-demo.coupacloud.com';
        console.log('[OAF STUB] navigateToPath (top-level only):', normalizedPath);
        window.location.href = `${host}${normalizedPath}`;
      }
      return { status: 'success', message: `Stub: Navigating to ${path}` };
    },
    enterprise: {
      openEasyForm: noop,
      launchUiButtonClickProcess: noop,
    },
    readForm: noop,
    writeForm: noop,
    listenToDataLocation: noop,
    listenToOafEvents: noop,
    events: stubEventEmitter,
    getElementMeta: async () => ({}),
  };
}
