export function fnCalls<T = any>() {
  const calls: T[] = [];
  return {
    calls,
    add: (value: T) => {
      calls.push(value);
    },
    last: () => calls.at(-1),
  };
}
