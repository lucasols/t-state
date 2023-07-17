import { expect, test, vi } from 'vitest';
import { Store } from '../src/main';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

test.concurrent('throttle consecutive updates', async () => {
  const store = new Store({
    state: '',
    debounceSideEffects: {
      wait: 5,
    },
  });

  const subscriberCalls = vi.fn();

  store.subscribe((args) => {
    subscriberCalls(args);
  });

  store.setState('H');
  store.setState('He');
  store.setState('Hel');
  store.setState('Hell');
  store.setState('Hello');

  await sleep(200);

  expect(subscriberCalls).toHaveBeenCalledTimes(2);
  expect(subscriberCalls.mock.calls).toEqual([
    [{ action: undefined, current: 'H', prev: '' }],
    [{ action: undefined, current: 'Hello', prev: 'Hell' }],
  ]);
});

test.concurrent('non consecutive updates', async () => {
  const store = new Store({
    state: '',
    debounceSideEffects: {
      wait: 100,
    },
  });

  const subscriberCalls = vi.fn();

  store.subscribe((args) => {
    subscriberCalls(args);
  });

  store.setState('H');
  await sleep(50);
  store.setState('He');
  await sleep(50);
  store.setState('Hel');
  await sleep(50);
  store.setState('Hell');
  await sleep(50);
  store.setState('Hello');
  await sleep(200);

  expect(subscriberCalls).toHaveBeenCalledTimes(2);
  expect(subscriberCalls.mock.calls).toEqual([
    [{ action: undefined, current: 'H', prev: '' }],
    [{ action: undefined, current: 'Hello', prev: 'Hell' }],
  ]);
});

test.concurrent('max wait time', async () => {
  const store = new Store({
    state: '',
    debounceSideEffects: {
      wait: 100,
      maxWait: 200,
    },
  });

  const subscriberCalls = vi.fn();

  store.subscribe((args) => {
    subscriberCalls(args);
  });

  store.setState('H');
  await sleep(90);
  store.setState('He');
  await sleep(90);
  store.setState('Hel');
  await sleep(90);
  store.setState('Hell');
  await sleep(90);
  store.setState('Hello');
  await sleep(110);

  expect(subscriberCalls).toHaveBeenCalledTimes(3);
  expect(subscriberCalls.mock.calls).toEqual([
    [{ action: undefined, current: 'H', prev: '' }],
    [{ action: undefined, current: 'Hell', prev: 'Hel' }],
    [{ action: undefined, current: 'Hello', prev: 'Hell' }],
  ]);
});
