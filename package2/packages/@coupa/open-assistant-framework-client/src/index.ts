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

      /** Same browser tab: top frame, then link fallback, then iframe location. */
      const navigateSameBrowserTab = (url: string): boolean => {
        if (typeof window === 'undefined') return false;
        try {
          window.open(url, '_top');
          return true;
        } catch {
          /* ignore */
        }
        try {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_top';
          a.rel = 'opener';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return true;
        } catch {
          /* ignore */
        }
        try {
          window.top!.location.href = url;
          return true;
        } catch {
          /* cross-origin top: fall back to navigating this frame */
        }
        try {
          window.location.assign(url);
          return true;
        } catch {
          return false;
        }
      };

      // Stub: approximate official client by loading the tenant URL in the same tab (_top / iframe).
      if (embedded) {
        if (tenantDomain && typeof window !== 'undefined') {
          const url = `https://${tenantDomain}${normalizedPath}`;
          if (navigateSameBrowserTab(url)) {
            return {
              status: 'success',
              message: `Navigating ${url} in this tab (stub SDK; Coupa bundle uses host OAF APIs).`,
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
            ? `Could not navigate to ${hintUrl}. Try again from a direct click, or install Coupa's OAF client in package2/packages/@coupa/open-assistant-framework-client.`
            : 'Missing coupahost (?coupahost= or VITE_COUPA_DEFAULT_HOST), or install the Coupa OAF client package.',
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
