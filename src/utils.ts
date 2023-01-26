export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
) {
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
