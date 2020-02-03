import { anyFunction } from '@lucasols/utils/typings';
import { State, EqualityFn } from '.';
import { shallowEqual } from '@lucasols/utils/shallowEqual';
import { pick } from '@lucasols/utils/pick';
import fastDeepEqual from 'fast-deep-equal';

export function getIfKeysChange<T extends State>(prev: T, current: T) {
  return <K extends keyof T>(
    keys: K[] | Pick<T, K>,
    callback: anyFunction,
    checkDeepEquality = false,
    deepEqualityFn: EqualityFn<Pick<T, K>> = fastDeepEqual,
  ) => {
    const areEqual = checkDeepEquality ? deepEqualityFn : shallowEqual;
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
    callback: anyFunction,
    checkDeepEquality = false,
    deepEqualityFn: EqualityFn<ReturnType<S>> = fastDeepEqual,
  ) => {
    const areEqual = checkDeepEquality ? deepEqualityFn : shallowEqual;
    const verifyIfChangesTo = Array.isArray(selector);
    const selectorFn = verifyIfChangesTo
      ? (selector as [S, any])[0]
      : (selector as S);
    const currentSelection = selectorFn(current);

    if (!areEqual(selectorFn(prev), currentSelection)) {
      if (!verifyIfChangesTo) {
        callback();
      } else if (
        areEqual(currentSelection, (selector as [S, ReturnType<S>])[1])
      ) {
        callback();
      }
    }
  };
}
