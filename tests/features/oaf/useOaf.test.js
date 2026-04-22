import { renderHook, act } from '@testing-library/react';
import { useContext } from 'react';
import { useOaf } from '../../../src/features/oaf/useOaf.js';

// Mock all dependencies
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: jest.fn(),
}));

jest.mock('../../../src/features/oaf/OafContext.jsx', () => ({
  OafContext: {},
}));

jest.mock('../../../src/features/oaf/oafClient', () => ({
  navigatePath: jest.fn(),
  openEasyForm: jest.fn(),
  readForm: jest.fn(),
  writeForm: jest.fn(),
  subscribeToLocation: jest.fn(),
  subscribeToEvents: jest.fn(),
  getPageContext: jest.fn(),
  getUserContext: jest.fn(),
  getElementMeta: jest.fn(),
  launchUiButtonClickProcess: jest.fn(),
  ensureOafClient: jest.fn(() => Promise.resolve()),
  getOafAppEventsSync: jest.fn(),
  moveAndResize: jest.fn(),
}));

jest.mock('../../../src/features/oaf/oafUtils.js', () => ({
  closeCalculator: jest.fn(),
  handleOAFResizeOperation: jest.fn(),
  dockLeftCalculator: jest.fn(),
  dockRightCalculator: jest.fn(),
  sidePanelCalculator: jest.fn(),
  maximizeCalculator: jest.fn(),
  minimizeCalculator: jest.fn(),
  oafExecuteAction: jest.fn(),
}));

// Import mocked modules to access them in tests
import {
  navigatePath,
  openEasyForm,
  readForm,
  writeForm,
  subscribeToLocation,
  ensureOafClient,
  getOafAppEventsSync,
} from '../../../src/features/oaf/oafClient.js';

import {
  closeCalculator,
  handleOAFResizeOperation,
  dockLeftCalculator,
  dockRightCalculator,
  sidePanelCalculator,
  maximizeCalculator,
  minimizeCalculator,
  oafExecuteAction,
} from '../../../src/features/oaf/oafUtils.js';

