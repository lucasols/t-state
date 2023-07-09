import { describe, expect, test, vi } from 'vitest';
import { Store } from '../src/main';
import { fnCalls } from './utils';

type TestState = {
  string: string;
  items: {
    id: number;
    text: string;
  }[];
};

function createTestStore() {
  const store = new Store<TestState>({
    debugName: 'test',
    state: {
      string: 'Hello',
      items: [
        {
          id: 1,
          text: 'Hello',
        },
      ],
    },
  });

  return {
    store,
    addItem(item: TestState['items'][0]) {
      store.produceState((draft) => {
        draft.items.push(item);
      });
    },
  };
}

type SubscribeParams = [{ prev: TestState; current: TestState }];

test('get the initial props', () => {
  const { store } = createTestStore();

  expect(store.state).toStrictEqual({
    items: [
      {
        id: 1,
        text: 'Hello',
      },
    ],
    string: 'Hello',
  });

  expect(store.debugName_).toBe('test');
});

test('set key', () => {
  const { store } = createTestStore();

  store.setKey('items', [
    {
      id: 2,
      text: 'Test',
    },
  ]);

  expect(store.state).toStrictEqual({
    items: [
      {
        id: 2,
        text: 'Test',
      },
    ],
    string: 'Hello',
  });

  store.setKey('items', []);

  expect(store.state).toStrictEqual({
    items: [],
    string: 'Hello',
  });
});

describe('subscribe', () => {
  test('add subscriber', () => {
    const { store, addItem } = createTestStore();

    const mockSubscriber = vi.fn();

    store.subscribe(mockSubscriber);

    addItem({
      id: 2,
      text: 'new item added',
    });

    addItem({
      id: 3,
      text: 'new item added',
    });

    const firstCall = mockSubscriber.mock.calls[0] as SubscribeParams;
    const secondCall = mockSubscriber.mock.calls[1] as SubscribeParams;

    expect(firstCall[0].prev).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'Hello',
        },
      ],
      string: 'Hello',
    });

    expect(firstCall[0].current).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'Hello',
        },
        {
          id: 2,
          text: 'new item added',
        },
      ],
      string: 'Hello',
    });

    expect(secondCall[0].prev).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'Hello',
        },
        {
          id: 2,
          text: 'new item added',
        },
      ],
      string: 'Hello',
    });

    expect(secondCall[0].current).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'Hello',
        },
        {
          id: 2,
          text: 'new item added',
        },
        {
          id: 3,
          text: 'new item added',
        },
      ],
      string: 'Hello',
    });
  });

  test('remove subscriber', () => {
    const { store, addItem } = createTestStore();

    const mockSubscriber = vi.fn();

    const removeSubscriber = store.subscribe(mockSubscriber);

    addItem({
      id: 2,
      text: 'new item added',
    });

    removeSubscriber();

    addItem({
      id: 2,
      text: 'new item added',
    });

    addItem({
      id: 3,
      text: 'new item added',
    });

    expect(mockSubscriber).toHaveBeenCalledTimes(1);
  });

  test('initization call', () => {
    const { store } = createTestStore();

    const mockSubscriber = vi.fn();

    store.subscribe(mockSubscriber, { initCall: true });

    expect(mockSubscriber).toHaveBeenCalledTimes(1);
    expect(mockSubscriber.mock.calls[0]![0].prev).toEqual({
      items: [{ id: 1, text: 'Hello' }],
      string: 'Hello',
    });
    expect(mockSubscriber.mock.calls[0]![0].current).toEqual({
      items: [{ id: 1, text: 'Hello' }],
      string: 'Hello',
    });
  });
});

describe('change state using producState', () => {
  test('set state', () => {
    const { store } = createTestStore();

    store.produceState((state) => {
      state.items[0]!.text = 'change text';
    });

    expect(store.state).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'change text',
        },
      ],
      string: 'Hello',
    });

    store.produceState((state) => {
      state.items.push({ id: 3, text: 'new' });
    });

    expect(store.state).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'change text',
        },
        {
          id: 3,
          text: 'new',
        },
      ],
      string: 'Hello',
    });
  });

  test('dont do nothing when state is not updated', () => {
    const { store } = createTestStore();

    const mockSubscriber = vi.fn();

    store.subscribe(mockSubscriber);

    const wasUpdated = store.produceState(() => {
      return undefined;
    });

    expect(wasUpdated).toBe(false);

    const wasUpdated2 = store.produceState((draft) => {
      const item = draft.items[1];

      if (item) {
        item.text = 'Hello';
      }
    });

    expect(wasUpdated2).toBe(false);

    expect(mockSubscriber).toHaveBeenCalledTimes(0);
  });
});

describe('change state using setPartialState', () => {
  test('change state using setPartialState', () => {
    const { store } = createTestStore();

    store.setPartialState({
      items: [{ id: 2, text: 'change text' }],
    });

    expect(store.state).toStrictEqual({
      items: [
        {
          id: 2,
          text: 'change text',
        },
      ],
      string: 'Hello',
    });
  });

  test('set state', () => {
    const { store } = createTestStore();

    store.setPartialState({ items: [{ id: 2, text: 'change text' }] });

    expect(store.state).toStrictEqual({
      items: [
        {
          id: 2,
          text: 'change text',
        },
      ],
      string: 'Hello',
    });
  });
});

describe('dont call subscribers when state is not updated', () => {
  const { store } = createTestStore();

  const mockSubscriber = vi.fn();
  store.subscribe(mockSubscriber);

  test('setState', () => {
    store.setState((curr) => curr);

    expect(mockSubscriber).toHaveBeenCalledTimes(0);
  });

  test('setKey', () => {
    store.setKey('string', 'Hello');

    expect(mockSubscriber).toHaveBeenCalledTimes(0);
  });

  test('setPartialState', () => {
    store.setPartialState({ string: 'Hello' });

    expect(mockSubscriber).toHaveBeenCalledTimes(0);
  });

  test('produceState', () => {
    store.produceState((draft) => {
      draft.string = 'Hello';
    });

    store.produceState((draft) => {
      draft.string = 'Hello';
    });

    expect(mockSubscriber).toHaveBeenCalledTimes(0);
  });
});

