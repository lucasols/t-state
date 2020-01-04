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

testState.useKey('items')[0].push({ id: 2, text: 'Error' });

testState.useSlice(['items']).items = [];

testState.useSelector(s => s.items)[0] = { id: 2, text: 'Error' };

testState.dispatch('test');
