import { act, renderHook } from '@testing-library/react';
import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { computed, useComputed } from '../src/computed';
import { Store, deepEqual } from '../src/main';

test('create computed values', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedStore = computed(baseStore, (state) => {
    return state.value + 1;
  });

  expect(computedStore.state).toEqual(2);
});

test('computed values are lazily initialized', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedFnCall = vi.fn();

  const computedStore = computed(baseStore, (state) => {
    computedFnCall();

    return state.value + 1;
  });

  expect(computedFnCall).toHaveBeenCalledTimes(0);

  expect(computedStore.state).toEqual(2);
  expect(computedStore.state).toEqual(2);

  expect(computedFnCall).toHaveBeenCalledTimes(1);
});

test('subscribe to computed values', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedStore = computed(baseStore, (state) => {
    return state.value + 1;
  });

  const calls = vi.fn();

  computedStore.subscribe(({ current, prev }) => {
    calls(current, prev);
  });

  baseStore.setState({ value: 2 });

  expect(calls.mock.calls).toEqual([[3, 2]]);
});

test('remove subscriber', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedStore = computed(baseStore, (state) => {
    return state.value + 1;
  });

  const calls = vi.fn();

  const remove = computedStore.subscribe(({ current, prev }) => {
    calls(current, prev);
  });

  baseStore.setState({ value: 2 });
  remove();
  baseStore.setState({ value: 3 });

  expect(calls.mock.calls).toEqual([[3, 2]]);
});

test('lazy init when subscribed to computed store', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedFnCall = vi.fn();

  const computedStore = computed(baseStore, (state) => {
    computedFnCall();

    return state.value * 2;
  });

  baseStore.setState({ value: 2 });
  expect(computedFnCall).toHaveBeenCalledTimes(0);

  const subscribeCall = vi.fn();

  const remove = computedStore.subscribe(({ current }) => {
    subscribeCall(current);
  });
  baseStore.setState({ value: 3 });
  expect(computedFnCall).toHaveBeenCalledTimes(2);
  expect(subscribeCall.mock.calls).toEqual([[6]]);

  remove();
  baseStore.setState({ value: 4 });
  expect(computedFnCall).toHaveBeenCalledTimes(3);
  expect(subscribeCall.mock.calls).toEqual([[6]]);

  const subscribeCall2 = vi.fn();

  computedStore.subscribe(({ current }) => {
    subscribeCall2(current);
  });

  baseStore.setState({ value: 5 });
  expect(computedFnCall).toHaveBeenCalledTimes(4);
  expect(subscribeCall2.mock.calls).toEqual([[10]]);
});

test('subscribe init call', () => {
  const baseStore = new Store({
    state: { value: 1 },
  });

  const computedStore = computed(baseStore, (state) => {
    return state.value + 1;
  });

  const calls = vi.fn();

  computedStore.subscribe(
    ({ current, prev, action }) => {
      calls(current, prev, action);
    },
    { initCall: true },
  );

  expect(calls.mock.calls).toEqual([
    [
      2,
      2,
      {
        type: 'init.subscribe.call',
      },
    ],
  ]);
});

test('computed useState', () => {
  const baseStore = new Store({
    state: 1,
  });

  const computedStore = computed(baseStore, (state) => {
    return state + 1;
  });

  const { result } = renderHook(() => {
    const value = computedStore.useState();

    return value;
  });

  expect(result.current).toEqual(2);

  act(() => {
    baseStore.setState(2);
  });

  expect(result.current).toEqual(3);
});

test('destroy computed store', () => {
  const baseStore = new Store({
    state: 1,
  });

  const computedStore = computed(baseStore, (state) => {
    return state + 1;
  });

  const calls = vi.fn();

  computedStore.subscribe(({ current }) => {
    calls(current);
  });

  computedStore.destroy();

  baseStore.setState(2);
  baseStore.setState(3);

  expect(calls.mock.calls).toEqual([]);
});

