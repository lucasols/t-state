import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react';
import {
  isFunction,
  shallowEqual,
  State,
  Store,
  StoreProps,
  useSubscribeToStore,
} from './main';

export function useCreateStore<T extends State>(
  storeProps: StoreProps<T> | (() => StoreProps<T>),
) {
  const store = useRef<Store<T>>();

  if (!store.current) {
    store.current = new Store(
      typeof storeProps === 'function' ? storeProps() : storeProps,
    );
  }

  return store.current;
}

export function useStoreSnapshot<T extends State, S>(
  store: Store<T>,
  selector: (state: T) => S,
  snapshotWhen: (state: T) => boolean,
): S {
  const [state, setState] = useState(() => selector(store.state));
  const snapshotWasTaken = useRef(false);

  useSubscribeToStore(store, ({ current }) => {
    if (snapshotWasTaken.current) return;

    if (snapshotWhen(current)) {
      snapshotWasTaken.current = true;
      setState(selector(current));
    }
  });

  return state;
}

function assertIsNotUndefined<T>(
  value: T,
  message: string,
): asserts value is Exclude<T, undefined> {
  if (value === undefined) {
    throw new Error(message);
  }
}

export function createStoreContext<T extends State>() {
  const Context = createContext<undefined | Store<T>>(undefined);

  function useCreate(
    value: T | (() => T),
    {
      equalityFn = shallowEqual,
      enableDeepFreezeInDev = false,
      debugName,
    }: {
      equalityFn?: (a: any, b: any) => boolean;
      enableDeepFreezeInDev?: boolean;
      debugName?: string;
    } = {},
  ) {
    const store = useCreateStore(() => ({
      state: isFunction(value) ? value() : value,
      disableDeepFreezeInDev: !enableDeepFreezeInDev,
      debugName,
    }));

    if (typeof value !== 'function') {
      store.setState(value, { equalityCheck: equalityFn });
    }

    const Provider = useCallback(
      ({ children }: { children: ReactNode }): JSX.Element => {
        return <Context.Provider value={store}>{children}</Context.Provider>;
      },
      [store],
    );

    return {
      Provider,
      store,
    };
  }

  function useKey<K extends keyof T>(key: K) {
    const contextStore = useContext(Context);

    assertIsNotUndefined(contextStore, 'context provider not found');

    return contextStore.useKey(key);
  }

  function useSelector<S>(selector: (state: T) => S) {
    const contextStore = useContext(Context);

    assertIsNotUndefined(contextStore, 'context provider not found');

    return contextStore.useSelector(selector);
  }

  function useStore() {
    const contextStore = useContext(Context);

    assertIsNotUndefined(contextStore, 'context provider not found');

    return contextStore;
  }

  function useHasContext() {
    const contextStore = useContext(Context);

    return contextStore !== undefined;
  }

  return { useKey, useSelector, useCreate, useStore, useHasContext };
}
