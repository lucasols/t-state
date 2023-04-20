/* eslint-disable @typescript-eslint/lines-between-class-members */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { Store, EqualityFn, shallowEqual, State } from './main';
import { pick } from './utils';

interface Then {
  then: (callback: () => any) => any;
}

interface SelectorThen<R, P = R> {
  then: (callback: (selection: { current: R; prev: P }) => any) => any;
}

interface ChangeMethods<T extends State> {
  withInitCall(): ChangeMethods<T>;
  ifKeysChange<K extends keyof T>(...keys: K[]): Then;
  ifKeysChangeTo<K extends keyof T>(target: Pick<T, K>): Then;
  ifSelector<R>(selector: (state: T) => R): {
    change: SelectorThen<R>;
    changeTo<CT extends R>(target: CT): SelectorThen<CT, R>;
  };
  withEqualityFn(equalityFn: EqualityFn): ChangeMethods<T>;
}

export function observeChanges<T extends State>({
  prev,
  current,
}: {
  prev: T;
  current: T;
}): ChangeMethods<T> {
  let equalityFn = shallowEqual;
  let initCall = false;
  let isFirstCall = true;

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
              callback({ current: currentSelection, prev: prevSelection });
            } else if (isFirstCall && initCall) {
              callback({ current: currentSelection, prev: prevSelection });
            }

            isFirstCall = false;
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

              isFirstCall = false;
            },
          };
        },
      };
    },
  };

  return methods;
}

export function useSubscribeToStore<T extends State>(
  store: Store<T>,
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
    const unsubscribe = store.subscribe(({ prev, current }) => {
      const observe = observeChanges({ prev, current });

      callbackRef.current({ prev, current, observe });
    });

    return unsubscribe;
  }, []);
}