describe('computed based on more than one store', () => {
  test('create computed values', () => {
    const baseStore1 = new Store({
      state: 1,
    });

    const baseStore2 = new Store({
      state: '2',
    });

    const computedStore = computed(
      [baseStore1, baseStore2],
      (state1, state2) => {
        return state1 + Number(state2);
      },
    );

    expect(computedStore.state).toEqual(3);
  });

  test('subscribe to computed values', () => {
    const baseStore1 = new Store({
      state: 1,
    });

    const baseStore2 = new Store({
      state: '2',
    });

    const computedStore = computed(
      [baseStore1, baseStore2],
      (state1, state2) => {
        return state1 + Number(state2);
      },
    );

    const calls = vi.fn();

    computedStore.subscribe(({ current, prev }) => {
      calls(current, prev);
    });

    baseStore1.setState(2);
    baseStore1.setState(2);

    expect(calls.mock.calls).toEqual([[4, 3]]);

    baseStore2.setState('3');

    expect(calls.mock.calls).toEqual([
      [4, 3],
      [5, 4],
    ]);
  });
});

describe('useComputed', () => {
  test('useComputed basic usage', () => {
    const baseStore = new Store({
      state: 1,
    });

    const { result } = renderHook(() => {
      const computedStore = useComputed(baseStore, (state) => {
        return state + 2;
      });

      const computedValue = computedStore.useState();

      return computedValue;
    });

    expect(result.current).toEqual(3);
  });

  test('useComputed in strict mode', () => {
    const baseStore = new Store({
      state: 1,
    });

    const { result } = renderHook(
      () => {
        const computedStore = useComputed(baseStore, (state) => {
          return state + 2;
        });

        const computedValue = computedStore.useState();

        return computedValue;
      },
      { wrapper: React.StrictMode },
    );

    expect(result.current).toEqual(3);
    expect(baseStore.subscribers_.size).toEqual(1);

    act(() => {
      baseStore.setState(2);
    });

    expect(result.current).toEqual(4);
  });

  test('unmount useComputed in strict mode', () => {
    const baseStore = new Store({
      state: 1,
    });

    const { result, unmount } = renderHook(
      () => {
        const computedStore = useComputed(baseStore, (state) => {
          return state + 2;
        });

        const computedValue = computedStore.useState();

        return computedValue;
      },
      { wrapper: React.StrictMode },
    );

    expect(result.current).toEqual(3);
    expect(baseStore.subscribers_.size).toEqual(1);

    unmount();

    expect(baseStore.subscribers_.size).toEqual(0);
  });

  test('unmount useComputed ', () => {
    const baseStore = new Store({
      state: 1,
    });

    const { result, unmount } = renderHook(() => {
      const computedStore = useComputed(baseStore, (state) => {
        return state + 2;
      });

      const computedValue = computedStore.useState();

      return computedValue;
    });

    expect(result.current).toEqual(3);
    expect(baseStore.subscribers_.size).toEqual(1);

    unmount();

    expect(baseStore.subscribers_.size).toEqual(0);
  });
});

test('equality checks', () => {
  const baseStore1 = new Store({
    state: { a: { b: 1 } },
  });

  const baseStore2 = new Store({
    state: { a: { b: 1 } },
  });

  const computedStoreChanged: any[] = [];
  const computedFnCalled: any[] = [];

  const computedStore = computed(
    [baseStore1, baseStore2],
    (state1, state2) => {
      computedFnCalled.push(state1.a.b + state2.a.b);
      return { a: { b: state1.a.b + state2.a.b } };
    },
    { computedEqualityFn: deepEqual, storeEqualityFn: deepEqual },
  );

  computedStore.subscribe(({ current }) => {
    computedStoreChanged.push(current);
  });

  baseStore1.setState({ a: { b: 1 } });

  expect(computedStoreChanged).toEqual([]);
  expect(computedFnCalled).toMatchInlineSnapshot(`[]`);
});
