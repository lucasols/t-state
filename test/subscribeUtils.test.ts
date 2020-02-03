import Store, { fastDeepEqual } from '../src';
import { getIfKeysChange, getIfSelectorChange } from '../src/subscribeUtils';

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
      const ifKeyChange = getIfKeysChange(prev, current);

      ifKeyChange(['key1'], mockCallback);
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
      const ifKeyChange = getIfKeysChange(prev, current);

      ifKeyChange({ key1: 5 }, mockCallback);
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
      const ifKeysChange = getIfKeysChange(prev, current);

      ifKeysChange(['key3', 'key4'], () => {
        mockCallback(current.key3.join(', '), current.key4.join(', '));
      }, fastDeepEqual);
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
      const ifChange = getIfSelectorChange(prev, current);

      ifChange(s => s.key1, mockCallback);
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
      const ifKeyChange = getIfSelectorChange(prev, current);

      ifKeyChange([s => s.key1, 5], mockCallback);
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
      const ifSelectorChange = getIfSelectorChange(prev, current);

      ifSelectorChange(
        s => [s.key3.join(', '), s.key4.join(', ')],
        () => {
          mockCallback(current.key3.join(', '), current.key4.join(', '));
        },
      );
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
      const ifSelectorChange = getIfSelectorChange(prev, current);

      ifSelectorChange(
        s => ({ a: s.key3, b: s.key4 }),
        () => {
          mockCallback(current.key3.join(', '), current.key4.join(', '));
        },
        fastDeepEqual,
      );
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
