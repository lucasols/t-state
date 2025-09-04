import { act, renderHook } from '@testing-library/react';
import { produce } from 'immer';
import React from 'react';
import { beforeEach, describe, expect, test } from 'vitest';
import { computed } from '../src/computed';
import { deepEqual, Store } from '../src/main';
import { observeChanges, useSubscribeToStore } from '../src/subscribeUtils';

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

beforeEach(() => {
  testState = new Store<TestState>({
    debugName: 'test',
    state: initialState,
  });
});

describe('getIfKeysChange', () => {
  test('call callback when keys change', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe.ifKeysChange('key1').then(() => {
        callCount++;
      });
    });

    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);

    expect(callCount).toBe(2);
  });

  test('call callback when keys change to', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe.ifKeysChangeTo({ key1: 5 }).then(() => {
        callCount++;
      });
    });

    testState.setKey('key1', 2);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 5);
    testState.setKey('key1', 2);
    testState.setKey('key1', 5);

    expect(callCount).toBe(2);
  });

  test('call callback when keys change with deepEquality', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe.ifKeysChange('key3', 'key4').then(() => {
        callCount++;
      });
    });

    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);

    expect(callCount).toBe(2);
  });
});

describe('getIfSelectorChange', () => {
  test('call callback when keys change', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe
        .ifSelector((s) => s.key1)
        .change.then(() => {
          callCount++;
        });
    });

    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);

    expect(callCount).toBe(2);
  });

  test('call callback when keys change to', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe
        .ifSelector((s) => s.key1)
        .changeTo(5)
        .then(() => {
          callCount++;
        });
    });

    testState.setKey('key1', 2);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 5);
    testState.setKey('key1', 2);
    testState.setKey('key1', 5);

    expect(callCount).toBe(2);
  });

  test('call callback when keys change with default shallowEqual', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe
        .ifSelector((s) => [s.key3.join(', '), s.key4.join(', ')])
        .change.then(() => {
          callCount++;
        });
    });

    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);

    expect(callCount).toBe(2);
  });

  test('call callback when keys change with deepEquality', () => {
    let callCount = 0;

    testState.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);

      observe
        .withEqualityFn(deepEqual)
        .ifSelector((s) => ({ a: s.key3, b: s.key4 }))
        .change.then(() => {
          callCount++;
        });
    });

    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);
    testState.setKey('key3', [3]);
    testState.setKey('key4', [4]);

    expect(callCount).toBe(2);
  });

  test('with init call in .change', () => {
    let callCount = 0;

    testState.subscribe(
      (prevAndCurrent) => {
        const observe = observeChanges(prevAndCurrent);

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .change.then(() => {
            callCount++;
          });

        observe
          .ifSelector((s) => s.key1)
          .change.then(() => {
            callCount++;
          });
      },
      { initCall: true },
    );

    expect(callCount).toBe(1);
  });

  test('with init call in .changeTo', () => {
    let callCount = 0;

    testState.subscribe(
      (prevAndCurrent) => {
        const observe = observeChanges(prevAndCurrent);

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .changeTo(1)
          .then(() => {
            callCount++;
          });
      },
      { initCall: true },
    );

    expect(callCount).toBe(1);
  });

  test('with multiple init call in .change', () => {
    let callCount = 0;

    testState.subscribe(
      (prevAndCurrent) => {
        const observe = observeChanges(prevAndCurrent);

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .change.then(() => {
            callCount++;
          });

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .change.then(() => {
            callCount++;
          });
      },
      { initCall: true },
    );

    expect(callCount).toBe(2);
  });
});

