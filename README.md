# T-State

A global state manager for React with Typescript in mind

## Creating stores

Stores can be strongly typed by passing the format of the state and optionally the reducers payloads.

```tsx
import Store from 't-state';

type TestState = {
  firstName: string;
  lastName: string;
};

const testStore = new Store<TestState>({
  debugName: 'test',
  state: {
    firstName: 'Hello',
    lastName: 'World',
  },
});
```

## Using in components

Each store has hooks that can be used to derive/select state

### `useSelector`

Allows for the selection or derivation of any value from a store and triggers re-renders whenever the selector value changes, eliminating unnecessary rerenders.

```tsx
const Component: React.FC = () => {
  const fullName = testStore.useSelector(
    (state) => `${state.firstName} ${state.lastName}`,
  );

  return <div>Name: {fullName}</div>;
};
```

By default, values are compared using shallow equality check, which compares values up to one level of depth. For more complex comparisons, you can use `deepEqual` or another custom equality function to avoid re-renders.

```tsx
import { deepEqual } from 't-state';

const Component = () => {
  const fullName = testStore.useSelector(
    (state) =>
      [
        [
          {
            firstName: state.firstName,
          },
        ],
        [
          {
            lastName: state.lastName,
          },
        ],
      ] as const,
    { equalityFn: deepEqual },
  );

  return (
    <div>
      Name: {fullName[0][0].firstName} {fullName[1][0].lastName}
    </div>
  );
};
```

### `useKey`

`useKey` is a hook that returns the value of a specific key.

```tsx
const Component: React.FC = () => {
  const firstName = testStore.useKey('firstName');

  return (
    <>
      <div>Name: {firstName}</div>

      <input
        onChange={(e) => testStore.setKey('firstName', e.currentTarget.value)}
      />
    </>
  );
};
```

## Changing state