describe('disable default equality check on set methods', () => {
  const { store } = createTestStore();

  const mockSubscriber = vi.fn();
  store.subscribe(mockSubscriber);

  test('setState', () => {
    store.setState((curr) => curr, {
      equalityCheck: false,
    });

    expect(mockSubscriber).toHaveBeenCalledTimes(1);
  });

  test('setKey', () => {
    store.setKey('string', 'Hello', {
      equalityCheck: false,
    });

    expect(mockSubscriber).toHaveBeenCalledTimes(2);
  });

  test('setPartialState', () => {
    store.setPartialState(
      { string: 'Hello' },
      {
        equalityCheck: false,
      },
    );

    expect(mockSubscriber).toHaveBeenCalledTimes(3);
  });

  test('produceState', () => {
    store.produceState((state) => state, {
      equalityCheck: false,
    });

    expect(mockSubscriber).toHaveBeenCalledTimes(4);
  });
});

describe('freeze state', () => {
  process.env.NODE_ENV = 'development';

  test('prevent direct mutation of the state', () => {
    const { store } = createTestStore();

    expect(() => {
      store.state.items[0]!.text = 'change text';
    }).toThrowError();

    store.setState({ items: [{ id: 1, text: 'Freeze' }], string: 'Freeze' });

    expect(() => {
      store.state.string = 'change text';
    }).toThrowError();
  });

  test('allow Store instances', () => {
    const customClass = new Store({
      state: { text: 'Hello' },
    });

    const baseStore = new Store({
      state: { store: customClass, text: 'Hello' },
    });

    expect(() => {
      baseStore.state.store.state.text = 'change text';
    }).toThrowError();

    expect(() => {
      baseStore.state.store.subscribe(() => {});

      baseStore.state.store.setState({ text: 'change text' });
    }).not.toThrowError();
  });

  test('allow custom instances', () => {
    const customClass = new Store({
      state: { text: 'Hello' },
    });

    const baseStore = new Store({
      state: { store: customClass, text: 'Hello' },
    });

    expect(() => {
      baseStore.state.store.state.text = 'change text';
    }).toThrowError();

    expect(() => {
      baseStore.state.store.subscribe(() => {});

      baseStore.state.store.setState({ text: 'change text' });
    }).not.toThrowError();
  });
});

test('batched updates', () => {
  const { store } = createTestStore();

  const mockSubscriber = vi.fn();

  store.subscribe(mockSubscriber);

  store.batch(() => {
    store.setKey('string', 'new string');
    store.setKey('string', 'new string 2');
    store.setKey('string', 'new string 3');
    store.setKey('string', 'new string 4');
    store.setKey('string', 'new string 6');
    store.setKey('items', []);
  });

  expect(mockSubscriber).toHaveBeenCalledTimes(1);
  expect(store.state).toStrictEqual({
    items: [],
    string: 'new string 6',
  });
});

describe('middlewares', () => {
  test('ignore update', () => {
    const store = new Store({
      state: { text: 'Hello' },
    });

    store.addMiddleware(({ next }) => {
      if (next.text === 'block') {
        return false;
      }

      return true;
    });

    store.setState({ text: 'block' });

    expect(store.state).toStrictEqual({ text: 'Hello' });

    store.setState({ text: 'OK' });

    expect(store.state).toStrictEqual({ text: 'OK' });
  });

  test('ignore action', () => {
    const store = new Store({
      state: { text: 'Hello' },
    });

    store.addMiddleware(({ action }) => {
      if (action === 'block') {
        return false;
      }

      return true;
    });

    store.setState({ text: 'OK' }, { action: 'block' });

    expect(store.state).toStrictEqual({ text: 'Hello' });

    store.setState({ text: 'OK' });

    expect(store.state).toStrictEqual({ text: 'OK' });
  });
});

describe('lazy initial state', () => {
  const initialStateFnWasCalled = vi.fn();

  test('lazy initial state', () => {
    const store = new Store({
      state: () => {
        initialStateFnWasCalled();
        return { text: 'Hello' };
      },
    });

    expect(initialStateFnWasCalled).toHaveBeenCalledTimes(0);

    expect(store.state).toStrictEqual({ text: 'Hello' });

    expect(initialStateFnWasCalled).toHaveBeenCalledTimes(1);

    expect(store.state).toStrictEqual({ text: 'Hello' });

    expect(initialStateFnWasCalled).toHaveBeenCalledTimes(1);
  });

  test('add subscribers', () => {
    const store = new Store({
      state: () => ({ text: 'Hello' }),
    });

    const subscriberCalls = fnCalls();

    store.subscribe((args) => {
      subscriberCalls.add(args);
    });

    store.setState({ text: 'Hi' });

    expect(subscriberCalls.calls).toEqual([
      { action: undefined, current: { text: 'Hi' }, prev: { text: 'Hello' } },
    ]);
  });

  test('add subscribers with initCall', () => {
    const store = new Store({
      state: () => ({ text: 'Hello' }),
    });

    const subscriberCalls = fnCalls();

    store.subscribe(
      (args) => {
        subscriberCalls.add(args);
      },
      { initCall: true },
    );

    expect(subscriberCalls.calls).toEqual([
      {
        action: { type: 'init.subscribe.call' },
        current: { text: 'Hello' },
        prev: { text: 'Hello' },
      },
    ]);
  });
});
