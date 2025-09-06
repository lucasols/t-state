import { isDraftable, produce } from 'immer';
import { startDevTools } from './devTools';

import { useCallback } from 'react';
import { deepEqual } from './deepEqual';
import { shallowEqual } from './shallowEqual';
import { useSyncExternalStoreWithSelector } from './useSyncExternalStoreWithSelector';
import type { ValueArg } from './utils';
import { isFunction, pick, unwrapValueSetter as unwrapValueArg } from './utils';

export { useCreateStore, useSelectFromStore, useStoreSnapshot } from './hooks';
export { observeChanges, useSubscribeToStore } from './subscribeUtils';

export { computed, useComputed } from './computed';
export type { ComputedStore } from './computed';

export { deepEqual, shallowEqual, useSyncExternalStoreWithSelector };

/**
 * Action object or string that describes a state change.
 * Used for debugging, middleware, and Redux DevTools integration.
 */
export type Action =
  | {
      type: string;
      [k: string]: any;
    }
  | string;

/**
 * Function called when store state changes.
 *
 * @template T - The type of the store state
 */
export type Subscriber<T> = {
  (props: { prev: T; current: T; action: Action | undefined }): void;
};

/**
 * Function that compares two values for equality.
 * Used to prevent unnecessary re-renders when values haven't actually changed.
 */
export type EqualityFn = (prev: any, current: any) => boolean;

type AnyObj = Record<string, unknown>;

/**
 * Configuration options for creating a new Store instance.
 *
 * @template T - The type of the store state
 */
export type StoreProps<T> = {
  /** Name for debugging and Redux DevTools integration */
  debugName?: string;
  /** Initial state value or lazy initialization function */
  state: T | (() => T);
  /** Configuration for debouncing state change notifications */
  debounceSideEffects?: {
    /** Minimum wait time in milliseconds between notifications */
    wait: number;
    /** Maximum wait time in milliseconds before forcing a notification */
    maxWait?: number;
  };
  /** Whether to disable deep freezing in development mode */
  disableDeepFreezeInDev?: boolean;
  /** Function to determine which values to skip during deep freezing */
  ignoreValueInDeepFreeze?: (value: unknown) => boolean;
};

/**
 * Options for React hooks that subscribe to store state.
 */
export type UseStateOptions = {
  /** Function to compare previous and current values, or false to disable equality checking */
  equalityFn?: EqualityFn | false;
  /** Whether to update selector based on external dependencies */
  useExternalDeps?: boolean;
};

/**
 * Middleware function that can intercept and modify state changes.
 *
 * @template T - The type of the store state
 * @returns false to block the change, true to allow it, or a new state to replace it
 */
type StoreMiddleware<T> = (props: {
  /** Current state before the change */
  current: T;
  /** Proposed next state */
  next: T;
  /** Action that triggered the change */
  action: Action | undefined;
}) => T | boolean;

type UnsubscribeFn = () => void;

/**
 * Special action used when a subscriber is called immediately upon subscription.
 */
export const initCallAction = { type: 'init.subscribe.call' };

/**
 * A reactive store for managing application state with React integration.
 *
 * @template T - The type of the state object
 *
 * @example
 * ```ts
 * const store = new Store({
 *   state: { count: 0, name: 'example' },
 *   debugName: 'myStore'
 * });
 * ```
 */
export class Store<T> {
  readonly debugName_: string = '';
  subscribers_: Set<Subscriber<T>> = new Set<Subscriber<T>>();
  private batchUpdates_ = false;
  private state_: T | undefined;
  private lazyInitialState_: (() => T) | undefined;
  private lastState_: T | undefined;
  private debounceSideEffects_?: { wait: number; maxWait?: number };
  private lastFlushCallTimestamp_ = 0;
  private lastFlushTimestamp_ = 0;
  private debouncedFlushTimeout_?: NodeJS.Timeout;
  private disableDeepFreezeInDev_: boolean;
  private ignoreValueInDeepFreeze_?: (value: unknown) => boolean;
  private middlewares_ = new Set<StoreMiddleware<T>>();
  private hasPendingFlush_ = false;
  private isFlushing_ = false;
  private pendingFlushQueue_: Array<Action | undefined> = [];

