import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { useMemo } from 'react';
import { afterEach, expect, test } from 'vitest';
import { createStoreContext } from '../src/hooks';
import { Store, useSubscribeToStore } from '../src/main';

afterEach(() => {
  cleanup();
});

test('rerender childs when context changes', () => {
  const Context = createStoreContext<{ count: number }>();

  const child2Renders: number[] = [];
  let childRenders = 0;

  function ParentComponent() {
    const { Provider } = Context.useCreate({ count: 0 });

    return (
      <Provider>
        <ChildComponent />
      </Provider>
    );
  }

  function ChildComponent() {
    childRenders++;

    return (
      <div>
        <ChildComponent2 />
      </div>
    );
  }

  function ChildComponent2() {
    const count = Context.useKey('count');
    const context = Context.useStore();

    child2Renders.push(count);

    return (
      <button role="button" onClick={() => context.setKey('count', count + 1)}>
        {count}
      </button>
    );
  }

  const { getByRole } = render(<ParentComponent />);

  const button = getByRole('button');

  fireEvent.click(button);

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1]);

  act(() => {
    fireEvent.click(button);
  });

  act(() => {
    fireEvent.click(button);
  });

  act(() => {
    fireEvent.click(button);
  });

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1, 2, 3, 4]);
});

test('update childs when parent values changes', () => {
  const Context = createStoreContext<{ count: number }>();
  const anotherStore = new Store({ state: { count: 0 } });

  const child2Renders: number[] = [];
  let childRenders = 0;

  function ParentComponent() {
    const count = anotherStore.useKey('count');

    const TestContext = Context.useCreate({ count });

    const child = useMemo(() => <ChildComponent />, []);

    return <TestContext.Provider>{child}</TestContext.Provider>;
  }

  function ChildComponent() {
    childRenders++;

    return (
      <div>
        <ChildComponent2 />
      </div>
    );
  }

  function ChildComponent2() {
    const count = Context.useKey('count');

    child2Renders.push(count);

    return <button role="button">{count}</button>;
  }

  render(<ParentComponent />);

  act(() => {
    anotherStore.setKey('count', 1);
  });

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1]);

  act(() => {
    anotherStore.setKey('count', 2);
  });

  act(() => {
    anotherStore.setKey('count', 3);
  });

  act(() => {
    anotherStore.setKey('count', 4);
  });

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1, 2, 3, 4]);
});

test('update childs when parent values changes, init state function', () => {
  const Context = createStoreContext<{ count: number }>();
  const anotherStore = new Store({ state: { count: 0 } });

  const child2Renders: number[] = [];
  let childRenders = 0;

  function ParentComponent() {
    const TestContext = Context.useCreate(() => ({ count: 0 }));

    useSubscribeToStore(anotherStore, ({ current }) => {
      TestContext.store.setKey('count', current.count);
    });

    return (
      <TestContext.Provider>
        <ChildComponent />
      </TestContext.Provider>
    );
  }

  function ChildComponent() {
    childRenders++;

    return (
      <div>
        <ChildComponent2 />
      </div>
    );
  }

  function ChildComponent2() {
    const count = Context.useKey('count');

    child2Renders.push(count);

    return <button role="button">{count}</button>;
  }

  render(<ParentComponent />);

  act(() => {
    anotherStore.setKey('count', 1);
  });

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1]);

  act(() => {
    anotherStore.setKey('count', 2);
  });

  act(() => {
    anotherStore.setKey('count', 3);
  });

  act(() => {
    anotherStore.setKey('count', 4);
  });

  expect(childRenders).toEqual(1);
  expect(child2Renders).toEqual([0, 1, 2, 3, 4]);
});

test('throw error when useStoreContext without provider', () => {
  const Context = createStoreContext<{ count: number }>();

  function ChildComponent() {
    const count = Context.useKey('count');

    return <button role="button">{count}</button>;
  }

  expect(() => render(<ChildComponent />)).toThrowError(
    'context provider not found',
  );
});

test('useHasContext false', () => {
  const Context = createStoreContext<{ count: number }>();

  function ChildComponent() {
    const hasContext = Context.useHasContext();

    return <button role="button">{hasContext ? 'true' : 'false'}</button>;
  }

  const { getByRole } = render(<ChildComponent />);

  const button = getByRole('button');

  expect(button.textContent).toEqual('false');
});

test('useHasContext true', () => {
  const Context = createStoreContext<{ count: number }>();

  function ChildComponent() {
    const hasContext = Context.useHasContext();

    return <button role="button">{hasContext ? 'true' : 'false'}</button>;
  }

  function ParentComponent() {
    const { Provider } = Context.useCreate({ count: 0 });

    return (
      <Provider>
        <ChildComponent />
      </Provider>
    );
  }

  const { getByRole } = render(<ParentComponent />);

  const button = getByRole('button');

  expect(button.textContent).toEqual('true');
});
