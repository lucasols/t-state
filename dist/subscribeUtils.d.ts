import { anyFunction } from '@lucasols/utils/typings';
import { State, EqualityFn } from '.';
export declare function getIfKeysChange<T extends State>(prev: T, current: T): <K extends keyof T>(keys: Pick<T, K> | K[], callback: anyFunction, checkDeepEquality?: boolean, deepEqualityFn?: EqualityFn<Pick<T, K>>) => void;
export declare function getIfSelectorChange<T extends State>(prev: T, current: T): <S extends (state: T) => any>(selector: S | [S, ReturnType<S>], callback: anyFunction, checkDeepEquality?: boolean, deepEqualityFn?: EqualityFn<ReturnType<S>>) => void;
