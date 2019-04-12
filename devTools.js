let id = 0;

export default (storeName, initialState, setState) => {
  const reduxDevTools = window.__REDUX_DEVTOOLS_EXTENSION__;

  const instanceID = id;
  id += 1;

  const name = `react-hookstore - ${storeName}`;
  const features = {
    jump: true,
  };

  const devTools = reduxDevTools.connect({ name, features });

  devTools.init(initialState);

  devTools.subscribe((data) => {
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

  return (state, newState, action) => {
    devTools.send(action, newState, {}, instanceID);
  };
};
