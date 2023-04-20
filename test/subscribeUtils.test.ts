import { deepEqual, Store } from '../src/main';
import { observeChanges } from '../src/subscribeUtils';
import { expect, describe, test, beforeEach, vi } from 'vitest';

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
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe.ifKeysChange('key1').then(mockCallback);
    });

    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('call callback when keys change to', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe.ifKeysChangeTo({ key1: 5 }).then(mockCallback);
    });

    testState.setKey('key1', 2);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 5);
    testState.setKey('key1', 2);
    testState.setKey('key1', 5);

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('call callback when keys change with deepEquality', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe.ifKeysChange('key3', 'key4').then(() => {
        mockCallback(current.key3.join(', '), current.key4.join(', '));
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

    expect(mockCallback.mock.calls).toEqual([
      ['3', '0, 1, 2'],
      ['3', '4'],
    ]);
  });
});

describe('getIfSelectorChange', () => {
  test('call callback when keys change', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe.ifSelector((s) => s.key1).change.then(mockCallback);
    });

    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 4);

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('call callback when keys change to', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe
        .ifSelector((s) => s.key1)
        .changeTo(5)
        .then(() => mockCallback());
    });

    testState.setKey('key1', 2);
    testState.setKey('key1', 3);
    testState.setKey('key1', 3);
    testState.setKey('key2', 'Test');
    testState.setKey('key1', 3);
    testState.setKey('key1', 5);
    testState.setKey('key1', 2);
    testState.setKey('key1', 5);

    expect(mockCallback).toHaveBeenCalledTimes(2);
  });

  test('call callback when keys change with default shallowEqual', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe
        .ifSelector((s) => [s.key3.join(', '), s.key4.join(', ')])
        .change.then(() => {
          mockCallback(current.key3.join(', '), current.key4.join(', '));
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

    expect(mockCallback.mock.calls).toEqual([
      ['3', '0, 1, 2'],
      ['3', '4'],
    ]);
  });

  test('call callback when keys change with deepEquality', () => {
    const mockCallback = vi.fn();

    testState.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      observe
        .withEqualityFn(deepEqual)
        .ifSelector((s) => ({ a: s.key3, b: s.key4 }))
        .change.then(() => {
          mockCallback(current.key3.join(', '), current.key4.join(', '));
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

    expect(mockCallback.mock.calls).toEqual([
      ['3', '0, 1, 2'],
      ['3', '4'],
    ]);
  });

  test('with init call in .change', () => {
    const mockCallback = vi.fn();

    testState.subscribe(
      ({ prev, current }) => {
        const observe = observeChanges({ prev, current });

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .change.then(() => mockCallback());
      },
      { initCall: true },
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  test('with init call in .changeTo', () => {
    const mockCallback = vi.fn();

    testState.subscribe(
      ({ prev, current }) => {
        const observe = observeChanges({ prev, current });

        observe
          .withInitCall()
          .ifSelector((s) => s.key1)
          .changeTo(1)
          .then(() => mockCallback());
      },
      { initCall: true },
    );

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });
});
