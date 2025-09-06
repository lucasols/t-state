import { useRef } from 'react';

export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const slice: Pick<T, K> = {} as Pick<T, K>;

  for (let i = 0; i < keys.length; i++) {
    slice[keys[i]!] = obj[keys[i]!];
  }

  return slice;
}

type Setter<T> = (prev: T) => T;

export type ValueArg<T> = Setter<T> | T;

export function unwrapValueSetter<T>(value: ValueArg<T>, current: T): T {
  return typeof value === 'function' ? (value as Setter<T>)(current) : value;
}

export function useConst<T>(value: () => T): T {
  const ref = useRef<T | undefined>(undefined);

  if (ref.current === undefined) {
    ref.current = value();
  }

  return ref.current;
}

// eslint-disable-next-line @ls-stack/no-type-guards -- this is a utility function
export function isFunction(value: unknown): value is (...args: any[]) => any {
  return typeof value === 'function';
}
