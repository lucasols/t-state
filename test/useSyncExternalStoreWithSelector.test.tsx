/* eslint-disable */
import { act, render } from '@testing-library/react';
import { Component, memo, useCallback } from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { deepEqual } from '../src/deepEqual';
import { useSyncExternalStoreWithSelector } from '../src/useSyncExternalStoreWithSelector';

// This tests shared behavior between the built-in and shim implementations of
// of useSyncExternalStore.
describe('Shared useSyncExternalStore behavior (shim and built-in)', () => {
  function Text({
    text,
    logger,
  }: {
    text: string | undefined;
    logger: ReturnType<typeof createLogger>;
  }) {
    logger?.log(text);
    return <>{text}</>;
  }

  function createExternalStore<T>(initialState: T) {
    const listeners = new Set<() => void>();
    let currentState = initialState;
    return {
      set(text: T) {
        currentState = text;

        listeners.forEach((listener) => listener());
      },
      subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
      getState() {
        return currentState;
      },
      getSubscriberCount() {
        return listeners.size;
      },
    };
  }

  function createLogger() {
    let logs: (string | undefined)[] = [];
    return {
      log: (msg: string | undefined) => logs.push(msg),
      getLogs: () => logs,
      reset: () => (logs = []),
    };
  }

  describe('extra features implemented in user-space', () => {
    test('memoized selectors are only called once per update', async () => {
      const store = createExternalStore({ a: 0, b: 0 });
      const logger = createLogger();

      function selector(state: { a: number }) {
        logger.log('Selector');
        return state.a;
      }

      function App() {
        logger.log('APP');
        const a = useSyncExternalStoreWithSelector(
          store.subscribe,
          store.getState,
          null,
          selector,
        );
        return <Text text={'A' + a} logger={logger} />;
      }

      const { container } = render(<App />);

      expect(logger.getLogs()).toEqual(['APP', 'Selector', 'A0']);

      expect(container.textContent).toEqual('A0');

      logger.reset();

      // Update the store
      act(() => {
        store.set({ a: 1, b: 0 });
      });

      expect(logger.getLogs()).toEqual(['Selector', 'APP', 'A1']);

      expect(container.textContent).toEqual('A1');
    });

    test('Using isEqual to bailout', async () => {
      const store = createExternalStore({ a: 0, b: 0 });
      const logger = createLogger();

      function A() {
        const { a } = useSyncExternalStoreWithSelector(
          store.subscribe,
          store.getState,
          null,
          (state) => ({ a: state.a }),
          (state1, state2) => state1.a === state2.a,
        );
        return <Text text={'A' + a} logger={logger} />;
      }
      function B() {
        const { b } = useSyncExternalStoreWithSelector(
          store.subscribe,
          store.getState,
          null,
          (state) => {
            return { b: state.b };
          },
          (state1, state2) => state1.b === state2.b,
        );
        return <Text text={'B' + b} logger={logger} />;
      }

      function App() {
        return (
          <>
            <A />
            <B />
          </>
        );
      }

      const { container } = render(<App />);

      expect(logger.getLogs()).toEqual(['A0', 'B0']);

      expect(container.textContent).toEqual('A0B0');

      logger.reset();

      // Update b but not a
      act(() => {
        store.set({ a: 0, b: 1 });
      });

      expect(logger.getLogs()).toEqual(['B1']);

      expect(container.textContent).toEqual('A0B1');

      logger.reset();

      // Update a but not b
      act(() => {
        store.set({ a: 1, b: 1 });
      });
      // Only a re-renders

      expect(logger.getLogs()).toEqual(['A1']);

      expect(container.textContent).toEqual('A1B1');
    });

    test('compares selection to rendered selection even if selector changes', async () => {
      const store = createExternalStore({ items: ['A', 'B'] });
      const logger = createLogger();

      const shallowEqualArray = (a: any[], b: any[]) => {
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i]) {
            return false;
          }
        }
        return true;
      };

      const List = memo(({ items }: { items: string[] }) => {
        return (
          <ul>
            {items.map((text) => (
              <li key={text}>
                <Text key={text} text={text} logger={logger} />
              </li>
            ))}
          </ul>
        );
      });

      function App({ step }: { step: number }) {
        const inlineSelector = (state: { items: string[] }) => {
          logger.log('Inline selector');
          return [...state.items, 'C'];
        };
        const items = useSyncExternalStoreWithSelector(
          store.subscribe,
          store.getState,
          null,
          inlineSelector,
          shallowEqualArray,
        );
        return (
          <>
            <List items={items} />
            <Text text={'Sibling: ' + step} logger={logger} />
          </>
        );
      }

      const { rerender } = render(<App step={0} />);

      expect(logger.getLogs()).toEqual([
        'Inline selector',
        'A',
        'B',
        'C',
        'Sibling: 0',
      ]);

      logger.reset();

      rerender(<App step={1} />);

      expect(logger.getLogs()).toEqual([
        // We had to call the selector again because it's not memoized
        'Inline selector',

        // But because the result was the same (according to isEqual) we can
        // bail out of rendering the memoized list. These are skipped:
        // 'A',
        // 'B',
        // 'C',

        'Sibling: 1',
      ]);
    });

    describe('selector and isEqual error handling in extra', () => {
      let ErrorBoundary: typeof Component;

      let logger: ReturnType<typeof createLogger> | null = null;

      beforeEach(() => {
        logger = createLogger();

        ErrorBoundary = class extends Component<{ children: React.ReactNode }> {
          state: {
            error: Error | null;
          } = { error: null };
          static getDerivedStateFromError(error: Error) {
            return { error };
          }
          render() {
            if (this.state.error) {
              return <Text text={this.state.error.message} logger={logger!} />;
            }
            return this.props.children;
          }
        };
      });

      test('selector can throw on update', async () => {
        const store = createExternalStore<{
          a?: string;
        }>({ a: 'a' });
        const selector = (state: { a?: string }) => {
          if (typeof state.a !== 'string') {
            throw new TypeError('Malformed state');
          }
          return state.a.toUpperCase();
        };

        function App() {
          const a = useSyncExternalStoreWithSelector(
            store.subscribe,
            store.getState,
            null,
            selector,
          );
          return <Text text={a} logger={logger!} />;
        }

        const { container } = render(
          <ErrorBoundary>
            <App />
          </ErrorBoundary>,
        );

        expect(container.textContent).toEqual('A');

        act(() => {
          store.set({});
        });

        expect(container.textContent).toEqual('Malformed state');
      });

      test('isEqual can throw on update', async () => {
        const store = createExternalStore<{
          a?: string;
        }>({ a: 'A' });

        const isEqual = (left: any, right: any) => {
          if (typeof left.a !== 'string' || typeof right.a !== 'string') {
            throw new TypeError('Malformed state');
          }
          return left.a.trim() === right.a.trim();
        };

        function App() {
          const a = useSyncExternalStoreWithSelector(
            store.subscribe,
            store.getState,
            null,
            (state) => state.a,
            isEqual,
          );
          return <Text text={a} logger={logger!} />;
        }

        const { container } = render(
          <ErrorBoundary>
            <App />
          </ErrorBoundary>,
        );

        expect(container.textContent).toEqual('A');

        act(() => {
          store.set({});
        });

        expect(container.textContent).toEqual('Malformed state');
      });
    });
  });

  test('if prevSnapshot and nextSnapshot are not equal, but selector is equal, skip selector and isEqual call in next updates', () => {
    const store = createExternalStore({ a: 0, b: 0 });
    const logger = createLogger();

    const selector = (state: { a: number; b: number }): { a: number } => {
      logger.log('Selector');
      return { a: state.a };
    };
    const isStateEqual = (
      state1: { a: number },
      state2: { a: number },
    ): boolean => {
      logger.log('isEqual');
      return deepEqual(state1, state2);
    };

    function A() {
      const { a } = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
        isStateEqual,
      );
      return <Text text={'A' + a} logger={logger} />;
    }

    const { container, rerender } = render(<A />);

    expect(logger.getLogs()).toEqual(['Selector', 'A0']);

    expect(container.textContent).toEqual('A0');

    logger.reset();

    // Update b but not a
    act(() => {
      store.set({ a: 0, b: 1 });
    });
    // Only a re-renders

    expect(logger.getLogs()).toEqual(['Selector', 'isEqual']);

    expect(container.textContent).toEqual('A0');

    logger.reset();

    rerender(<A />);
    rerender(<A />);
    rerender(<A />);

    expect(logger.getLogs()).toEqual(['A0', 'A0', 'A0']);

    logger.reset();

    // Update a but not b

    act(() => {
      store.set({ a: 1, b: 1 });
    });

    expect(logger.getLogs()).toEqual(['Selector', 'isEqual', 'A1']);
    expect(container.textContent).toEqual('A1');
  });

  test('Selected result should change when selector changes', () => {
    const store = createExternalStore({ b: 0 });
    const logger = createLogger();

    function App({ a }: { a: number }) {
      const selector = useCallback(
        (state: { b: number }) => {
          logger.log('Selector');
          return state.b + a;
        },
        [a],
      );

      const result = useSyncExternalStoreWithSelector(
        store.subscribe,
        store.getState,
        null,
        selector,
      );
      return <Text text={result.toString()} logger={logger} />;
    }

    const { container, rerender } = render(<App a={0} />);

    expect(logger.getLogs()).toEqual(['Selector', '0']);

    expect(container.textContent).toEqual('0');

    logger.reset();

    // Update b but not a

    act(() => {
      store.set({ b: 1 });
    });

    expect(logger.getLogs()).toEqual(['Selector', '1']);

    expect(container.textContent).toEqual('1');

    logger.reset();

    // Update a but not b

    rerender(<App a={1} />);

    expect(logger.getLogs()).toEqual(['Selector', '2']);

    expect(container.textContent).toEqual('2');
  });
});
