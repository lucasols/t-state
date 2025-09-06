/* eslint-disable @typescript-eslint/consistent-type-assertions -- we need to use any here */
/* eslint-disable @typescript-eslint/no-unsafe-argument -- we need to use any here */
/* eslint-disable @typescript-eslint/no-unsafe-call -- we need to use any here */
/* eslint-disable @typescript-eslint/no-unsafe-member-access -- we need to use any here */
import { nanoid } from 'nanoid';
import type { Action } from './main';

let tabId: string | null = null;
let tabIdWasLogged = false;

export function startDevTools(
  storeName: string,
  initialState: any,
  setState: (state: any) => void,
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
          console.info('t-state devtools started, tabId:', tabId);
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
        }

        break;
      }
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

  return ({ action, current }: { current: any; action?: Action }): void => {
    lastState = current;
    devTools.send(action ?? null, current);
  };
}