describe('useSubscribeToStore', () => {
  type HookTestState = {
    key1: number;
    key2: string;
    key3: number[];
    nested: {
      value: number;
    };
  };

  const hookInitialState: HookTestState = {
    key1: 1,
    key2: '👍',
    key3: [0, 1, 2],
    nested: { value: 42 },
  };

  let hookTestState: Store<HookTestState>;

  beforeEach(() => {
    hookTestState = new Store<HookTestState>({
      debugName: 'test',
      state: hookInitialState,
    });
  });

  test('basic subscription functionality', () => {
    let callCount = 0;
    let lastCall: any = null;

    renderHook(() => {
      useSubscribeToStore(hookTestState, (args) => {
        callCount++;
        lastCall = args;
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(callCount).toBe(1);
    expect(lastCall).toEqual({
      prev: { ...hookInitialState },
      current: { ...hookInitialState, key1: 2 },
      observe: expect.any(Object),
    });
  });

  test('observe parameter provides change detection', () => {
    const key1Changes: number[] = [];

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ observe }) => {
        observe.ifKeysChange('key1').then(() => {
          key1Changes.push(Date.now());
        });
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    act(() => {
      hookTestState.setKey('key2', 'changed');
    });

    act(() => {
      hookTestState.setKey('key1', 3);
    });

    expect(key1Changes).toHaveLength(2);
  });

  test('callback reference stability', () => {
    let callback1Count = 0;
    let callback2Count = 0;

    const mockOnChange1 = () => {
      callback1Count++;
    };
    const mockOnChange2 = () => {
      callback2Count++;
    };

    const { rerender } = renderHook(
      ({ callback }) => {
        useSubscribeToStore(hookTestState, callback);
      },
      { initialProps: { callback: mockOnChange1 } },
    );

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(callback1Count).toBe(1);
    expect(callback2Count).toBe(0);

    rerender({ callback: mockOnChange2 });

    act(() => {
      hookTestState.setKey('key1', 3);
    });

    expect(callback1Count).toBe(1);
    expect(callback2Count).toBe(1);
  });

  test('subscription cleanup on unmount', () => {
    let callCount = 0;

    const { unmount } = renderHook(() => {
      useSubscribeToStore(hookTestState, () => {
        callCount++;
      });
    });

    expect(hookTestState.subscribers_.size).toBe(1);

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(callCount).toBe(1);

    unmount();

    expect(hookTestState.subscribers_.size).toBe(0);

    act(() => {
      hookTestState.setKey('key1', 3);
    });

    expect(callCount).toBe(1);
  });

  test('works with computed stores', () => {
    const computedStore = computed(hookTestState, (state) => state.key1 * 2);
    let callCount = 0;
    let lastCall: any = null;

    renderHook(() => {
      useSubscribeToStore(computedStore, (args) => {
        callCount++;
        lastCall = args;
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(callCount).toBe(1);
    expect(lastCall).toEqual({
      prev: 2,
      current: 4,
      observe: expect.any(Object),
    });
  });

  test('observe works with selector changes', () => {
    let timesCalled = 0;

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ observe }) => {
        observe
          .ifSelector((s: HookTestState) => s.key1 + s.nested.value)
          .change.then(() => {
            timesCalled++;
          });
      });
    });

    act(() => {
      hookTestState.setKey('key2', 'changed');
    });

    expect(timesCalled).toBe(0);

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(timesCalled).toBe(1);

    act(() => {
      hookTestState.produceState((draft) => {
        draft.nested.value = 50;
      });
    });

    expect(timesCalled).toBe(2);
  });

  test('observe works with custom equality function', () => {
    let callCount = 0;

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ observe }) => {
        observe
          .withEqualityFn(deepEqual)
          .ifKeysChange('key3')
          .then(() => {
            callCount++;
          });
      });
    });

    act(() => {
      hookTestState.setKey('key3', [0, 1, 2]);
    });

    expect(callCount).toBe(0);

    act(() => {
      hookTestState.setKey('key3', [0, 1, 3]);
    });

    expect(callCount).toBe(1);
  });

  test('observe works with changeTo pattern', () => {
    let changeToFiveCount = 0;

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ observe }) => {
        observe.ifKeysChangeTo({ key1: 5 }).then(() => {
          changeToFiveCount++;
        });
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    act(() => {
      hookTestState.setKey('key1', 3);
    });

    expect(changeToFiveCount).toBe(0);

    act(() => {
      hookTestState.setKey('key1', 5);
    });

    expect(changeToFiveCount).toBe(1);
  });

  test('observe works with withInitCall', () => {
    let initCallCount = 0;
    let regularCallCount = 0;

    const testStateWithInitCall = new Store<HookTestState>({
      debugName: 'testWithInit',
      state: hookInitialState,
    });

    // Subscribe with initCall to test the withInitCall functionality
    testStateWithInitCall.subscribe(
      (prevAndCurrent) => {
        const observe = observeChanges(prevAndCurrent);

        // Test withInitCall - should trigger on init call
        observe
          .withInitCall()
          .ifSelector((s: HookTestState) => s.key1)
          .change.then(() => {
            initCallCount++;
          });

        // Test without withInitCall - should not trigger on init call
        observe
          .ifSelector((s: HookTestState) => s.key1)
          .change.then(() => {
            regularCallCount++;
          });
      },
      { initCall: true },
    );

    expect(initCallCount).toBe(1);
    expect(regularCallCount).toBe(0);
  });

  test('multiple observers in single callback', () => {
    let key1ChangeCount = 0;
    let key2ChangeCount = 0;

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ observe }) => {
        observe.ifKeysChange('key1').then(() => {
          key1ChangeCount++;
        });
        observe.ifKeysChange('key2').then(() => {
          key2ChangeCount++;
        });
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(key1ChangeCount).toBe(1);
    expect(key2ChangeCount).toBe(0);

    act(() => {
      hookTestState.setKey('key2', 'changed');
    });

    expect(key1ChangeCount).toBe(1);
    expect(key2ChangeCount).toBe(1);
  });

  test('works in React.StrictMode', () => {
    let callCount = 0;

    const { unmount } = renderHook(
      () => {
        useSubscribeToStore(hookTestState, () => {
          callCount++;
        });
      },
      { wrapper: React.StrictMode },
    );

    expect(hookTestState.subscribers_.size).toBe(1);

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    expect(callCount).toBe(1);

    unmount();

    expect(hookTestState.subscribers_.size).toBe(0);
  });

  test('handles rapid state changes', () => {
    let callCount = 0;

    renderHook(() => {
      useSubscribeToStore(hookTestState, () => {
        callCount++;
      });
    });

    act(() => {
      hookTestState.setKey('key1', 2);
      hookTestState.setKey('key1', 3);
      hookTestState.setKey('key1', 4);
      hookTestState.setKey('key2', 'changed');
    });

    expect(callCount).toBe(4);
  });

  test('callback receives correct prev and current values', () => {
    const capturedValues: Array<{
      prev: HookTestState;
      current: HookTestState;
    }> = [];

    renderHook(() => {
      useSubscribeToStore(hookTestState, ({ prev, current }) => {
        capturedValues.push({ prev, current });
      });
    });

    const intermediateState = { ...hookInitialState, key1: 2 };

    act(() => {
      hookTestState.setKey('key1', 2);
    });

    act(() => {
      hookTestState.setKey('key2', 'changed');
    });

    expect(capturedValues).toHaveLength(2);
    expect(capturedValues[0]).toEqual({
      prev: hookInitialState,
      current: intermediateState,
    });
    expect(capturedValues[1]).toEqual({
      prev: intermediateState,
      current: { ...intermediateState, key2: 'changed' },
    });
  });

  test('using nested produce should trigger a correct change', () => {
    type StoreState = { value: { a: number } };

    const store = new Store<StoreState>({
      state: { value: { a: 0 } },
    });

    const changes: { current: StoreState; prev: StoreState }[] = [];

    renderHook(() => {
      useSubscribeToStore(store, ({ prev, current }) => {
        changes.push({ prev, current });
      });
    });

    act(() => {
      store.produceState((draft) => {
        draft.value.a = 1;
      });
    });

    expect(changes).toHaveLength(1);
    expect(changes[0]).toEqual({
      prev: { value: { a: 0 } },
      current: { value: { a: 1 } },
    });

    act(() => {
      store.produceState((draft) => {
        draft.value = produce(draft.value, (d) => {
          d.a = 2;
        });
      });
    });

    expect(changes).toHaveLength(2);
    expect(changes[1]).toEqual({
      prev: { value: { a: 1 } },
      current: { value: { a: 2 } },
    });
  });
});
