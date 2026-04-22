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
      console.log('[OAF STUB] navigateToPath called with:', path);
      if (typeof window !== 'undefined') {
        const host = 'https://ey-in-demo.coupacloud.com';
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
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
