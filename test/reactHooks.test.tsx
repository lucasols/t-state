import '@testing-library/jest-dom/extend-expect';
import { act, fireEvent, render } from '@testing-library/react';
import React, { useRef, useState } from 'react';
import Store from '../src';
import { anyFunction } from '@lucasols/utils/typings';
import { shallowEqual } from '@lucasols/utils';

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
      name: 'test',
      state: initialState,
    });

    const Component = ({ onRender }: { onRender?: anyFunction }) => {
      const [numOfClicks, setNumOfClicks] = testState.useKey('numOfClicks');

      if (onRender) {
        onRender();
      }

      return (
        <button type="button" onClick={() => setNumOfClicks(numOfClicks + 1)}>
          Num of clicks: {numOfClicks}
        </button>
      );
    };

    beforeEach(() => {
      testState = new Store<TestState>({
        name: 'test',
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

      expect(testState.getState().numOfClicks).toBe(2);
    });

    test('update all components if setState is called from anywhere', () => {
      const AnotherComponent = () => {
        const [numOfClicks] = testState.useKey('numOfClicks');

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
      new Promise(done => {
        const consoleError = jest.spyOn(global.console, 'error');

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
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

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
      expect(mockSubscriber).toHaveBeenCalledTimes(5);
    });
  });

  describe('useGetSlice', () => {
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

    type Reducers = {
      changeMultipleKeys: Pick<TestState, 'key1' | 'key2'>;
    };

    let testState: Store<TestState, Reducers>;

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
      testState = new Store<TestState, Reducers>({
        name: 'test',
        state: initialState,
        reducers: {
          changeMultipleKeys: (state, { key1, key2 }) => ({
            ...state,
            key1,
            key2,
          }),
        },
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
      new Promise(done => {
        const consoleError = jest.spyOn(global.console, 'error');

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
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

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
        testState.dispatch('changeMultipleKeys', {
          key2: '👍',
          key1: 1,
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(5);
    });

    test('reducer triggers only one render', () => {
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

      testState.subscribe(mockSubscriber);

      const { getByRole } = render(<Component onRender={onRender} />);

      const button = getByRole('button');

      expect(button).toHaveTextContent('number: 1, string: 👍, array: [0,1,2]');

      act(() => {
        testState.dispatch('changeMultipleKeys', {
          key2: 'new text',
          key1: 42,
        });
      });

      expect(button).toHaveTextContent(
        'number: 42, string: new text, array: [0,1,2]',
      );

      act(() => {
        testState.dispatch('changeMultipleKeys', {
          key2: 'new text',
          key1: 42,
        });
      });

      act(() => {
        testState.dispatch('changeMultipleKeys', {
          key2: 'new text',
          key1: 42,
        });
      });

      expect(onRender).toHaveBeenCalledTimes(2);
      expect(mockSubscriber).toHaveBeenCalledTimes(3);
    });
  });

  describe('useSelect', () => {
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

    type Reducers = {
      changeMultipleKeys: Pick<TestState, 'key1' | 'key2'>;
    };

    let testState: Store<TestState, Reducers>;

    const Component = ({
      onRender,
      useShallowEqual,
    }: {
      onRender?: anyFunction;
      useShallowEqual?: boolean;
    }) => {
      const sum = testState.useSelector(state => state.key1 + state.key3[0], {
        equalityFn: useShallowEqual ? undefined : false,
      });

      if (onRender) {
        onRender();
      }

      return (
        <button type="button" onClick={() => testState.setKey('key1', sum + 1)}>
          {sum}
        </button>
      );
    };

    beforeEach(() => {
      testState = new Store<TestState, Reducers>({
        name: 'test',
        state: initialState,
        reducers: {
          changeMultipleKeys: (state, { key1, key2 }) => ({
            ...state,
            key1,
            key2,
          }),
        },
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
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

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
        testState.dispatch('changeMultipleKeys', {
          key2: '👍',
          key1: 1,
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(7);
    });

    test('shallow equality check disabled', () => {
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

      testState.subscribe(mockSubscriber);

      const Component2 = () => {
        const state = testState.useSelector(s => s, { equalityFn: false });

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
        testState.dispatch('changeMultipleKeys', {
          key2: '👍',
          key1: 1,
        });
      });

      expect(onRender).toHaveBeenCalledTimes(8);
      expect(mockSubscriber).toHaveBeenCalledTimes(7);
    });

    test('not render when the equality function return true', () => {
      const onRender = jest.fn();
      const mockSubscriber = jest.fn();

      const Component2 = () => {
        const state = testState.useSelector(s => s, {
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
        testState.dispatch('changeMultipleKeys', {
          key2: '👍',
          key1: 1,
        });
      });

      expect(onRender).toHaveBeenCalledTimes(1);
      expect(mockSubscriber).toHaveBeenCalledTimes(7);
    });

    test('update selector if selector deps change', () => {
      const mockSubscriber = jest.fn();
      testState.subscribe(mockSubscriber);
      let idCounter = 1;

      const Component3 = () => {
        const [selectorDep, setselectorDep] = useState(1);

        const id = useRef(idCounter++);
        const state = testState.useSelector(
          s => ({ value: selectorDep + s.key1 }),
          { selectorDeps: [selectorDep] },
        );

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

      expect(mockSubscriber).toHaveBeenCalledTimes(2);
    });
  });
});
