import { Store, EqualityFn, State } from './t-state';
interface Then {
    then: (callback: () => any) => any;
}
interface SelectorThen<R, P = R> {
    then: (callback: (selection: {
        current: R;
        prev: P;
    }) => any) => any;
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
    withEqualityFn(equalityFn: EqualityFn): ChangeMethods<T>;
}
export declare function observeChanges<T extends State>(prev: T, current: T): ObserveChangesReturn<T>;
export declare function useSubscribeToStore<T extends State>(store: Store<T>, onChange: ({ prev, current, observe, }: {
    prev: T;
    current: T;
    observe: ObserveChangesReturn<T>;
}) => any): void;
export {};
