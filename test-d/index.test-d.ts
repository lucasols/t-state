// TypeScript Version: 3.7
import Store from '../dist';
import { expectError, expectNotAssignable } from 'tsd';

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

expectNotAssignable(testState.getState().items);

expectNotAssignable(testState.useKey('items')[0]);

expectNotAssignable(testState.useSlice('items').items);

expectNotAssignable(testState.useSelector(s => s.items)[0]);

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

expectError(testState2.dispatch('test'));

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
