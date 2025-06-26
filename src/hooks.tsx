import { useRef, useState } from 'react';
import { Store, StoreProps, useSubscribeToStore } from './main';

export function useCreateStore<T>(
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

export function useStoreSnapshot<T, S>(
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

export function useSelectFromStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
) {
  return store.useSelectorRC(selector);
}
