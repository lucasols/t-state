import { Action } from './devTools';
import { dequal } from 'dequal/lite';
import { shallowEqual } from './shallowEqual';
import { ValueArg } from './utils';
declare const deepEqual: typeof dequal;
export { shallowEqual, deepEqual };
export type State = Record<string, any>;
export type Subscriber<T extends State> = {
    (props: {
        prev: T;
        current: T;
        action?: Action;
    }): void;
};
export type EqualityFn = (prev: any, current: any) => boolean;
export type StoreProps<T> = {
    name?: string;
    state: T;
};
type UseStateOptions = {
    equalityFn?: EqualityFn | false;
};
export declare class Store<T extends State> {
    readonly name?: string;
    private state_;
    private subscribers;
    private batchUpdates_;
    private lastState_;
    constructor({ name, state }: StoreProps<T>);
    get state(): T;
    private flush_;
    setState(newState: ValueArg<T>, action?: Action): void;
    setKey<K extends keyof T>(key: K, value: ValueArg<T[K]>, { action, equalityCheck, }?: {
        action?: Action;
        /** by default a simple equality check is performed before setting the new
         * value, you can pass false to ignore the check or pass a custom equality function */
        equalityCheck?: boolean | EqualityFn;
    }): void;
    setPartialState(newState: Partial<T>, { action, equalityCheck, }?: {
        action?: Action;
        /** perform a equality check before setting the new value */
        equalityCheck?: EqualityFn;
    }): void;
    /** set a new state mutanting the state with Immer produce function */
    produceState(recipe: (draftState: T) => void | T, action?: Action): void;
    batch(fn: () => void, action?: Action): void;
    subscribe(callback: Subscriber<T>): () => void;
    useSelector<S>(selector: (state: T) => S, { equalityFn }?: UseStateOptions): Readonly<S>;
    useKey<K extends keyof T>(key: K, { equalityFn }?: UseStateOptions): Readonly<T[K]>;
    useState(options?: UseStateOptions): Readonly<T>;
    useSlice<K extends keyof T>(...keys: K[]): Readonly<Pick<T, K>>;
    useSlice<K extends keyof T>(keys: K[], options?: UseStateOptions): Readonly<Pick<T, K>>;
}
