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
      // Never assign window.location inside Coupa's iframe: it only replaces the iframe and
      // does not drive the parent SPA. Parent navigation requires Coupa's real OAF client.
      if (embedded) {
        console.warn(
          '[OAF STUB] navigateToPath skipped in iframe (parent nav needs official Coupa client):',
          normalizedPath
        );
        return {
          status: 'failure',
          message:
            'Local stub cannot navigate the Coupa parent. Replace packages/@coupa/open-assistant-framework-client with the official artifact from your Coupa BYOA bundle.',
        };
      }
      if (typeof window !== 'undefined') {
        const domain = String(config?.coupahost || '')
          .replace(/^https?:\/\//i, '')
          .replace(/\/+$/, '');
        const host = domain ? `https://${domain}` : 'https://ey-in-demo.coupacloud.com';
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
