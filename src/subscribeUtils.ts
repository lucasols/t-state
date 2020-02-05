import { anyFunction } from '@lucasols/utils/typings';
import { State, EqualityFn } from '.';
import { shallowEqual } from '@lucasols/utils/shallowEqual';
import { pick } from '@lucasols/utils/pick';

export function getIfKeysChange<T extends State>(prev: T, current: T) {
  return <K extends keyof T>(
    keys: K[] | Pick<T, K>,
    callback: anyFunction,
    areEqual: EqualityFn<Pick<T, K>> = shallowEqual,
  ) => {
    const verifyIfChangesOnly = Array.isArray(keys);
    const changeToObjKeys = (verifyIfChangesOnly
      ? keys
      : Object.keys(keys)) as K[];
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
