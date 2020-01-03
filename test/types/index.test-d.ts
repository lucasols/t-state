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
});

/* avoid mutability */
testState.getState().items = 5;
