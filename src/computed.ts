import { useInsertionEffect } from 'react';
import type { StoreProps } from './main';
import { Store, shallowEqual } from './main';
import { useConst } from './utils';

type UnsubscribeFn = () => void;

type ComputedOptions = {
  debounceSideEffects?: StoreProps<unknown>['debounceSideEffects'];
  storeEqualityFn?: (a: any, b: any) => boolean;
  computedEqualityFn?: (a: any, b: any) => boolean;
  debugName?: string;
  lazySubInitialization?: boolean;
};

export type ComputedStore<T> = {
  state: T;
  subscribe: Store<T>['subscribe'];
  useState: Store<T>['useState'];
  useSelector: Store<T>['useSelector'];
  useSelectorRC: Store<T>['useSelectorRC'];
  destroy(): void;
  initializeSubscriptions(): void;
  forceUpdate: () => void;
};

type ComputedStoreInput<T> = Store<T> | ComputedStore<T>;

export function computed<const T extends readonly ComputedStoreInput<any>[], R>(
  stores: T,
  computedValue: (
    ...states: {
      [K in keyof T]: T[K] extends ComputedStoreInput<infer S> ? S : never;
    }
  ) => R,
  options?: ComputedOptions,
): ComputedStore<R>;
export function computed<T, R>(
  store: ComputedStoreInput<T>,
  computedValue: (state: T) => R,
  options?: ComputedOptions,
): ComputedStore<R>;
export function computed(
  stores: ComputedStoreInput<unknown>[] | ComputedStoreInput<unknown>,
  computedValue: (state: any) => unknown,
  options?: ComputedOptions,
): ComputedStore<unknown> {
  if (Array.isArray(stores)) {
    return computedBasedOnMultipleStores(stores, computedValue, options);
  } else {
    return computedBasedOnMultipleStores([stores], computedValue, options);
  }
}

function computedBasedOnMultipleStores(
  stores: ComputedStoreInput<unknown>[],
  computedValue: (...states: unknown[]) => unknown,
  {
    storeEqualityFn = shallowEqual,
    computedEqualityFn = shallowEqual,
    debugName,
    debounceSideEffects,
    lazySubInitialization,
  }: ComputedOptions = {},
): ComputedStore<unknown> {
  let getPrevStates = () => stores.map((store) => store.state);

  const computedValueFn = computedValue;

  const computedValuesStore = new Store({
    state: () => computedValueFn(...getPrevStates()),
    debugName,
    debounceSideEffects,
  });

  let unsubscribe: UnsubscribeFn[] | undefined;

  let canInitialize = !lazySubInitialization;

  function initializeSubscriptions() {
    if (!canInitialize) return;

    if (unsubscribe) return;

    if (stores.length === 1) {
      unsubscribe = [
         
        stores[0]!.subscribe(({ current, prev }) => {
          if (!storeEqualityFn(current, prev)) {
            if (!computedValuesStore.isInitialized) {
              getPrevStates = () => [prev];
            }

            computedValuesStore.setState(computedValueFn(current), {
              equalityCheck: computedEqualityFn,
            });
          }
        }),
      ];

      return;
    } else {
      unsubscribe = stores.map((store, index) =>
        store.subscribe(({ current, prev }) => {
          if (!storeEqualityFn(current, prev)) {
            if (!computedValuesStore.isInitialized) {
              getPrevStates = () =>
                stores.map((s, i) => (i === index ? prev : s.state));
            }

            computedValuesStore.setState(
              computedValueFn(
                ...stores.map((s, i) => (i === index ? current : s.state)),
              ),
              { equalityCheck: computedEqualityFn },
            );
          }
        }),
      );
    }
  }

  return {
    destroy() {
      if (!unsubscribe) return;

      for (const u of unsubscribe) u();

      unsubscribe = undefined;
    },
    initializeSubscriptions() {
      canInitialize = true;
      initializeSubscriptions();
    },
    get state() {
      return computedValuesStore.state;
    },
    subscribe(callback, options) {
      if (!unsubscribe) initializeSubscriptions();

      return computedValuesStore.subscribe(callback, options);
    },
    useState(options) {
      if (!unsubscribe) initializeSubscriptions();

      return computedValuesStore.useState(options);
    },
    useSelector(selector, options) {
      if (!unsubscribe) initializeSubscriptions();

      return computedValuesStore.useSelector(selector, options);
    },
    useSelectorRC(selector, options) {
      if (!unsubscribe) initializeSubscriptions();

      return computedValuesStore.useSelectorRC(selector, options);
    },
    forceUpdate() {
      computedValuesStore.setState(computedValueFn(...getPrevStates()));
    },
  };
}

export function useComputed<
  const T extends readonly ComputedStoreInput<any>[],
  R,
>(
  stores: T,
  computedValue: (
    ...states: {
      [K in keyof T]: T[K] extends Store<infer S> ? S : never;
    }
  ) => R,
  options?: ComputedOptions,
): ComputedStore<R>;
export function useComputed<T, R>(
  store: ComputedStoreInput<T>,
  computedValue: (state: T) => R,
  options?: ComputedOptions,
): ComputedStore<R>;
export function useComputed(
  stores: ComputedStoreInput<unknown>[] | ComputedStoreInput<unknown>,
  computedValue: (state: any) => unknown,
  options?: ComputedOptions,
): ComputedStore<unknown> {
  const computedStore = useConst(() => {
     
    return computed(stores as any, computedValue, {
      ...options,
      lazySubInitialization: true,
    });
  });

  useInsertionEffect(() => {
    computedStore.initializeSubscriptions();

    return () => {
      computedStore.destroy();
    };
  }, [computedStore]);

  return computedStore;
}