State changes can be made through the methods `setKey`, `setState`, and `setPartialState`, or by mutation using [immer](https://immerjs.github.io/immer/)

### Updating state via immer

With `produceState`, it is possible to change the state by mutating the values while maintaining the store's immutability. This is especially useful for updating "deep nested values". For more details and possibilities, consult the [immer documentation](https://immerjs.github.io/immer/update-patterns)

```tsx
testStore.produceState((draftState) => {
  draftState.firstName = 'John';
  draftState.lastName = 'Doe';
});

testStore.produceState((draftState) => {
  draftState.updating.aReally.deep.value = 'new value';
});
```

## Debug via Redux Dev Tools

The [Redux Dev Tools](https://chrome.google.com/webstore/detail/redux-devtools/lmhkpmbekcpmknklioeibfkpmmfibljd?hl=en) allows you to visualize all changes in each store.

## Reacting to state changes

Outside of React, you can react to state changes with the `subscribe` method. It returns a function to unsubscribe from the subscription.

```tsx
const unsubscribe = testStore.subscribe((prev, current) => {
  console.log('prev name', prev.firstName, prev.lastName);

  console.log('new name', current.firstName, current.lastName);
});

// unsubscribing
unsubscribe();
```

Using the `observeChanges` util, you can react more selectively to changes.

```tsx
import { observeChanges } from 't-state';

testStore.subscribe((prev, current) => {
  const observe = observeChanges(prev, current);

  observe
    .ifSelector((s) => `${s.firstName} ${s.lastName}`)
    .change.then((currentResult, prevResult) => {
      console.log('full name changed from', prevResult, 'to', currentResult);
    });
});
```

## Creating stores inside components

Stores can also be created inside components using the `useCreateStore` hook allowing atomic updates optimization

```tsx
import { useCreateStore } from 't-state/hooks';

type TestState = {
  numOfClicks1: number;
  numOfClicks2: number;
};

const Component = () => {
  const testState = useCreateStore<TestState>({
    name: 'teste',
    state: {
      numOfClicks1: 0,
      numOfClicks2: 0,
    },
  });

  return (
    <>
      <Child store={testState} id="numOfClicks1" />
      <Child store={testState} id="numOfClicks1" />
    </>
  );
};

type ChildProps = {
  store: Store<TestState>;
  id: keyof TestState;
};

const Child = ({ store, id }: ChildProps) => {
  const [numOfClicks, setNumOfClicks] = store.useKey(id);

  return (
    <button type="button" onClick={() => setNumOfClicks(numOfClicks + 1)}>
      {id} num of clicks: {numOfClicks}
    </button>
  );
};
```

In the example above, each child component is only rendered when the part of the store it uses is changed, unlike what would happen if a simple `useState` was used.

## Using middlewares

Middlewares can be used to intercept state change actions and block or modify the state.

```ts
const store = new Store({ state: { value: 0 } });

store.addMiddleware(({ current, next, action }) => {
  if (next.value < 0) {
    return false; // block state changes
  }

  if (next.value > 10) {
    return { value: 10 }; // return a new state to change the state
  }

  return true; // return true or `undefined` to do nothing
});
```

## Create computed states

Computed states are states that are derived from other stores and are updated whenever the states they depend on change. The return of `computed` function is a store with some readonly methods like `subscribe` and `useState`

```ts
const store1 = new Store({ state: 2 });

const doubledValue = computed(store1, (state) => state * 2);

console.log(doubledValue.state); // 4
```

Use `useComputed` for creating computed states stores inside components

```tsx
const Component = () => {
  const store1 = new Store({ state: 2 });

  const doubledValue = useComputed(store1, (state) => state * 2);

  const value = doubledValue.useState();

  return <div>{value}</div>;
};
```

## Lazy initialization

Stores can be initialized lazily using functions for better performance:

```ts
const store = new Store({
  state: () => ({
    expensiveData: computeExpensiveData(),
    timestamp: Date.now(),
  }),
});
```

## State batching

Multiple state updates can be batched together to prevent unnecessary renders:

```ts
store.batch(() => {
  store.setKey('firstName', 'John');
  store.setKey('lastName', 'Doe');
  store.setKey('age', 30);
});
// Only one re-render occurs after all updates
```

## Equality functions

T-State provides built-in equality functions to optimize re-renders:

```ts
import { shallowEqual, deepEqual } from 't-state';

// Use shallow equality (default)
const name = store.useSelector(
  (state) => ({ first: state.firstName, last: state.lastName }),
  { equalityFn: shallowEqual },
);

// Use deep equality for complex objects
const complexData = store.useSelector((state) => state.nestedObject, {
  equalityFn: deepEqual,
});
```

## Debounce state changes

State changes can be throttled using the `debounceSideEffects` option

```ts
const store = new Store({
  state: { value: 0 },
  debounceSideEffects: {
    wait: 1000,
    maxWait: 2000,
  },
});
```

## API Reference

### Store Class

#### Constructor Options

```ts
type StoreProps<T> = {
  state: T | (() => T);
  debugName?: string;
  debounceSideEffects?: {
    wait: number;
    maxWait?: number;
  };
};
```

#### Methods

- **`setKey<K extends keyof T>(key: K, value: T[K]): void`** - Set a specific key in the state
- **`setState(state: T): void`** - Replace the entire state
- **`setPartialState(partialState: Partial<T>): void`** - Update multiple keys at once
- **`produceState(producer: (draft: T) => void): void`** - Update state using Immer draft
- **`batch(fn: () => void): void`** - Batch multiple state updates
- **`subscribe(callback: (prev: T, current: T) => void): () => void`** - Subscribe to state changes
- **`addMiddleware(middleware: MiddlewareFn<T>): void`** - Add middleware for state changes

#### Hooks

- **`useSelector<S>(selector: (state: T) => S, options?: SelectorOptions): S`** - Select derived state
- **`useKey<K extends keyof T>(key: K): T[K]`** - Get value of specific key
- **`useState(): T`** - Get entire state

### External Hooks

#### From `t-state/hooks`

- **`useCreateStore<T>(props: StoreProps<T>): Store<T>`** - Create store within component
- **`useStoreSnapshot<T, S>(store: Store<T>, selector: (state: T) => S, when: (state: T) => boolean): S`** - Conditional state snapshots
- **`useSelectFromStore<T, S>(store: Store<T>, selector: (state: T) => S, options?: SelectorOptions): S`** - External store selection

### Computed States

#### From `t-state/computed`

- **`computed<T, S>(store: Store<T>, selector: (state: T) => S): ComputedStore<S>`** - Create computed state
- **`useComputed<T, S>(store: Store<T>, selector: (state: T) => S): ComputedStore<S>`** - Create computed state in component

### Utility Functions

#### From `t-state`

- **`shallowEqual(a: any, b: any): boolean`** - Shallow equality comparison
- **`deepEqual(a: any, b: any): boolean`** - Deep equality comparison
- **`observeChanges(prev: T, current: T): ChangeObserver<T>`** - Observe specific changes

#### Types

```ts
type SelectorOptions = {
  equalityFn?: EqualityFn | false;
};

type EqualityFn = (a: any, b: any) => boolean;

type MiddlewareFn<T> = {
  (args: { current: T; next: T; action: string }): boolean | T | void;
};
```

## Project Structure

```
src/
├── main.ts                           # Core Store class and main functionality
├── hooks.tsx                         # Additional React hooks
├── computed.ts                       # Computed states functionality
├── subscribeUtils.ts                 # Subscription utilities and observeChanges
├── deepEqual.ts                      # Deep equality comparison utility
├── shallowEqual.ts                   # Shallow equality comparison utility
├── useSyncExternalStoreWithSelector.ts  # Custom external store hook implementation
├── devTools.ts                       # Redux DevTools integration
└── utils.ts                          # General utility functions

test/                                 # Test files
├── setup.ts                          # Test environment setup
├── *.test.ts                         # Individual test files
└── *.test.tsx                        # React component tests
```

### Key Files

- **`main.ts`** - Contains the core `Store` class with all state management functionality
- **`hooks.tsx`** - Additional React hooks like `useCreateStore`, `useStoreSnapshot`, `useSelectFromStore`
- **`computed.ts`** - Computed state functionality that automatically updates when dependencies change
- **`subscribeUtils.ts`** - Contains `observeChanges` utility for selective change observation
- **Equality utilities** - `deepEqual.ts` and `shallowEqual.ts` provide optimized comparison functions
- **DevTools integration** - Redux DevTools support for debugging in development
