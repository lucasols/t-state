export declare function pick<T extends Record<string, any>, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
type Setter<T> = (prev: T) => T;
export type ValueArg<T> = Setter<T> | T;
export declare function unwrapValueSetter<T>(value: ValueArg<T>, current: T): T;
export declare function deepFreeze<T>(obj: T): T;
export {};
