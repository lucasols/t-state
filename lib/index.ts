/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
import { useEffect, useState } from 'react';
import devtools from './devTools';
import { anyObject, genericFunction, Serializable } from './types';
// IDEA: connect function
// IDEA: create hook for get multiple keys from store at same

export type State = anyObject<Serializable>;

type Subscriber<T = State> = {
  (prev: T, current: T, action?: string | anyObject): void;
};

type ReducersArg = {
  [index: string]: anyObject | undefined;
};

type Reducers<T, R = ReducersArg> = {
  [K in keyof R]: (state: T, payload: R[K]) => T
};

type Setter = {
  key: string;
  callback: genericFunction;
};

type Store<T extends State = State> = {
  state: T;
  reducers?: Reducers<T>;
  setters: Setter[];
  subscribers: Subscriber<T>[];
};

/* code */
let stores: { [index: string]: any } = {};

const devToolsMiddeware =
  process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? devtools : false);

export function createStore<
  T extends State = State,
  R extends ReducersArg = ReducersArg
>(
  name: string,
  {
    state,
    reducers,
    subscriber,
  }: { state: T; reducers?: Reducers<T, R>; subscriber?: Subscriber<T> }
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

  function dispatchHOF<P extends keyof R>(
    type: P,
    ...payload: R[P] extends undefined ? [undefined?] : [R[P]]
  ) {
    return dispatch(name, type, payload[0]);
  }

  return {
    getState: () => getState<T>(name),
    setKey: <K extends keyof T>(key: K, value: typeof state[K]) =>
      setKey<T>(name, key, value),
    dispatch: dispatchHOF,
    subscribe: (callback: Subscriber<T>) => subscribe(name, callback),
    useStore: <K extends keyof T>(key: K) => useStore<T[K]>(name, key),
  };
}

function setState(
  store: Store,
  newState: anyObject,
  action?: string | anyObject
) {
  for (let i = 0; i < store.setters.length; i++) {
    const setter = store.setters[i];

    if (store.state[setter.key] !== newState[setter.key]) {
      setter.callback(newState[setter.key]);
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

  if (store.reducers && store.reducers[type]) {
    const newState = store.reducers[type](store.state, payload);

    if (newState) {
      setState(store, newState, { type: `${name}.${type}`, ...payload });
    }
  } else {
    throw new Error(`Action ${type} does not exist on store ${name}`);
  }
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
export function subscribe(name: string, callback: Subscriber) {
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
