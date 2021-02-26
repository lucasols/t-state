import Store from '../src';
import { observeChanges } from '../src/subscribeUtils';

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

describe('getIfKeysChange', () => {
  test('call callback when keys change', () => {
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

      observe.ifSelector(s => s.key1).change.then(mockCallback);
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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

      observe
        .ifSelector(s => s.key1)
        .changeTo(5)
        .then(mockCallback);
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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

      observe
        .ifSelector(s => [s.key3.join(', '), s.key4.join(', ')])
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
    const mockCallback = jest.fn();

    testState.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

      observe
        .ifSelector(s => ({ a: s.key3, b: s.key4 }))
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
});
