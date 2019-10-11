import { anyObject, Serializable } from './types';
export declare type State = anyObject<Serializable>;
declare type Subscriber<T = State> = {
    (prev: T, current: T, action?: string | anyObject): void;
};
declare type ReducersArg = {
    [index: string]: anyObject | undefined;
};
declare type Reducers<T, R = ReducersArg> = {
    [K in keyof R]: (state: T, payload: R[K]) => T;
};
export declare function createStore<T extends State = State, R extends ReducersArg = ReducersArg>(name: string, { state, reducers, subscriber, }: {
    state: T;
    reducers?: Reducers<T, R>;
    subscriber?: Subscriber<T>;
}): {
    getState: () => T;
    setKey: <K extends keyof T>(key: K, value: T[K]) => any;
    dispatch: <P extends keyof R>(type: P, ...payload: R[P] extends undefined ? [undefined?] : [R[P]]) => void;
    subscribe: (callback: Subscriber<T>) => () => void;
    useStore: <K_1 extends keyof T>(key: K_1) => [T[K_1], (value: T[K_1]) => T[K_1], () => T[K_1]];
};
/**
 * Returns the state for the selected store
 * @param {String} name - The namespace for the wanted store
 */
export declare function getState<T extends State>(name: string): T;
export declare function dispatch<T extends State>(name: string, type: string, payload?: anyObject): void;
export declare function setKey<T extends State>(name: string, key: keyof T, value: any): any;
/**
 * Returns a [ state, setState ] pair for the selected store. Can only be called within React Components
 * @param {String} name - The namespace for the wanted store
 * @param {String} key - The wanted state key
 */
export declare function useStore<T extends Serializable>(name: string, key: string): [T, (value: T) => T, () => T];
/**
 * Subscribe callback
 *
 * @callback subscribeCallback
 * @param {Object} prevState - previous state
 * @param {Object} nextState - next state
 * @param {String} action - action dispatched
 */
/**
 * Subscribe to changes in a store
 * @param {String} name - The store name
 * @param {subscribeCallback} callback - callback to run
 */
export declare function subscribe(name: string, callback: Subscriber): () => void;
export {};
