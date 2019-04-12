import { State } from 'lib/hookstated';

let id = 0;

export default (storeName: string, initialState: State, setState: (state: State) => void) => {
  const reduxDevTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  const instanceID = id;
  id += 1;

  const name = `react-hookstore - ${storeName}`;
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

  return (state: State, newState: State, action: string) => {
    devTools.send(action, newState, {}, instanceID);
  };
};
