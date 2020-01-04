// TypeScript Version: 3.7
import Store from '../../src';

const testState = new Store({
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
    test: state => state,
    test2: (state, payload: number) => state,
  },
});

// $ExpectError
testState.getState().items = 5;

// $ExpectError
testState.useKey('items')[0].push({ id: 2, text: 'Error' });

// $ExpectError
testState.useSlice(['items']).items = [];

// $ExpectError
testState.useSelector(s => s.items)[0] = { id: 2, text: 'Error' };

// Should not throw error
testState.dispatch('test');

// Should typecheck payload
testState.dispatch('test2', 5);

type TestState2 = {
  items: {
    id: number;
    text: string;
  }[];
};

type ReducersPayloads = {
  test: number;
};

const testState2 = new Store<TestState2, ReducersPayloads>({
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
    test: (state, num) => state,
  },
});

// $ExpectError
testState2.dispatch('test');

const testState3 = new Store<TestState2, ReducersPayloads>({
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
    test: (state, num) => ({
      ...state,
    }),
  },
});
