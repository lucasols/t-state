import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ComputedStore } from './computed';
import {
  initCallAction,
  shallowEqual,
  Store,
} from './main';
import type { Action, EqualityFn } from './main';
import { pick } from './utils';

interface Then {
  then: (callback: () => any) => any;
}

interface SelectorThen<R, P = R> {
  then: (callback: (selection: { current: R; prev: P }) => any) => any;
}

interface ChangeMethods<T> {
  ifKeysChange<K extends keyof T>(...keys: K[]): Then;
  withInitCall(): ChangeMethods<T>;
  ifKeysChangeTo<K extends keyof T>(target: Pick<T, K>): Then;
  ifSelector<R>(selector: (state: T) => R): {
    change: SelectorThen<R>;
    changeTo<CT extends R>(target: CT): SelectorThen<CT, R>;
  };
  withEqualityFn(equalityFn: EqualityFn): ChangeMethods<T>;
}

export function observeChanges<T>({
  prev,
  current,
  action,
}: {
  prev: T;
  current: T;
  action: Action | undefined;
}): ChangeMethods<T> {
  let equalityFn = shallowEqual;
  const isFirstCall = action === initCallAction;
  let initCall = false;

  function resetConfig() {
    equalityFn = shallowEqual;
    initCall = false;
  }

  const methods: ChangeMethods<T> = {
    withEqualityFn(newEqualityFn) {
      equalityFn = newEqualityFn;

      return methods;
    },
    withInitCall() {
      initCall = true;

      return methods;
    },
    ifKeysChange: (...keys) => ({
      then(callback) {
        if (keys.some((key) => !equalityFn(prev[key], current[key]))) {
          callback();
        }

        resetConfig();
      },
    }),
    ifKeysChangeTo(target) {
      const targetKeys = Object.keys(target) as (keyof T & string)[];
      const currentSlice = pick(current as Record<string, any>, targetKeys);

      return {
        then(callback) {
          if (
            targetKeys.some((key) => !equalityFn(prev[key], current[key])) &&
            equalityFn(currentSlice, target)
          ) {
            callback();
          }

          resetConfig();
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
              callback({ current: currentSelection, prev: prevSelection });
            } else if (isFirstCall && initCall) {
              callback({ current: currentSelection, prev: prevSelection });
            }

            resetConfig();
          },
        },
        changeTo(target) {
          return {
            then(callback) {
              if (equalityFn(currentSelection, target)) {
                if (isDiff) {
                  callback({ current: target, prev: prevSelection });
                } else if (isFirstCall && initCall) {
                  callback({ current: target, prev: prevSelection });
                }
              }

              resetConfig();
            },
          };
        },
      };
    },
  };

  return methods;
}

export function useSubscribeToStore<T>(
  store: Store<T> | ComputedStore<T>,
  onChange: ({
    prev,
    current,
    observe,
  }: {
    prev: T;
    current: T;
    observe: ChangeMethods<T>;
  }) => any,
) {
  const callbackRef = useRef(onChange);
  useLayoutEffect(() => {
    callbackRef.current = onChange;
  });

  useEffect(() => {
    const unsubscribe = store.subscribe((prevAndCurrent) => {
      const observe = observeChanges(prevAndCurrent);
      const { prev, current } = prevAndCurrent;

      callbackRef.current({ prev, current, observe });
    });

    return unsubscribe;
  }, []);
}
