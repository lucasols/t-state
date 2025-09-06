import { useRef, useState } from 'react';
import type { EqualityFn, StoreProps } from './main';
import { Store, useSubscribeToStore } from './main';

/**
 * Creates and returns a store instance within a React component.
 * The store is created only once and persists across component re-renders.
 *
 * @param storeProps - Store configuration or a function that returns store configuration
 * @returns A Store instance
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const store = useCreateStore({ state: { count: 0 } });
 *   const count = store.useKey('count');
 *   return <div>{count}</div>;
 * };
 * ```
 */
export function useCreateStore<T>(
  storeProps: StoreProps<T> | (() => StoreProps<T>),
): Store<T> {
  const store = useRef<Store<T>>();

  if (!store.current) {
    store.current = new Store(
      typeof storeProps === 'function' ? storeProps() : storeProps,
    );
  }

  return store.current;
}

/**
 * Takes a snapshot of the store state when a condition is met and stops updating.
 *
 * @param store - The store to snapshot
 * @param selector - Function to select/derive value from state
 * @param snapshotWhen - Condition function that determines when to take the snapshot
 * @returns The selected value at the time the snapshot was taken
 *
 * @example
 * ```tsx
 * const snapshot = useStoreSnapshot(
 *   store,
 *   state => state.user,
 *   state => state.isLoaded // Take snapshot when loaded is true
 * );
 * ```
 */
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

/**
 * Selects a value from an external store (a store not created in the current component).
 *
 * @param store - The external store to select from
 * @param selector - Function to select/derive value from state
 * @param options - Configuration options
 * @param options.equalityFn - Custom equality function to prevent unnecessary re-renders
 * @returns The selected value
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const userName = useSelectFromStore(
 *     globalUserStore,
 *     state => state.name
 *   );
 *   return <div>{userName}</div>;
 * };
 * ```
 */
export function useSelectFromStore<T, S>(
  store: Store<T>,
  selector: (state: T) => S,
  options?: {
    equalityFn?: EqualityFn | false;
  },
): Readonly<S> {
  return store.useSelectorRC(selector, options);
}
