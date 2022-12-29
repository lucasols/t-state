import { useRef } from 'react';
import { State, Store, StoreProps } from './main';

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