describe('useOaf', () => {
  const mockDispatch = jest.fn();
  const mockOafEvents = {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  };

  const mockContext = {
    state: {
      currLayoutPosition: 'maximized',
      currLayoutState: 'maximized',
      prevLayoutState: null,
      isVisible: true,
      response: null,
      error: null,
    },
    dispatch: mockDispatch,
  };

  beforeEach(() => {
    useContext.mockReturnValue(mockContext);
    getOafAppEventsSync.mockReturnValue(mockOafEvents);
    ensureOafClient.mockResolvedValue(undefined);
    oafExecuteAction.mockImplementation(fn => fn());
    handleOAFResizeOperation.mockResolvedValue();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('throws error when used outside OafProvider', () => {
    useContext.mockReturnValue(null);

    expect(() => {
      renderHook(() => useOaf());
    }).toThrow('useOaf must be used within an OafProvider');
  });

  test('returns state from context', () => {
    const { result } = renderHook(() => useOaf());

    expect(result.current.currLayoutPosition).toBe('maximized');
    expect(result.current.isVisible).toBe(true);
    expect(result.current.error).toBe(null);
  });

  test('returns all expected action functions', () => {
    const { result } = renderHook(() => useOaf());

    expect(typeof result.current.expandApp).toBe('function');
    expect(typeof result.current.minimiseApp).toBe('function');
    expect(typeof result.current.makeAppSidepanel).toBe('function');
    expect(typeof result.current.dockAppToLeft).toBe('function');
    expect(typeof result.current.dockAppToRight).toBe('function');
    expect(typeof result.current.oafNavigatePath).toBe('function');
    expect(typeof result.current.oafOpenEasyForm).toBe('function');
    expect(typeof result.current.oafReadForm).toBe('function');
    expect(typeof result.current.oafWriteForm).toBe('function');
    expect(typeof result.current.closeApp).toBe('function');
    expect(typeof result.current.oafSubscribeToLocation).toBe('function');
  });

  test('returns oafAppEvents object', async () => {
    const { result } = renderHook(() => useOaf());

    expect(result.current.oafAppEvents).toBe(mockOafEvents);
    expect(getOafAppEventsSync).toHaveBeenCalled();
    await act(async () => {
      await Promise.resolve();
    });
    expect(ensureOafClient).toHaveBeenCalled();
  });

  describe('Layout Operations', () => {
    test('dockAppToLeft calls handleOAFResizeOperation with correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.dockAppToLeft();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        dockLeftCalculator,
        'docked-left',
        'maximized'
      );
    });

    test('dockAppToRight calls handleOAFResizeOperation with correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.dockAppToRight();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        dockRightCalculator,
        'docked-right',
        'maximized'
      );
    });

    test('maximiseApp calls handleOAFResizeOperation with correct parameters', async () => {
      // Set up context where app is not already maximized
      useContext.mockReturnValue({
        state: {
          currLayoutPosition: 'docked-left',
          currLayoutState: 'minimized',
          prevLayoutState: null,
          isVisible: true,
          response: null,
          error: null,
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.maximiseApp();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        maximizeCalculator,
        'docked-left',
        'maximized'
      );
    });

    test('minimiseApp calls handleOAFResizeOperation with correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.minimiseApp();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        minimizeCalculator,
        'maximized',
        'minimized'
      );
    });

    test('makeAppSidepanel calls handleOAFResizeOperation with correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.makeAppSidepanel();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        sidePanelCalculator,
        'maximized',
        'side-panel'
      );
    });

    test('closeApp calls handleOAFResizeOperation with correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.closeApp();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        closeCalculator,
        'maximized',
        'maximized'
      );
    });
  });

  describe('OAF Client Operations', () => {
    test('oafNavigatePath calls oafExecuteAction with navigatePath', async () => {
      const { result } = renderHook(() => useOaf());
      const testPath = '/test-path';

      await act(async () => {
        await result.current.oafNavigatePath(testPath);
      });

      expect(oafExecuteAction).toHaveBeenCalledWith(expect.any(Function));
      expect(navigatePath).toHaveBeenCalledWith(testPath);
    });

    test('oafOpenEasyForm calls oafExecuteAction with openEasyForm', async () => {
      const { result } = renderHook(() => useOaf());
      const testFormId = 'test-form-123';

      await act(async () => {
        await result.current.oafOpenEasyForm(testFormId);
      });

      expect(oafExecuteAction).toHaveBeenCalledWith(expect.any(Function));
      expect(openEasyForm).toHaveBeenCalledWith(testFormId);
    });

    test('oafReadForm calls oafExecuteAction with readForm', async () => {
      const { result } = renderHook(() => useOaf());
      const testMetadata = { formId: 'test', fields: ['field1'] };

      await act(async () => {
        await result.current.oafReadForm(testMetadata);
      });

      expect(oafExecuteAction).toHaveBeenCalledWith(expect.any(Function));
      expect(readForm).toHaveBeenCalledWith(testMetadata);
    });

    test('oafWriteForm calls oafExecuteAction with writeForm', async () => {
      const { result } = renderHook(() => useOaf());
      const testData = { field1: 'value1', field2: 'value2' };

      await act(async () => {
        await result.current.oafWriteForm(testData);
      });

      expect(oafExecuteAction).toHaveBeenCalledWith(expect.any(Function));
      expect(writeForm).toHaveBeenCalledWith(testData);
    });

    test('oafSubscribeToLocation calls oafExecuteAction with subscribeToLocation', async () => {
      const { result } = renderHook(() => useOaf());
      const testSubscriptionData = {
        location: 'test-location',
        attributes: ['attr1'],
      };

      await act(async () => {
        await result.current.oafSubscribeToLocation(testSubscriptionData);
      });

      expect(oafExecuteAction).toHaveBeenCalledWith(expect.any(Function));
      expect(subscribeToLocation).toHaveBeenCalledWith(testSubscriptionData);
    });
  });

  describe('Error Handling', () => {
    test('handles errors in layout operations gracefully', async () => {
      handleOAFResizeOperation.mockRejectedValue(new Error('Resize failed'));

      const { result } = renderHook(() => useOaf());

      await expect(async () => {
        await act(async () => {
          await result.current.dockAppToLeft();
        });
      }).rejects.toThrow('Resize failed');
    });

    test('handles errors in OAF client operations gracefully', async () => {
      oafExecuteAction.mockRejectedValue(new Error('Navigation failed'));

      const { result } = renderHook(() => useOaf());

      await expect(async () => {
        await act(async () => {
          await result.current.oafNavigatePath('/test');
        });
      }).rejects.toThrow('Navigation failed');
    });
  });

  describe('Integration', () => {
    test('all async operations return promises', async () => {
      const { result } = renderHook(() => useOaf());

      const operations = [
        result.current.dockAppToLeft(),
        result.current.dockAppToRight(),
        result.current.maximiseApp(),
        result.current.minimiseApp(),
        result.current.makeAppSidepanel(),
        result.current.closeApp(),
        result.current.oafNavigatePath('/test'),
        result.current.oafOpenEasyForm('form1'),
        result.current.oafReadForm({}),
        result.current.oafWriteForm({}),
        result.current.oafSubscribeToLocation({}),
      ];

      // All should be promises
      operations.forEach(operation => {
        expect(operation).toBeInstanceOf(Promise);
      });

      // All should resolve successfully
      await act(async () => {
        await Promise.all(operations);
      });
    });

    test('functions work consistently across re-renders', async () => {
      const { result, rerender } = renderHook(() => useOaf());

      // Test functions work before rerender
      await act(async () => {
        await result.current.closeApp();
      });
      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        closeCalculator,
        'maximized',
        'maximized'
      );

      rerender();

      // Test functions still work after rerender
      await act(async () => {
        await result.current.minimiseApp();
      });
      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        minimizeCalculator,
        'maximized',
        'minimized'
      );

      // Test async functions still work after rerender
      await act(async () => {
        await result.current.maximiseApp();
      });
      expect(handleOAFResizeOperation).toHaveBeenCalled();
    });
  });

  describe('Layout Function Integration Tests', () => {
    test('layout functions use correct calculators and parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.dockAppToLeft();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        dockLeftCalculator,
        'docked-left',
        'maximized'
      );
    });

    test('maximiseApp uses correct state management', async () => {
      // Set up context where app is not already maximized
      useContext.mockReturnValue({
        state: {
          currLayoutPosition: 'docked-left',
          currLayoutState: 'minimized',
          prevLayoutState: null,
          isVisible: true,
          response: null,
          error: null,
        },
        dispatch: mockDispatch,
      });

      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.maximiseApp();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        maximizeCalculator,
        'docked-left',
        'maximized'
      );
    });

    test('makeAppSidepanel passes correct parameters', async () => {
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        await result.current.makeAppSidepanel();
      });

      expect(handleOAFResizeOperation).toHaveBeenCalledWith(
        mockDispatch,
        sidePanelCalculator,
        'maximized',
        'side-panel'
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('handles layout function errors gracefully', async () => {
      handleOAFResizeOperation.mockRejectedValue(new Error('Resize failed'));
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        try {
          await result.current.maximiseApp();
        } catch (error) {
          expect(error.message).toBe('Resize failed');
        }
      });
    });

    test('handles Coupa integration function errors gracefully', async () => {
      oafExecuteAction.mockRejectedValue(new Error('Navigation failed'));
      const { result } = renderHook(() => useOaf());

      await act(async () => {
        try {
          await result.current.oafNavigatePath('/suppliers');
        } catch (error) {
          expect(error.message).toBe('Navigation failed');
        }
      });
    });
  });

  describe('Hook Stability and Performance', () => {
    test('functions work correctly across renders', () => {
      const { result, rerender } = renderHook(() => useOaf());

      // Test that functions exist before rerender
      expect(typeof result.current.dockAppToLeft).toBe('function');
      expect(typeof result.current.maximiseApp).toBe('function');
      expect(typeof result.current.oafNavigatePath).toBe('function');

      rerender();

      // Functions should still exist and be callable after rerender
      expect(typeof result.current.dockAppToLeft).toBe('function');
      expect(typeof result.current.maximiseApp).toBe('function');
      expect(typeof result.current.oafNavigatePath).toBe('function');
    });

    test('state destructuring works correctly', () => {
      const { result } = renderHook(() => useOaf());

      // Should be able to destructure state properties
      const { currLayoutPosition, isVisible, error, dockAppToLeft } =
        result.current;

      expect(currLayoutPosition).toBe('maximized');
      expect(isVisible).toBe(true);
      expect(error).toBe(null);
      expect(typeof dockAppToLeft).toBe('function');
    });
  });
});
