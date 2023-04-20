import { Action, State } from './main';
import { nanoid } from 'nanoid';

let tabId: string | null = null;
let tabIdWasLogged = false;

export function startDevTools(
  storeName: string,
  initialState: State,
  setState: (state: State) => void,
) {
  const reduxDevTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;

  tabId = tabId || nanoid(4);

  if (!(window as any).__tStateCreatedStores) {
    (window as any).__tStateCreatedStores = [];
  }

  const createdInstances = (window as any).__tStateCreatedStores as {
    name: string;
    instance: any;
    unsubscribe: () => void;
  }[];

  const name = `t-state - ${storeName} - ${tabId}`;

  let lastState = initialState;

  const relatedInstance = createdInstances.find((i) => i.name === name);

  let devTools: any;

  if (relatedInstance) {
    devTools = relatedInstance.instance;
    relatedInstance.unsubscribe();
  } else {
    devTools = reduxDevTools.connect({
      name,
    });
  }

  devTools.init(initialState);

  const unsubscribe = devTools.subscribe((data: any) => {
    switch (data.type) {
      case 'START':
        if (!tabIdWasLogged) {
          tabIdWasLogged = true;
          console.log('t-state devtools started, tabId:', tabId);
        }
        break;

      case 'STOP':
        break;

      case 'DISPATCH': {
        switch (data.payload.type) {
          case 'RESET':
            setState(initialState);
            break;

          case 'JUMP_TO_STATE':
          case 'JUMP_TO_ACTION': {
            setState(JSON.parse(data.state));
            break;
          }

          case 'COMMIT': {
            devTools.init(lastState);
            break;
          }

          default:
            console.error(
              data.type,
              data.payload.type,
              'is not supported by t-state devtools',
            );
            break;
        }

        break;
      }

      default:
        console.error(data.type, 'is not supported by t-state devtools');
        break;
    }
  });

  if (relatedInstance) {
    relatedInstance.unsubscribe = unsubscribe;
  } else {
    createdInstances.push({
      name,
      instance: devTools,
      unsubscribe,
    });
  }

  return ({
    action,
    current,
  }: {
    current: any;
    prev: any;
    action?: Action;
  }) => {
    lastState = current;
    devTools.send(action ?? null, current);
  };
}
