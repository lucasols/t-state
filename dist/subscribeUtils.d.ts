import { anyFunction } from '@lucasols/utils/typings';
import { State, EqualityFn } from '.';
/**
 * @deprecated use `observeChanges` instead
 */
export declare function getIfKeysChange<T extends State>(prev: T, current: T): <K extends keyof T>(keys: Pick<T, K> | K[], callback: anyFunction, areEqual?: EqualityFn<Pick<T, K>>) => void;
/**
 * @deprecated use `observeChanges` instead
 */
export declare function getIfSelectorChange<T extends State>(prev: T, current: T): <S extends (state: T) => any>(selector: S | [S, ReturnType<S>], callback: (currentSelection: ReturnType<S>) => any, areEqual?: EqualityFn<ReturnType<S>>) => void;
interface Then {
    then: (callback: () => any) => any;
}
interface SelectorThen<R> {
    then: (callback: (currentSelection: R) => any) => any;
}
interface ChangeMethods<T extends State> {
    ifKeysChange<K extends keyof T>(...keys: K[]): Then;
    ifKeysChangeTo<K extends keyof T>(target: Pick<T, K>): Then;
    ifSelector<R>(selector: (state: T) => R): {
        change: SelectorThen<R>;
        changeTo<CT extends R>(target: CT): SelectorThen<CT>;
    };
}
interface ObserveChangesReturn<T extends State> extends ChangeMethods<T> {
    withEqualityFn(equalityFn: EqualityFn<any>): ChangeMethods<T>;
}
export declare function observeChanges<T extends State>(prev: T, current: T): ObserveChangesReturn<T>;
export {};
