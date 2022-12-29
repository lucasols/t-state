import { State } from './main';

let id = 0;

export type Action = {
  type: string;
  [k: string]: any;
};

export default (
  storeName: string,
  initialState: State,
  setState: (state: State) => void,
) => {
  const reduxDevTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  const instanceID = id;
  id += 1;

  const name = `t-state - ${storeName}`;
  const features = {
    jump: true,
  };

  const devTools = reduxDevTools.connect({ name, features });

  devTools.init(initialState);

  devTools.subscribe((data: any) => {
    switch (data.type) {
      case 'RESET':
        setState(initialState);
        break;
      case 'DISPATCH':
        console.log('DevTools requested to change the state to', data.state);
        switch (data.payload.type) {
          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION': {
            setState(JSON.parse(data.state));
            break;
          }
          default:
            break;
        }
        break;
      default:
        break;
    }
  });

  return (_state: State, newState: State, action: Action) => {
    devTools.send(action, newState, {}, instanceID);
  };
};
