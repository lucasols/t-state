/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
// TODO: remove fork comment and add credit to readme
import devtools, { Action } from './devTools';
import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { dequal } from 'dequal/lite';
import { produce } from 'immer';

import { shallowEqual as _sw } from './shallowEqual';
import { pick } from './utils';

export const deepEqual = dequal;
export const shallowEqual = _sw;

const isDev = process.env.NODE_ENV === 'development';

// TODO: allow state to be any serializable value
export type State = Record<string, any>;

export type Subscriber<T extends State> = {
  (prev: T, current: T, action?: Action): void;
};

export type ReducersPayloads = {
  [index: string]: any;
};

export type Reducers<T extends State, P extends ReducersPayloads> = {
  [K in keyof P]: (state: T, payload: P[K]) => T;
};

export type EqualityFn<T> = (
  prev: Readonly<T>,
  current: Readonly<T>,
) => boolean;

export type StoreProps<T, R> = {
  name?: string;
  state: T;
  reducers?: R;
};

export default class Store<
  T extends State,
  P extends ReducersPayloads = ReducersPayloads,
  R extends Reducers<T, P> = Reducers<T, P>,
> {
  readonly name?: string;

  private state: T;

  private reducers?: R;

  private subscribers: Subscriber<T>[] = [];

  constructor({ name, state, reducers }: StoreProps<T, R>) {
    this.name = name;
    this.state = state;
    this.reducers = reducers;

    const devToolsMiddeware =
      isDev &&
      typeof window !== 'undefined' &&
      ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? devtools : false);

    if (devToolsMiddeware && name) {
      this.subscribers.push(
        (devToolsMiddeware as any)(name, state, (newState: T) => {
          this.setState(newState);
        }),
      );
    }
  }

  getState() {
    return this.state as Readonly<T>;
  }

  setState(newState: T, action?: Action) {
    const prevState = { ...this.state };
    this.state = newState;

    for (let i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i]!(prevState, newState, action);
    }
  }

  setKey<K extends keyof T>(key: K, value: T[K]) {
    const newState: T = { ...this.state, [key]: value };

    this.setState(newState, { type: `${this.name}.set.${key}`, key, value });
  }

  dispatch<K extends keyof R>(
    type: K,
    ...payload: Parameters<R[K]>[1] extends undefined
      ? [undefined?]
      : [Parameters<R[K]>[1]]
  ) {
    if (!this.reducers?.[type]) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(`Action ${type} does not exist on store ${this.name}`);
      }

      return;
    }

    // HACK: assert param to avoid error
    const newState = this.reducers[type](this.state, payload[0] as P[K]);

    if (newState) {
      this.setState(newState, {
        type: `${this.name}.${type}`,
        payload: payload[0],
      });
    }
  }

  subscribe(callback: Subscriber<T>) {
    if (!this.subscribers.includes(callback)) {
      this.subscribers.push(callback);
    }

    return () => {
      this.subscribers.splice(this.subscribers.indexOf(callback), 1);
    };
  }

  useKey<K extends keyof T>(
    key: K,
    { equalityFn }: { equalityFn?: EqualityFn<T[K]> } = {},
  ) {
    const [state, set] = useState<Readonly<T[K]>>(this.state[key]);

    useEffect(() => {
      const setter = this.subscribe((prev, current) => {
        if (equalityFn) {
          if (!equalityFn(prev[key], current[key])) {
            set(current[key]);
          }
        } else if (prev[key] !== current[key]) {
          set(current[key]);
        }
      });

      return setter;
    }, []);

    if (
      process.env.NODE_ENV !== 'production' &&
      this.state[key] === undefined
    ) {
      throw new Error(
        `Key '${key}' for the store '${this.name}' does not exist`,
      );
    }

    const getter: () => Readonly<T[K]> = () => this.state[key];

    return [state, (value: T[K]) => this.setKey(key, value), getter] as const;
  }

  useSlice<K extends keyof T>(...keys: K[]): Readonly<Pick<T, K>>;
  useSlice<K extends keyof T>(
    keys: K[],
    options: { equalityFn?: EqualityFn<Pick<T, K>> },
  ): Readonly<Pick<T, K>>;
  useSlice<K extends keyof T>(
    ...args: K[] | [K[], { equalityFn?: EqualityFn<Pick<T, K>> }]
  ): Readonly<Pick<T, K>> {
    const keys = (typeof args[0] === 'string' ? args : args[0]) as K[];
    const areEqual =
      typeof args[1] === 'object' && args[1].equalityFn
        ? args[1].equalityFn
        : shallowEqual;

    const [state, set] = useState(pick(this.state, keys));

    useEffect(() => {
      const setter = this.subscribe((prev, current) => {
        const currentSlice = pick(current, keys);

        if (!areEqual(pick(prev, keys), currentSlice)) {
          set(currentSlice);
        }
      });

      return setter;
    }, []);

    return state;
  }

  useSelector<S extends (state: T) => any>(
    selector: S,
    {
      equalityFn = shallowEqual,
      selectorDeps = [],
    }: {
      equalityFn?: EqualityFn<ReturnType<S>> | false;
      selectorDeps?: any[];
    } = {},
  ): Readonly<ReturnType<S>> {
    const [state, set] = useState(selector(this.state));
    const isFirstRender = useRef(true);

    useLayoutEffect(() => {
      const setterSubscriber = this.subscribe((prev, current) => {
        const currentSelection = selector(current);
        if (equalityFn) {
          if (!equalityFn(selector(prev), currentSelection)) {
            set(currentSelection);
          }
        } else if (currentSelection !== selector(prev)) set(currentSelection);
      });

      if (isFirstRender.current) {
        isFirstRender.current = false;
      } else {
        set(selector(this.state));
      }

      return setterSubscriber;
    }, selectorDeps);

    return state;
  }

  useState(equalityFn?: EqualityFn<T>) {
    return this.useSelector((s) => s, { equalityFn });
  }

  /** set a new state mutanting the state with Immer produce function */
  produceState(recipe: (draftState: T) => void) {
    this.setState(produce(this.state, recipe), {
      type: 'produceState',
    });
  }
}
