# T-State

A global state manager for React with Typescript in mind

## Creating stores

Stores can be strongly typed by passing the format of the state and optionally the reducers payloads. The state must be passed as an object

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
const Component = () => {
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
const Component = () => {
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

With `produceState`, it is possible to change the state by mutating the values while maintaining the store's immutability. This is especially useful for updating "deep nested values". For more details and possibilities, consult the [documentação do immer](https://immerjs.github.io/immer/update-patterns)

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

testState.subscribe((prev, current) => {
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
import { useCreateStore } from 't-state/useCreateStore';

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
  if (value < 0) {
    return false; // block state changes
  }

  if (value > 10) {
    return { value: 10 }; // return a new state to change the state
  }

  return true; // return true or `undefined` to do nothing
});
```
