/* eslint-disable @typescript-eslint/lines-between-class-members */
import Store, { State, EqualityFn, deepEqual } from '.';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { shallowEqual } from './shallowEqual';
import { pick } from './utils';

/**
 * @deprecated use `observeChanges` instead
 */
export function getIfKeysChange<T extends State>(prev: T, current: T) {
  return <K extends keyof T>(
    keys: K[] | Pick<T, K>,
    callback: () => any,
    areEqual: EqualityFn<Pick<T, K>> = shallowEqual,
  ) => {
    const verifyIfChangesOnly = Array.isArray(keys);
    const changeToObjKeys = (
      verifyIfChangesOnly ? keys : Object.keys(keys)
    ) as K[];
    const currentSlice = pick(current, changeToObjKeys);

    if (!areEqual(pick(prev, changeToObjKeys), currentSlice)) {
      if (verifyIfChangesOnly) {
        callback();
      } else if (areEqual(keys as Pick<T, K>, currentSlice)) {
        callback();
      }
    }
  };
}

/**
 * @deprecated use `observeChanges` instead
 */
export function getIfSelectorChange<T extends State>(prev: T, current: T) {
  return <S extends (state: T) => any>(
    selector: S | [S, ReturnType<S>],
    callback: (currentSelection: ReturnType<S>) => any,
    areEqual: EqualityFn<ReturnType<S>> = shallowEqual,
  ) => {
    const verifyIfChangesTo = Array.isArray(selector);
    const selectorFn = verifyIfChangesTo
      ? (selector as [S, any])[0]
      : (selector as S);
    const currentSelection = selectorFn(current);

    if (!areEqual(selectorFn(prev), currentSelection)) {
      if (!verifyIfChangesTo) {
        callback(currentSelection);
      } else if (
        areEqual(currentSelection, (selector as [S, ReturnType<S>])[1])
      ) {
        callback(currentSelection);
      }
    }
  };
}

interface Then {
  then: (callback: () => any) => any;
}

interface SelectorThen<R, P = R> {
  then: (callback: (currentSelection: R, previousSelection: P) => any) => any;
}

interface ChangeMethods<T extends State> {
  ifKeysChange<K extends keyof T>(...keys: K[]): Then;
  ifKeysChangeTo<K extends keyof T>(target: Pick<T, K>): Then;
  ifSelector<R>(selector: (state: T) => R): {
    change: SelectorThen<R>;
    changeTo<CT extends R>(target: CT): SelectorThen<CT, R>;
  };
}

interface ObserveChangesReturn<T extends State> extends ChangeMethods<T> {
  withEqualityFn(equalityFn: EqualityFn<any>): ChangeMethods<T>;
}

export function observeChanges<T extends State>(
  prev: T,
  current: T,
): ObserveChangesReturn<T> {
  let equalityFn = deepEqual;

  const methods: ChangeMethods<T> = {
    ifKeysChange: (...keys) => ({
      then(callback) {
        if (keys.some((key) => !equalityFn(prev[key], current[key]))) {
          callback();
        }
      },
    }),
    ifKeysChangeTo(target) {
      const targetKeys = Object.keys(target) as (keyof T)[];
      const currentSlice = pick(current, targetKeys);

      return {
        then(callback) {
          if (
            targetKeys.some((key) => !equalityFn(prev[key], current[key])) &&
            equalityFn(currentSlice, target)
          ) {
            callback();
          }
        },
      };
    },
    ifSelector: (selector) => {
      const currentSelection = selector(current);
      const prevSelection = selector(prev);
      const isDiff = !equalityFn(currentSelection, prevSelection);

      return {
        change: {
          then(callback) {
            if (isDiff) {
              callback(currentSelection, prevSelection);
            }
          },
        },
        changeTo(target) {
          return {
            then(callback) {
              if (isDiff && equalityFn(currentSelection, target)) {
                callback(target, prevSelection);
              }
            },
          };
        },
      };
    },
  };

  return {
    withEqualityFn(newEqualityFn) {
      equalityFn = newEqualityFn;

      return methods;
    },
    ...methods,
  };
}

export function useSubscribeToStore<T>(
  store: Store<T>,
  onChange: ({
    prev,
    current,
    observe,
  }: {
    prev: T;
    current: T;
    observe: ObserveChangesReturn<T>;
  }) => any,
) {
  const callbackRef = useRef(onChange);
  useLayoutEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    const unsubscribe = store.subscribe((prev, current) => {
      const observe = observeChanges(prev, current);

      callbackRef.current({ prev, current, observe });
    });

    return unsubscribe;
  }, []);
}