  /**
   * Creates a new Store instance.
   *
   * @param options - Store configuration options
   * @param options.state - Initial state value or lazy initialization function
   * @param options.debugName - Name for debugging and Redux DevTools integration
   * @param options.debounceSideEffects - Configuration for debouncing state change notifications
   * @param options.disableDeepFreezeInDev - Whether to disable deep freezing in development mode
   * @param options.ignoreValueInDeepFreeze - Function to determine which values to skip during deep freezing
   */
  constructor({
    debugName,
    state,
    disableDeepFreezeInDev,
    debounceSideEffects,
    ignoreValueInDeepFreeze,
  }: StoreProps<T>) {
    const initialStateIsLazy = isFunction(state);

    this.debugName_ = debugName || '';
    this.lazyInitialState_ = initialStateIsLazy ? state : undefined;
    this.state_ =
      initialStateIsLazy ? undefined
      : process.env.NODE_ENV === 'development' && !disableDeepFreezeInDev ?
        deepFreeze(state, ignoreValueInDeepFreeze)
      : state;
    this.lastState_ = initialStateIsLazy ? undefined : state;
    this.disableDeepFreezeInDev_ = disableDeepFreezeInDev || false;
    this.ignoreValueInDeepFreeze_ = ignoreValueInDeepFreeze;
    this.debounceSideEffects_ = debounceSideEffects;

    const devToolsMiddleware =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? startDevTools : false);

