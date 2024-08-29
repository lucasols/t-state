import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
} from '@testing-library/react';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Store, shallowEqual } from '../src/main';

// eslint-disable-next-line @typescript-eslint/naming-convention
type anyFunction = () => any;

afterEach(() => {
  cleanup();
});

describe('hooks', () => {
  describe('useKey', () => {
    type TestState = {
      numOfClicks: number;
      obj: {
        test: boolean;
      };
    };

    const initialState = {
      numOfClicks: 0,
      obj: {
        test: true,
      },
    };

    let testState = new Store<TestState>({
      debugName: 'test',
      state: initialState,
    });

    const Component = ({ onRender }: { onRender?: anyFunction }) => {
      const numOfClicks = testState.useKey('numOfClicks');

      if (onRender) {
        onRender();
      }

      return (
        <button
          type="button"
          onClick={() =>
            testState.setKey('numOfClicks', (current) => current + 1)
          }
        >
          Num of clicks: {numOfClicks}
        </button>
      );
    };

    beforeEach(() => {
      testState = new Store<TestState>({
        debugName: 'test',
        state: initialState,
      });
    });

    test('get value from store and update when its changes', () => {
      const { getByRole } = render(<Component />);

      const button = getByRole('button');
      expect(button).toHaveTextContent('Num of clicks: 0');

      fireEvent.click(button);
      expect(button).toHaveTextContent('Num of clicks: 1');

      fireEvent.click(button);
      expect(button).toHaveTextContent('Num of clicks: 2');

      expect(testState.state.numOfClicks).toBe(2);
    });

    test('update all components if setState is called from anywhere', () => {
      const AnotherComponent = () => {
        const numOfClicks = testState.useKey('numOfClicks');

        return <div data-testid="another-component">{numOfClicks}</div>;
      };

      const { getByRole, getByTestId } = render(
        <>
          <Component />
          <AnotherComponent />
        </>,
      );

      const button = getByRole('button');
      const anotherComponent = getByTestId('another-component');

      expect(button).toHaveTextContent('Num of clicks: 0');
      expect(anotherComponent).toHaveTextContent('0');

      fireEvent.click(button);
      expect(button).toHaveTextContent('Num of clicks: 1');
      expect(anotherComponent).toHaveTextContent('1');

      act(() => {
        testState.setKey('numOfClicks', 42);
      });

      expect(button).toHaveTextContent('Num of clicks: 42');
      expect(anotherComponent).toHaveTextContent('42');
    });

    test('when a component unmounts, the store removes its reference', () =>
      new Promise<void>((done) => {
        const consoleError = vi.spyOn(global.console, 'error');

        const { getByRole, unmount } = render(<Component />);

        const button = getByRole('button');
        expect(button).toHaveTextContent('Num of clicks: 0');

        fireEvent.click(button);
        expect(button).toHaveTextContent('Num of clicks: 1');

        unmount();

        act(() => {
          testState.setKey('numOfClicks', 100);
        });

        expect(consoleError).not.toHaveBeenCalled();
        done();
      }));

    test('not render when the new key value is the same (shallow equality)', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      const { getByRole } = render(<Component onRender={onRender} />);

      const button = getByRole('button');

      expect(button).toHaveTextContent('Num of clicks: 0');

      act(() => {
        testState.setKey('numOfClicks', 0);
      });
      act(() => {
        testState.setKey('numOfClicks', 0);
      });

      act(() => {
        testState.setKey('numOfClicks', 1);
      });
      act(() => {
        testState.setKey('numOfClicks', 1);
      });
      act(() => {
        testState.setKey('numOfClicks', 1);
      });

      expect(onRender).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSlice', () => {
    type TestState = {
      key1: number;
      key2: string;
      key3: number[];
      key4: number[];
    };

    const initialState = {
      key1: 1,
      key2: '👍',
      key3: [0, 1, 2],
      key4: [0, 1, 2],
    };

    let testState: Store<TestState>;

    const Component = ({ onRender }: { onRender?: anyFunction }) => {
      const { key1, key2, key3 } = testState.useSlice(
        ['key1', 'key2', 'key3'],
        { equalityFn: shallowEqual },
      );

      if (onRender) {
        onRender();
      }

      return (
        <button
          type="button"
          onClick={() => testState.setKey('key1', key1 + 1)}
        >
          number: {key1}, string: {key2}, array: {JSON.stringify(key3)}
        </button>
      );
    };

    beforeEach(() => {
      testState = new Store<TestState>({
        debugName: 'test',
        state: initialState,
      });
    });

    test('get all values from store and updates when some of then changes', () => {
      const { getByRole } = render(<Component />);

      const button = getByRole('button');
      expect(button).toHaveTextContent('number: 1, string: 👍, array: [0,1,2]');

      fireEvent.click(button);
      expect(button).toHaveTextContent('number: 2, string: 👍, array: [0,1,2]');

      act(() => {
        testState.setKey('key2', '🆕');
      });

      expect(button).toHaveTextContent('number: 2, string: 🆕, array: [0,1,2]');

      act(() => {
        testState.setKey('key3', [3, 4, 5]);
      });

      expect(button).toHaveTextContent('number: 2, string: 🆕, array: [3,4,5]');
    });

    test('update all components if setState is called from anywhere', () => {
      const AnotherComponent = () => {
        const { key1, key4 } = testState.useSlice('key4', 'key1');

        return (
          <div data-testid="another-component">
            {key1}, {key4.join('-')}
          </div>
        );
      };

      const { getByRole, getByTestId } = render(
        <>
          <Component />
          <AnotherComponent />
        </>,
      );

      const button = getByRole('button');
      const anotherComponent = getByTestId('another-component');

      expect(button).toHaveTextContent('number: 1, string: 👍, array: [0,1,2]');
      expect(anotherComponent).toHaveTextContent('1, 0-1-2');

      fireEvent.click(button);

      expect(button).toHaveTextContent('number: 2, string: 👍, array: [0,1,2]');
      expect(anotherComponent).toHaveTextContent('2, 0-1-2');

      act(() => {
        testState.setKey('key1', 42);
      });

      expect(button).toHaveTextContent(
        'number: 42, string: 👍, array: [0,1,2]',
      );
      expect(anotherComponent).toHaveTextContent('42, 0-1-2');
    });

    test('when a component unmounts, the store removes its reference', () =>
      new Promise<void>((done) => {
        const consoleError = vi.spyOn(global.console, 'error');

        const { getByRole, unmount } = render(<Component />);

        const button = getByRole('button');
        expect(button).toHaveTextContent(
          'number: 1, string: 👍, array: [0,1,2]',
        );

        fireEvent.click(button);
        expect(button).toHaveTextContent(
          'number: 2, string: 👍, array: [0,1,2]',
        );

        unmount();

        act(() => {
          testState.setKey('key1', 100);
        });

        expect(consoleError).not.toHaveBeenCalled();
        done();
      }));

    test('not render when the new key values are the same (shallow equality)', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      const { getByRole } = render(<Component onRender={onRender} />);

      const button = getByRole('button');

      expect(button).toHaveTextContent('number: 1, string: 👍, array: [0,1,2]');

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.produceState((draft) => {
          draft.key1 = 1;
          draft.key2 = '👍';
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(0);
    });

    test('produceState only result in one render', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      const { getByRole } = render(<Component onRender={onRender} />);

      const button = getByRole('button');

      expect(button).toHaveTextContent('number: 1, string: 👍, array: [0,1,2]');

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = 'new text';
          draft.key1 = 42;
        });
      });

      expect(button).toHaveTextContent(
        'number: 42, string: new text, array: [0,1,2]',
      );

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = 'new text';
          draft.key1 = 42;
        });
      });

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = 'new text';
          draft.key1 = 42;
        });
      });

      expect(onRender).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('useSelector', () => {
    type TestState = {
      key1: number;
      key2: string;
      key3: number[];
      key4: number[];
    };

    const initialState = {
      key1: 1,
      key2: '👍',
      key3: [0, 1, 2],
      key4: [0, 1, 2],
    };

    let testState: Store<TestState>;

    const Component = ({
      onRender,
      useShallowEqual,
      children,
    }: {
      onRender?: anyFunction;
      useShallowEqual?: boolean;
      children?: ReactNode;
    }) => {
      const sum = testState.useSelector(
        (state) => state.key1 + state.key3[0]!,
        {
          equalityFn: useShallowEqual ? undefined : false,
        },
      );

      useEffect(() => {
        if (onRender) {
          onRender();
        }
      });

      return (
        <>
          <button
            type="button"
            onClick={() => testState.setKey('key1', sum + 1)}
          >
            {sum}
          </button>
          {children}
        </>
      );
    };

    beforeEach(() => {
      testState = new Store<TestState>({
        debugName: 'test',
        state: initialState,
      });
    });

    test('get all values from store and updates when some of then changes', () => {
      const { getByRole } = render(<Component />);

      const button = getByRole('button');
      expect(button).toHaveTextContent('1');

      fireEvent.click(button);
      expect(button).toHaveTextContent('2');

      act(() => {
        testState.setKey('key3', [2]);
      });

      expect(button).toHaveTextContent('4');
    });

    test('not render when the the returned values are the same', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      const { getByRole } = render(<Component onRender={onRender} />);

      const button = getByRole('button');

      expect(button).toHaveTextContent('1');

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = '👍';
          draft.key1 = 1;
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(2);
    });

    test('shallow equality check disabled', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      const Component2 = () => {
        const state = testState.useSelector((s) => s, { equalityFn: false });

        onRender(state.key1, state.key2, state.key3);

        return <div data-testid="another-component">{state.key1}</div>;
      };

      const { getByTestId } = render(<Component2 />);

      const div = getByTestId('another-component');

      expect(div).toHaveTextContent('1');

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = '👍';
          draft.key1 = 1;
        });
      });

      expect(onRender).toHaveBeenCalledTimes(3);
      expect(mockSubscriber).toHaveBeenCalledTimes(2);
    });

    test('not render when the equality function return true', () => {
      const onRender = vi.fn();
      const mockSubscriber = vi.fn();

      const Component2 = () => {
        const state = testState.useSelector((s) => s, {
          equalityFn: (_, current) => current.key1 === 1,
        });

        onRender();

        return <div data-testid="another-component">{state.key1}</div>;
      };

      testState.subscribe(mockSubscriber);

      const { getByTestId } = render(<Component2 />);

      const div = getByTestId('another-component');

      expect(div).toHaveTextContent('1');

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.setKey('key1', 1);
      });
      act(() => {
        testState.setKey('key3', [0]);
      });
      act(() => {
        testState.setKey('key2', '👍');
      });

      act(() => {
        testState.produceState((draft) => {
          draft.key2 = '👍';
          draft.key1 = 1;
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(2);
    });

    test('update selector if selector deps change', () => {
      const mockSubscriber = vi.fn();
      testState.subscribe(mockSubscriber);
      let idCounter = 1;

      const Component3 = () => {
        const [selectorDep, setselectorDep] = useState(1);

        const selector = useCallback(
          (s: TestState) => {
            return {
              value: selectorDep + s.key1,
            };
          },
          [selectorDep],
        );

        const id = useRef(idCounter++);
        const state = testState.useSelector(selector, {
          useExternalDeps: true,
        });

        return (
          <div>
            <span data-testid="another-component">{state.value}</span>
            <span data-testid="id-component" onClick={() => setselectorDep(2)}>
              {id.current}
            </span>
          </div>
        );
      };

      const { getByTestId } = render(<Component3 />);
      expect(getByTestId('another-component')).toHaveTextContent('2');

      fireEvent.click(getByTestId('id-component'));
      expect(getByTestId('another-component')).toHaveTextContent('3');

      act(() => {
        testState.setKey('key1', 2);
      });
      act(() => {
        testState.setKey('key1', 2);
      });

      expect(getByTestId('another-component')).toHaveTextContent('4');
      expect(getByTestId('id-component')).toHaveTextContent('1');

      expect(mockSubscriber).toHaveBeenCalledTimes(1);
    });

    test('bailout batched updates', () => {
      const onRenderParent = vi.fn();
      const onRenderChild = vi.fn();
      const mockSubscriber = vi.fn();

      function useTestState() {
        return testState.useSelector((state) => state.key1 + state.key3[0]!);
      }

      const Parent = () => {
        const sum = testState.useSelector(
          (state) => state.key1 + state.key3[0]!,
        );
        const sum2 = testState.useSelector(
          (state) => state.key1 + state.key3[1]!,
        );
        const sum3 = testState.useSelector(
          (state) => state.key1 + state.key3[2]!,
        );
        const sum4 = testState.useSelector(
          (state) => state.key1 + state.key3[0]!,
        );
        const sum5 = useTestState();

        onRenderParent();

        return (
          <>
            <div data-testid="parent-value">
              {sum} + {sum2} + {sum3} + {sum4} + {sum5}
            </div>
            <div>
              <Component onRender={onRenderChild} />
            </div>
          </>
        );
      };

      testState.subscribe(mockSubscriber);

      const { getByTestId } = render(<Parent />);

      const sumValue = getByTestId('parent-value');

      expect(sumValue).toHaveTextContent('1 + 2 + 3 + 1 + 1');

      act(() => {
        testState.setKey('key1', 3);
      });

      expect(onRenderParent).toHaveBeenCalledTimes(2);
      expect(onRenderChild).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenCalledTimes(1);
    });

    test('update while render is reflected in component', () => {
      const Component2 = () => {
        useEffect(() => {
          testState.produceState((state) => {
            state.key1 = 98;
          });
        }, []);

        return <div />;
      };

      const { getByRole } = render(
        <>
          <Component2 />
          <Component />
        </>,
      );

      const button = getByRole('button');

      expect(button).toHaveTextContent('98');
    });

    test('selector is not called when store does not change', () => {
      const selector = vi.fn((state: TestState) => state.key1);

      const Component2 = () => {
        const [count, setCount] = useState(0);

        const value = testState.useSelector((state) => selector(state));

        return (
          <>
            <div data-testid="another-component">{value}</div>
            <button type="button" onClick={() => setCount(count + 1)}>
              render
            </button>
          </>
        );
      };

      const { getByRole } = render(<Component2 />);

      act(() => {
        getByRole('button').click();
      });
      act(() => {
        getByRole('button').click();
      });
      act(() => {
        getByRole('button').click();
      });

      expect(selector).toHaveBeenCalledTimes(1);
    });

    test('selector callback the correct time', () => {
      const testStore = new Store<{ key1: number }>({
        debugName: 'test',
        state: { key1: 1 },
      });

      let selectorCalls = 0;

      const { rerender, result } = renderHook(() => {
        const selector = useCallback((state: { key1: number }) => {
          return state.key1;
        }, []);

        return testStore.useSelector(
          useCallback((state: { key1: number }) => {
            selectorCalls++;
            return selector(state);
          }, []),
          { useExternalDeps: true },
        );
      });

      expect(selectorCalls).toBe(1);

      rerender();

      // should not call selector again on component re-render
      expect(selectorCalls).toBe(1);

      act(() => {
        testStore.setKey('key1', 3);
      });

      expect(result.current).toBe(3);
      expect(selectorCalls).toBe(2);
    });
  });
});
