import { anyFunction } from '@lucasols/utils/typings';
import { State, EqualityFn } from '.';
import { shallowEqual, pick } from '@lucasols/utils';
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