    if (devToolsMiddleware && debugName) {
      this.subscribers_.add(
        devToolsMiddleware(debugName, state, (newState) => {
          this.setState(newState as T);
        }),
      );
    }
  }

  /**
   * Whether the store has been initialized (state has been accessed at least once).
   * For lazy-initialized stores, this returns false until the state is first accessed.
   */
  get isInitialized(): boolean {
    return this.state_ !== undefined;
  }

  /**
   * Gets the current state of the store.
   * For lazy-initialized stores, this will initialize the state on first access.
   *
   * @returns The current state
   */
  get state(): T {
    if (this.state_ === undefined) {
      this.state_ = this.lazyInitialState_!();
      this.lazyInitialState_ = undefined;
      this.lastState_ = this.state_;
    }

    return this.state_;
  }

  /**
   * Manually initializes the store (for lazy-initialized stores).
   *
   * @returns The initialized state
   */
  initializeStore(): T {
    return this.state;
  }

  private get lastState(): T {
    if (this.lastState_ === undefined) {
      this.state_ = this.lazyInitialState_!();
      this.lazyInitialState_ = undefined;
      this.lastState_ = this.state_;
    }

    return this.lastState_;
  }

  private flush_(action: Action | undefined) {
    if (this.batchUpdates_) {
      this.hasPendingFlush_ = true;
      return;
    }

    // If we're already flushing, queue this flush to run later
    if (this.isFlushing_) {
      this.pendingFlushQueue_.push(action);
      return;
    }

    if (this.debounceSideEffects_) {
      clearTimeout(this.debouncedFlushTimeout_);

      const now = Date.now();
      const timeSinceLastFlushCall = now - this.lastFlushCallTimestamp_;
      const timeSinceLastFlush = now - this.lastFlushTimestamp_;
      const shouldFlush =
        timeSinceLastFlushCall >= this.debounceSideEffects_.wait ||
        (this.debounceSideEffects_.maxWait &&
          timeSinceLastFlush >= this.debounceSideEffects_.maxWait);

      this.lastFlushCallTimestamp_ = now;

      if (!shouldFlush) {
        this.debouncedFlushTimeout_ = setTimeout(
          () => this.flush_(action),
          this.debounceSideEffects_.wait,
        );
        return;
      }

      this.lastFlushTimestamp_ = now;
    }

    this.isFlushing_ = true;

    const prev = this.lastState;
    const current = this.state;

    for (const subscriber of this.subscribers_) {
      subscriber({ prev, current, action });
    }

    this.isFlushing_ = false;

    // Process any queued flushes that occurred during subscriber notifications
    while (this.pendingFlushQueue_.length > 0) {
      const queuedAction = this.pendingFlushQueue_.shift();
      this.flush_(queuedAction);
    }
  }

  /**
   * Sets the entire state of the store.
   *
   * @param newState - The new state value or a function that receives the current state and returns the new state
   * @param options - Configuration options
   * @param options.action - Optional action to associate with this state change
   * @param options.equalityCheck - Equality check function to prevent unnecessary updates (default: Object.is)
   * @returns true if the state was changed, false if it was the same
   *
   * @example
   * ```ts
   * store.setState({ count: 5, name: 'updated' });
   * store.setState(prev => ({ ...prev, count: prev.count + 1 }));
   * ```
   */
  setState(
    newState: ValueArg<T>,
    {
      action,
      equalityCheck = Object.is,
    }: {
      action?: Action;
      /** by default a simple equality check is performed before setting the new
       * value, you can pass false to ignore the check or pass a custom equality function */
      equalityCheck?: EqualityFn | false;
    } = {},
  ): boolean {
    let unwrappedNewState = unwrapValueArg(newState, this.state);

    if (equalityCheck && equalityCheck(unwrappedNewState, this.state))
      return false;

    for (const middleware of this.middlewares_) {
      const result = middleware({
        current: this.state,
        next: unwrappedNewState,
        action,
      });

      if (result === false) return false;

      if (result !== true && result !== unwrappedNewState) {
        unwrappedNewState = result;
      }
    }

    this.lastState_ = shallowCloneState(this.state);
    this.state_ =
      process.env.NODE_ENV === 'development' && !this.disableDeepFreezeInDev_ ?
        deepFreeze(unwrappedNewState, this.ignoreValueInDeepFreeze_)
      : unwrappedNewState;

    this.flush_(action);

    return true;
  }

  /**
   * Sets the value for a specific key in the state.
   *
   * @param key - The key to update
   * @param value - The new value or a function that receives the current value and returns the new value
   * @param options - Configuration options
   * @param options.action - Optional action to associate with this state change
   * @param options.equalityCheck - Whether to perform equality check (default: true)
   *
   * @example
   * ```ts
   * store.setKey('count', 10);
   * store.setKey('name', prev => prev.toUpperCase());
   * ```
   */
  setKey<K extends keyof T>(
    key: K,
    value: ValueArg<T[K]>,
    {
      action,
      equalityCheck = true,
    }: {
      action?: Action;
      /** by default a simple equality check is performed before setting the new
       * value, you can pass false to ignore the check or pass a custom equality function */
      equalityCheck?: boolean | EqualityFn;
    } = {},
  ): void {
    if (equalityCheck) {
      const nextValue = unwrapValueArg(value, this.state[key]);
      if (equalityCheck === true) {
        if (this.state[key] === nextValue) return;
      } else {
        if (equalityCheck(this.state[key], nextValue)) return;
      }
    }

    this.setState(
      (current) => ({
        ...current,
        [key]: unwrapValueArg(value, current[key]),
      }),
      {
        action: action ?? {
          type: `${this.debugName_}.set.${String(key)}`,
          key,
          value,
        },
      },
    );
  }

  /**
   * Updates multiple keys in the state using partial update.
   *
   * @param newState - Partial state object with keys to update
   * @param options - Configuration options
   * @param options.action - Optional action to associate with this state change
   * @param options.equalityCheck - Equality check function (default: shallowEqual)
   *
   * @example
   * ```ts
   * store.setPartialState({ count: 5, name: 'updated' });
   * ```
   */
  setPartialState(
    newState: T extends AnyObj ? Partial<T> : never,
    {
      action,
      equalityCheck = shallowEqual,
    }: {
      action?: Action;
      /** perform a equality check before setting the new value, by default a shallow
       * equal function is used, you can pass false to ignore the check or pass
       * a custom equality function
       */
      equalityCheck?: EqualityFn | false;
    } = {},
  ): void {
    if (equalityCheck) {
      if (
        equalityCheck(
          pick(this.state as AnyObj, Object.keys(newState)),
          newState,
        )
      ) {
        return;
      }
    }

    this.setState((current) => ({ ...current, ...newState }), {
      action: action ?? { type: `${this.debugName_}.setPartial`, newState },
    });
  }

  /**
   * Updates the state using Immer's produce function for immutable mutations.
   *
   * @param recipe - Function that receives a draft state and mutates it
   * @param options - Configuration options
   * @param options.action - Optional action to associate with this state change
   * @param options.equalityCheck - Equality check function (default: ===)
   *
   * @example
   * ```ts
   * store.produceState(draft => {
   *   draft.count += 1;
   *   draft.nested.value = 'new';
   * });
   * ```
   */
  produceState(
    recipe: (draftState: T) => void | T,
    {
      action,
      equalityCheck,
    }: {
      action?: Action;
      /** perform a equality check before setting the new value, by default a ===
       * equality function is used, you can pass false to ignore the check or pass
       * a custom equality function
       */
      equalityCheck?: EqualityFn | false;
    } = {},
  ): boolean {
    return this.setState((current) => produce(current, recipe), {
      action: action ?? { type: 'produceState' },
      equalityCheck,
    });
  }

  /**
   * Batches multiple state updates into a single notification to subscribers.
   *
   * @param fn - Function that contains multiple state updates
   * @param action - Optional action to associate with the batched updates
   *
   * @example
   * ```ts
   * store.batch(() => {
   *   store.setKey('count', 1);
   *   store.setKey('name', 'batched');
   *   // Only one subscriber notification will fire
   * });
   * ```
   */
  batch(fn: () => void, action?: Action): void {
    if (this.batchUpdates_) {
      fn();
      return;
    }

    this.batchUpdates_ = true;
    fn();
    this.batchUpdates_ = false;

    if (this.hasPendingFlush_) {
      this.hasPendingFlush_ = false;
      this.flush_(action);
    }
  }

  /**
   * Temporarily stops flushing state changes to subscribers.
   * Use this to prevent notifications during complex operations.
   * Must be paired with resumeFlush().
   *
   * @see resumeFlush
   */
  stopFlush(): void {
    this.batchUpdates_ = true;
  }

  /**
   * Resumes flushing state changes to subscribers after stopFlush().
   * If there are pending changes, they will be flushed immediately.
   *
   * @see stopFlush
   */
  resumeFlush(): void {
    this.batchUpdates_ = false;

    if (this.hasPendingFlush_) {
      this.hasPendingFlush_ = false;
      this.flush_(undefined);
    }
  }

  /**
   * Subscribes to state changes in the store.
   *
   * @param callback - Function called when state changes
   * @param options - Configuration options
   * @param options.initCall - Whether to call the callback immediately with current state
   * @returns Function to unsubscribe from the store
   *
   * @example
   * ```ts
   * const unsubscribe = store.subscribe(({ prev, current }) => {
   *   console.log('State changed:', prev, '->', current);
   * });
   *
   * // Later...
   * unsubscribe();
   * ```
   */
  subscribe(
    callback: Subscriber<T>,
    { initCall }: { initCall?: boolean } = {},
  ): UnsubscribeFn {
    if (!this.subscribers_.has(callback)) {
      this.subscribers_.add(callback);
    }

    if (initCall) {
      callback({
        prev: this.state,
        current: this.state,
        action: initCallAction,
      });
    }

    return () => {
      this.subscribers_.delete(callback);
    };
  }

  /**
   * Adds middleware to intercept and modify state changes.
   * Middleware can block, modify, or allow state updates.
   *
   * @param middleware - Function that receives current state, next state, and action
   * @returns Function to remove the middleware
   *
   * @example
   * ```ts
   * const removeMiddleware = store.addMiddleware(({ current, next, action }) => {
   *   if (next.value < 0) return false; // Block negative values
   *   if (next.value > 100) return { ...next, value: 100 }; // Cap at 100
   *   return true; // Allow change
   * });
   *
   * // Later remove the middleware
   * removeMiddleware();
   * ```
   */
  addMiddleware(middleware: StoreMiddleware<T>): UnsubscribeFn {
    this.middlewares_.add(middleware);

    return () => {
      this.middlewares_.delete(middleware);
    };
  }

  private getState_ = () => {
    return this.state;
  };

  /**
   * React hook to select and subscribe to a derived value from the store.
   * The component will re-render only when the selected value changes.
   *
   * @param selector - Function that derives a value from the state
   * @param options - Configuration options
   * @param options.equalityFn - Function to compare previous and current selected values (default: shallowEqual)
   * @param options.useExternalDeps - Whether to update selector based on external dependencies
   * @returns The selected value
   *
   * @example
   * ```tsx
   * const Component = () => {
   *   const fullName = store.useSelector(state => `${state.first} ${state.last}`);
   *   return <div>{fullName}</div>;
   * };
   * ```
   */
  useSelector<S>(
    selector: (state: T) => S,
    { equalityFn = shallowEqual, useExternalDeps }: UseStateOptions = {},
  ): Readonly<S> {
    const memoizedSelector = useCallback(
      (s: T) => selector(s),
      [useExternalDeps ? selector : 0],
    );

    return useSyncExternalStoreWithSelector(
      this.subscribe.bind(this),
      this.getState_,
      null,
      memoizedSelector,
      equalityFn === false ? undefined : equalityFn,
    );
  }

  /**
   * React hook to select and subscribe to a derived value from the store (runtime callable version).
   * Similar to useSelector but optimized for usage with react compiler.
   *
   * @param selector - Function that derives a value from the state
   * @param options - Configuration options
   * @param options.equalityFn - Function to compare previous and current selected values (default: shallowEqual)
   * @returns The selected value
   */
  useSelectorRC<S>(
    selector: (state: T) => S,
    {
      equalityFn = shallowEqual,
    }: {
      equalityFn?: EqualityFn | false;
    } = {},
  ): Readonly<S> {
    return useSyncExternalStoreWithSelector(
      this.subscribe.bind(this),
      this.getState_,
      null,
      selector,
      equalityFn === false ? undefined : equalityFn,
    );
  }

  /**
   * React hook to subscribe to a specific key in the store state.
   * The component will re-render only when the value of this key changes.
   *
   * @param key - The state key to subscribe to
   * @param options - Configuration options
   * @param options.equalityFn - Function to compare previous and current values (default: Object.is)
   * @returns The current value of the key
   *
   * @example
   * ```tsx
   * const Component = () => {
   *   const count = store.useKey('count');
   *   return <div>{count}</div>;
   * };
   * ```
   */
  useKey<K extends keyof T>(
    key: K,
    { equalityFn = Object.is }: UseStateOptions = {},
  ): Readonly<T[K]> {
    return this.useSelector((s) => s[key], { equalityFn });
  }

  /**
   * React hook to subscribe to the entire store state.
   * The component will re-render when any part of the state changes.
   *
   * @param options - Configuration options
   * @param options.equalityFn - Function to compare previous and current state (default: shallowEqual)
   * @returns The current state
   *
   * @example
   * ```tsx
   * const Component = () => {
   *   const state = store.useState();
   *   return <div>{state.count} - {state.name}</div>;
   * };
   * ```
   */
  useState(options?: UseStateOptions): Readonly<T> {
    return this.useSelector((s) => s, options);
  }

  /**
   * React hook to subscribe to multiple specific keys from the store state.
   * The component will re-render when any of the specified keys change.
   *
   * @param keys - Array of keys or individual keys as arguments
   * @param options - Configuration options (when using array form)
   * @param options.equalityFn - Function to compare previous and current values (default: shallowEqual)
   * @returns Object containing only the specified keys
   *
   * @example
   * ```tsx
   * // Using spread syntax
   * const { count, name } = store.useSlice('count', 'name');
   *
   * // Using array syntax with options
   * const slice = store.useSlice(['count', 'name'], { equalityFn: deepEqual });
   * ```
   */
  useSlice<K extends keyof T>(...keys: K[]): Readonly<Pick<T, K>>;
  useSlice<K extends keyof T>(
    keys: K[],
    options?: UseStateOptions,
  ): Readonly<Pick<T, K>>;
  useSlice<K extends keyof T>(
    ...args: K[] | [K[], UseStateOptions]
  ): Readonly<Pick<T, K>> {
    const keys = (typeof args[0] === 'string' ? args : args[0]) as K[];
    const equalityFn =
      typeof args[1] === 'object' && args[1].equalityFn ?
        args[1].equalityFn
      : shallowEqual;

    return this.useSelector(
      (s) => pick(s as AnyObj, keys as string[]) as Pick<T, K>,
      { equalityFn },
    );
  }
}

/**
 * Recursively freezes an object and all its nested properties.
 * Used in development mode to ensure state immutability.
 *
 * @param obj - The object to freeze
 * @param ignore - Optional function to determine which values to skip freezing
 * @returns The frozen object
 *
 * @example
 * ```ts
 * const frozenState = deepFreeze({ user: { name: 'John' } });
 * // frozenState and frozenState.user are both frozen
 * ```
 */
export function deepFreeze<T>(
  obj: T,
  ignore: ((value: unknown) => boolean) | undefined,
): T {
  if (
    obj === null ||
    typeof obj !== 'object' ||
    Object.isFrozen(obj) ||
    !isDraftable(obj) ||
    (ignore && ignore(obj))
  ) {
    return obj;
  }

  Object.freeze(obj);

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      deepFreeze(obj[key], ignore);
    }
  }

  return obj;
}

function shallowCloneState<T>(state: T): T {
  if (Array.isArray(state)) {
    return [...state] as T;
  }

  if (typeof state === 'object' && state !== null) {
    return { ...state };
  }

  return state;
}
