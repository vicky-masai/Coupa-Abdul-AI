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
  getPageContext?: () => Promise<any>;
  getUserContext?: () => Promise<any>;
  navigateToPath?: (path: string) => Promise<any>;
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

      const tryOpenInNewTab = (url: string): boolean => {
        if (typeof window === 'undefined') return false;
        try {
          const w = window.open(url, '_blank', 'noopener,noreferrer');
          if (w) return true;
        } catch {
          /* ignore */
        }
        try {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          return true;
        } catch {
          return false;
        }
      };

      // Stub cannot drive the Coupa parent SPA from a cross-origin iframe (needs official client).
      // Dev fallback: open the tenant URL in a new tab so the path is reachable without replacing the iframe.
      if (embedded) {
        if (tenantDomain && typeof window !== 'undefined') {
          const url = `https://${tenantDomain}${normalizedPath}`;
          if (tryOpenInNewTab(url)) {
            return {
              status: 'success',
              message: `Stub: opened ${url} in a new tab. For navigation inside the same Coupa window, replace this folder with the official BYOA client bundle from Coupa (not published on npm).`,
            };
          }
        }
        const hintUrl =
          tenantDomain && typeof window !== 'undefined'
            ? `https://${tenantDomain}${normalizedPath}`
            : '';
        console.warn(
          '[OAF STUB] navigateToPath in iframe (popup blocked or missing/invalid coupahost):',
          normalizedPath,
          hintUrl || '(no tenant URL)'
        );
        return {
          status: 'failure',
          message: hintUrl
            ? `Stub: popup blocked — allow popups for this site, or open: ${hintUrl}. For in-window navigation, use Coupa's official OAF client (replace packages/@coupa/open-assistant-framework-client).`
            : 'Stub: coupahost is missing (add ?coupahost=your-tenant.coupacloud.com or VITE_COUPA_DEFAULT_HOST), or use Coupa official OAF client for parent navigation.',
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
