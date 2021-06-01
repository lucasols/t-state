export function pick<T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: K[],
) {
  const slice: Pick<T, K> = {} as Pick<T, K>;

  for (let i = 0; i < keys.length; i++) {
    slice[keys[i]] = obj[keys[i]];
  }

  return slice;
}
