import { startDevTools, Action } from './devTools';
import { dequal } from 'dequal/lite';
import { produce } from 'immer';
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector';

import { shallowEqual } from './shallowEqual';
import {
  deepFreeze,
  pick,
  unwrapValueSetter as unwrapValueArg,
  ValueArg,
} from './utils';

export { observeChanges, useSubscribeToStore } from './subscribeUtils';
export { useCreateStore } from './useCreateStore';

const deepEqual = dequal;

export { shallowEqual, deepEqual };

export type State = Record<string, any>;

export type Subscriber<T extends State> = {
  (props: { prev: T; current: T; action?: Action }): void;
};

export type EqualityFn = (prev: any, current: any) => boolean;

export type StoreProps<T> = {
  debugName?: string;
  state: T;
};

type UseStateOptions = {
  equalityFn?: EqualityFn | false;
};

export class Store<T extends State> {
  readonly debugName_: string = '';
  private state_: T;
  private subscribers_: Subscriber<T>[] = [];
  private batchUpdates_ = false;
  private lastState_: T;

  constructor({ debugName, state }: StoreProps<T>) {
    this.debugName_ = debugName || '';
    this.state_ =
      process.env.NODE_ENV === 'development' ? state : deepFreeze(state);
    this.lastState_ = state;

    const devToolsMiddeware =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? startDevTools : false);

    if (devToolsMiddeware && debugName) {
      this.subscribers_.push(
        devToolsMiddeware(debugName, state, (newState: T) => {
          this.setState(newState);
        }),
      );
    }
  }

  get state() {
    return this.state_;
  }

  private flush_(action: Action | undefined) {
    for (let i = 0; i < this.subscribers_.length; i++) {
      this.subscribers_[i]!({
        prev: this.lastState_,
        current: this.state_,
        action,
      });
    }
  }

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
  ) {
    const unwrapedNewState = unwrapValueArg(newState, this.state_);

    if (equalityCheck && equalityCheck(unwrapedNewState, this.state_)) return;

    this.lastState_ = { ...this.state_ };
    this.state_ =
      process.env.NODE_ENV === 'development'
        ? deepFreeze(unwrapedNewState)
        : unwrapedNewState;

    if (!this.batchUpdates_) {
      this.flush_(action);
    }
  }

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
  ) {
    if (equalityCheck) {
      if (equalityCheck === true) {
        if (this.state_[key] === value) return;
      } else {
        if (equalityCheck(this.state_[key], value)) return;
      }
    }

    this.setState(
      (current) => ({
        ...current,
        [key]: unwrapValueArg(value, current[key]),
      }),
      {
        action: action ?? { type: `${this.debugName_}.set.${key}`, key, value },
      },
    );
  }

  setPartialState(
    newState: Partial<T>,
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
  ) {
    if (equalityCheck) {
      if (equalityCheck(pick(this.state_, Object.keys(newState)), newState)) {
        return;
      }
    }

    this.setState((current) => ({ ...current, ...newState }), {
      action: action ?? { type: `${this.debugName_}.setPartial`, newState },
    });
  }

  /** set a new state mutanting the state with Immer produce function */
  produceState(
    recipe: (draftState: T) => void | T,
    {
      action,
      equalityCheck,
    }: {
      action?: Action;
      /** perform a equality check before setting the new value, by default a ===
       * equallity function is used, you can pass false to ignore the check or pass
       * a custom equality function
       */
      equalityCheck?: EqualityFn | false;
    } = {},
  ) {
    this.setState((current) => produce(current, recipe), {
      action: action ?? { type: 'produceState' },
      equalityCheck,
    });
  }

  batch(fn: () => void, action?: Action) {
    this.batchUpdates_ = true;
    fn();
    this.batchUpdates_ = false;
    this.flush_(action);
  }

  subscribe(
    callback: Subscriber<T>,
    { initCall }: { initCall?: boolean } = {},
  ) {
    if (!this.subscribers_.includes(callback)) {
      this.subscribers_.push(callback);
    }

    if (initCall) {
      callback({
        prev: this.state_,
        current: this.state_,
        action: { type: 'init.subscribe.call' },
      });
    }

    return () => {
      this.subscribers_.splice(this.subscribers_.indexOf(callback), 1);
    };
  }

  useSelector<S>(
    selector: (state: T) => S,
    { equalityFn = shallowEqual }: UseStateOptions = {},
  ): Readonly<S> {
    return useSyncExternalStoreWithSelector(
      this.subscribe.bind(this),
      () => this.state_,
      null,
      selector,
      equalityFn === false ? undefined : equalityFn,
    );
  }

  useKey<K extends keyof T>(
    key: K,
    { equalityFn = Object.is }: UseStateOptions = {},
  ): Readonly<T[K]> {
    return this.useSelector((s) => s[key], { equalityFn });
  }

  useState(options?: UseStateOptions) {
    return this.useSelector((s) => s, options);
  }

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
      typeof args[1] === 'object' && args[1].equalityFn
        ? args[1].equalityFn
        : shallowEqual;

    return this.useSelector((s) => pick(s, keys), { equalityFn });
  }
}
