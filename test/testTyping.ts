import { createStore } from '../lib';

type appState = {
  test: undefined | number;
  number: null | number;
  string: null | string;
  numberArr: null | number[];
};

const appState = createStore<appState>('app', {
  state: {
    test: undefined,
    number: null,
    string: 'dsfsdf',
    numberArr: [],
  },
});

appState.subscribe((prev, current) => {
  console.log(prev.number);
  console.log(prev.test);
  console.log(current.test);
});


