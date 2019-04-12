/** forked from https://github.com/jhonnymichel/react-hookstore */
import { useEffect, useState } from 'react';
import devtools from './devtools';
// TODO: deep freeze?
// TODO: connect function
// TODO: memoize
// TODO: remove the max callbacks, use for
// TODO: test unmount remove setter
// IDEA: create hook for get multiple keys from store at same
// IDEA: improve type inference

type SerializableObject = {
  [key: string]: Serializable;
};

type SerializableArray = (
  | string
  | number
  | SerializableObject
  | boolean
  | undefined)[];

type Serializable = | string
  | number
  | boolean
  | null
  | SerializableObject
  | undefined
  | SerializableArray;

type State = {
  [index: string]: Serializable;
};

interface anyObject<T = any> {
  [key: string]: T;
}

type Subscribe = {
  (
    prev: anyObject,
    current: anyObject,
    action?: string | anyObject
  ): void;
};

type ListOfString = string;

type Payload = { [index: string]: Serializable };

type Reducers<T, A extends string = ListOfString> = {
  [K in A]: (state: T, payload?: Payload) => T;
};

export type StoreConfig<T extends State, A extends ListOfString> = {
  state: T;
  reducers?: Reducers<T, A>;
  subscriber?: Subscribe;
};

type Store<T extends State> = {
  state: T;
  reducers?: Reducers<T>;
  setters: Setter[];
  subscribers: Subscribe[];
};

interface genericFunction {
  (...params: any): any;
}

type Setter = {
  key: string;
  callback: genericFunction;
};

let stores: { [index: string]: Store<any> } = {};

const devToolsMiddeware = process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? devtools : false);

/**
 * Creates a new store
 * @param {String} name - The store namespace.
 * @param {Object} config - An object containing the store setup
 * @param {*} config.state [{}] - The store initial state. It can be of any type.
 * @param {*} confg.reducer [{}] The reducers handlers.
 * @param {*} confg.subscribers [{}] Initial subscriber.
 */
export function createStore<T extends State, A extends string = ListOfString>(
  name: string,
  { state, reducers, subscriber }: StoreConfig<T, A>
) {
  if (stores[name]) {
    throw new Error(`Store ${name} already exists`);
  }

  const store = {
    state,
    reducers,
    setters: [],
    subscribers: subscriber ? [subscriber] : [],
  };

  if (devToolsMiddeware) {
    store.subscribers.push(
      devToolsMiddeware(name, state, (newState: anyObject) => {
        setState(getStore(name), newState);
      })
    );
  }

  stores = { ...stores, [name]: store };

  return {
    getState: () => getState<T>(name),
    setKey: <K extends keyof T>(key: K, value: typeof state[K]) => setKey<T>(name, key, value),
    dispatch: <P = Payload>(type: A, payload?: P) => dispatch(name, type, payload),
    subscribe: (callback: genericFunction) => subscribe(name, callback),
    useStore: <K extends keyof T>(key: K) => useStore<T[K]>(name, key),
  };
}

function setState(
  store: Store<anyObject>,
  newState: anyObject,
  action?: string | anyObject
) {
  for (let i = 0; i < store.setters.length; i++) {
    const setter = store.setters[i];

    if (store.state[setter.key] !== newState[setter.key]) {
      setter.callback(newState[setter.key]);
      // console.log('callback');
    }
  }

  const prevState = { ...store.state };
  store.state = newState;

  for (let i = 0; i < store.subscribers.length; i++) {
    store.subscribers[i](prevState, newState, action);
  }
}

function getStore<T extends State>(name: string) {
  const store: Store<T> = stores[name];
  if (!store) {
    throw new Error(`Store ${name} does not exist`);
  }

  return store;
}

/**
 * Returns the state for the selected store
 * @param {String} name - The namespace for the wanted store
 */
export function getState<T extends State>(name: string): T {
  return getStore<T>(name).state;
}

export function dispatch<T extends State>(
  name: string,
  type: string,
  payload?: anyObject
) {
  const store = getStore<T>(name);

  if (store.reducers && !store.reducers[type]) {
    throw new Error(`Action ${type} does not exist on store ${name}`);
  }

  const newState = store.reducers && store.reducers[type](store.state, payload);

  if (newState) setState(store, newState, { type: `${name}.${type}`, ...payload });
}

export function setKey<T extends State>(
  name: string,
  key: keyof T,
  value: any
) {
  const store = getStore<T>(name);

  const newState = { ...store.state, [key]: value };

  setState(store, newState, { type: `${name}.set.${key}`, key, value });

  return value;
}

/**
 * Returns a [ state, setState ] pair for the selected store. Can only be called within React Components
 * @param {String} name - The namespace for the wanted store
 * @param {String} key - The wanted state key
 */
export function useStore<T extends Serializable>(
  name: string,
  key: string
): [T, (value: T) => T, () => T] {
  const store = getStore(name);

  const [state, set] = useState(store.state[key] as T);

  useEffect(() => {
    store.setters.push({
      key,
      callback: set,
    });

    return () => {
      store.setters = store.setters.filter(
        (setter: Setter) => setter.callback !== set
      );
    };
  }, []);

  if (store.state[key] === undefined) {
    throw new Error(`Key '${key}' for the store '${name}' does not exist`);
  }

  const getter = () => getState(name)[key] as T;

  return [state, (value: any) => setKey(name, key, value), getter];
}

/**
 * Subscribe callback
 *
 * @callback subscribeCallback
 * @param {Object} prevState - previous state
 * @param {Object} nextState - next state
 * @param {String} action - action dispatched
 */

/**
 * Subscribe to changes in a store
 * @param {String} name - The store name
 * @param {subscribeCallback} callback - callback to run
 */
export function subscribe(name: string, callback: Subscribe) {
  const store = getStore(name);

  if (!store.subscribers.includes(callback)) {
    store.subscribers.push(callback);
  }

  return () => {
    store.subscribers = store.subscribers.filter(
      subscriber => subscriber !== callback
    );
  };
}
