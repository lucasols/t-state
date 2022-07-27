import Store from '../src';
import { expect, describe, test, vi } from 'vitest';

type TestState = {
  items: {
    id: number;
    text: string;
  }[];
};

type Reducers = {
  addItem: TestState['items'][0];
  doNothing: undefined;
};

describe('create and manipulate store', () => {
  function createTestStore() {
    return new Store<TestState, Reducers>({
      name: 'test',
      state: {
        items: [
          {
            id: 1,
            text: 'Hello',
          },
        ],
      },
      reducers: {
        addItem: (state, newItem) => ({
          ...state,
          items: [...state.items, newItem],
        }),
        doNothing: state => state,
      },
    });
  }

  test('get the initial props', () => {
    const testState = createTestStore();

    expect(testState.getState()).toStrictEqual({
      items: [
        {
          id: 1,
          text: 'Hello',
        },
      ],
    });

    expect(testState.name).toBe('test');
  });

  test('set key', () => {
    const testState = createTestStore();

    testState.setKey('items', [
      {
        id: 2,
        text: 'Test',
      },
    ]);

    expect(testState.getState()).toStrictEqual({
      items: [
        {
          id: 2,
          text: 'Test',
        },
      ],
    });

    testState.setKey('items', []);

    expect(testState.getState()).toStrictEqual({
      items: [],
    });
  });

  test('dispatch', () => {
    const testState = createTestStore();

    testState.dispatch('addItem', {
      id: 2,
      text: 'new item added',
    });

    expect(testState.getState()).toStrictEqual({
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
    });
  });

  describe('subscribe', () => {
    test('add subscriber', () => {
      const testState = createTestStore();

      const mockSubscriber = vi.fn();

      testState.subscribe(mockSubscriber);

      testState.dispatch('addItem', {
        id: 2,
        text: 'new item added',
      });

      testState.dispatch('addItem', {
        id: 3,
        text: 'new item added',
      });

      const firstCall = mockSubscriber.mock.calls[0];
      const secondCall = mockSubscriber.mock.calls[1];

      expect(firstCall![0]).toStrictEqual({
        items: [
          {
            id: 1,
            text: 'Hello',
          },
        ],
      });

      expect(firstCall![1]).toStrictEqual({
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
      });

      expect(secondCall![0]).toStrictEqual({
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
      });

      expect(secondCall![1]).toStrictEqual({
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
      });
    });

    test('remove subscriber', () => {
      const testState = createTestStore();

      const mockSubscriber = vi.fn();

      const removeSubscriber = testState.subscribe(mockSubscriber);

      testState.dispatch('addItem', {
        id: 2,
        text: 'new item added',
      });

      removeSubscriber();

      testState.dispatch('addItem', {
        id: 2,
        text: 'new item added',
      });

      testState.dispatch('addItem', {
        id: 3,
        text: 'new item added',
      });

      expect(mockSubscriber).toHaveBeenCalledTimes(1);
    });
  });

  describe('change state using producState', () => {
    test('set key', () => {
      const testState = createTestStore();

      testState.produceState(state => {
        state.items[0]!.text = 'change text';
      });

      expect(testState.getState()).toStrictEqual({
        items: [
          {
            id: 1,
            text: 'change text',
          },
        ],
      });

      testState.produceState(state => {
        state.items.push({ id: 3, text: 'new' });
      });

      expect(testState.getState()).toStrictEqual({
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
      });
    });
  });
});
