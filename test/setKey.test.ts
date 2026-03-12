import { describe, expect, test, vi } from 'vitest';
import { Store } from '../src/main';

describe('setKey with ValueArg (function) equality', () => {
  test('does not update when setter returns same value (default equality)', () => {
    const store = new Store({ state: { n: 1 } });

    const sub = vi.fn();
    store.subscribe(sub);

    store.setKey('n', (prev) => prev);

    expect(store.state.n).toBe(1);
    expect(sub).toHaveBeenCalledTimes(0);
  });

  test('respects custom equalityFn when value is a setter', () => {
    const store = new Store({ state: { n: 1 } });

    const sub = vi.fn();
    store.subscribe(sub);

    store.setKey('n', (prev) => prev, { equalityCheck: (a, b) => a === b });

    expect(store.state.n).toBe(1);
    expect(sub).toHaveBeenCalledTimes(0);
  });

  test('updates when setter returns a different value', () => {
    const store = new Store({ state: { n: 1 } });

    const sub = vi.fn();
    store.subscribe(sub);

    store.setKey('n', (prev) => prev + 1);

    expect(store.state.n).toBe(2);
    expect(sub).toHaveBeenCalledTimes(1);
  });

  test('setter function should be called only once when equality check passes', () => {
    const store = new Store({ state: { n: 1 } });

    const setter = vi.fn((prev: number) => prev + 1);

    store.setKey('n', setter);

    expect(setter).toHaveBeenCalledTimes(1);
    expect(store.state.n).toBe(2);
  });

  test('setter function should not produce inconsistent results from double evaluation', () => {
    const store = new Store({ state: { n: 0 } });

    let counter = 0;
    store.setKey('n', () => ++counter);

    // The stored value should match what the equality check evaluated
    expect(store.state.n).toBe(1);
    expect(counter).toBe(1);
  });
});

