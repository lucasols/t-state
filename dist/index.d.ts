/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
import { anyObj } from '@lucasols/utils/typings';
import { shallowEqual as shallowEqualFn } from '@lucasols/utils/shallowEqual';
import { Action } from './devTools';
import { dequal } from 'dequal/lite';
export declare const shallowEqual: typeof shallowEqualFn;
export declare const deepEqual: typeof dequal;
export declare type State = anyObj;
export declare type Subscriber<T extends State> = {
    (prev: T, current: T, action?: Action): void;
};
export declare type ReducersPayloads = {
    [index: string]: any;
};
export declare type Reducers<T extends State, P extends ReducersPayloads> = {
    [K in keyof P]: (state: T, payload: P[K]) => T;
};
export declare type EqualityFn<T> = (prev: Readonly<T>, current: Readonly<T>) => boolean;
export declare type StoreProps<T, R> = {
    name?: string;
    state: T;
    reducers?: R;
};
export default class Store<T extends State, P extends ReducersPayloads = ReducersPayloads, R extends Reducers<T, P> = Reducers<T, P>> {
    readonly name?: string;
    private state;
    private reducers?;
    private subscribers;
    constructor({ name, state, reducers }: StoreProps<T, R>);
    getState(): Readonly<T>;
    setState(newState: T, action?: Action): void;
    setKey<K extends keyof T>(key: K, value: T[K]): void;
    dispatch<K extends keyof R>(type: K, ...payload: Parameters<R[K]>[1] extends undefined ? [undefined?] : [Parameters<R[K]>[1]]): void;
    subscribe(callback: Subscriber<T>): () => void;
    useKey<K extends keyof T>(key: K, { equalityFn }?: {
        equalityFn?: EqualityFn<T[K]>;
    }): readonly [Readonly<T[K]>, (value: T[K]) => void, () => Readonly<T[K]>];
    useSlice<K extends keyof T>(...keys: K[]): Readonly<Pick<T, K>>;
    useSlice<K extends keyof T>(keys: K[], options: {
        equalityFn?: EqualityFn<Pick<T, K>>;
    }): Readonly<Pick<T, K>>;
    useSelector<S extends (state: T) => any>(selector: S, { equalityFn, selectorDeps, }?: {
        equalityFn?: EqualityFn<ReturnType<S>> | false;
        selectorDeps?: any[];
    }): Readonly<ReturnType<S>>;
    useState(equalityFn?: EqualityFn<T>): Readonly<T>;
    /** set a new state mutanting the state with Immer produce function */
    produceState(recipe: (draftState: T) => void): void;
}
