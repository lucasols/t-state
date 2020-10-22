import { useRef, useState } from 'react';
import Store, { Reducers, ReducersPayloads, State, StoreProps } from '.';

export function useCreateStore<
  T extends State,
  P extends ReducersPayloads = ReducersPayloads,
  R extends Reducers<T, P> = Reducers<T, P>
>(storeProps: StoreProps<T, R>) {
  const store = useRef<Store<T, P>>();

  if (!store.current) store.current = new Store(storeProps);

  return store.current;
}
