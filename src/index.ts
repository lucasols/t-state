/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
// TODO: remove fork comment and add credit to readme
import { anyObj } from '@lucasols/utils/typings';
import { shallowEqual as shallowEqualFn } from '@lucasols/utils/shallowEqual';
import { pick } from '@lucasols/utils/pick';
import { Serializable } from './typings/utils';
import devtools, { Action } from './devTools';
import { useState, useEffect } from 'react';
import fastDeepEqualFn from 'fast-deep-equal';

export const shallowEqual = shallowEqualFn;
export const fastDeepEqual = fastDeepEqualFn;

export type State = anyObj<Serializable>;

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

export default class Store<
  T extends State,
  P extends ReducersPayloads = ReducersPayloads,
  R extends Reducers<T, P> = Reducers<T, P>
> {
  readonly name?: string;
  private state: T;
  private reducers?: R;
  private subscribers: Subscriber<T>[] = [];

  constructor({
    name,
    state,
    reducers,
  }: {
    name?: string;
    state: T;
    reducers?: R;
  }) {
    this.name = name;
    this.state = state;
    this.reducers = reducers;

    const devToolsMiddeware =
      process.env.NODE_ENV === 'development' &&
      typeof window !== 'undefined' &&
      ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? devtools : false);

    if (devToolsMiddeware && name) {
      this.subscribers.push(
        devToolsMiddeware(name, state, (newState: T) => {
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
      this.subscribers[i](prevState, newState, action);
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

  useKey<K extends keyof T>(key: K, areEqual?: EqualityFn<T[K]>) {
    const [state, set] = useState<Readonly<T[K]>>(this.state[key]);

    useEffect(() => {
      const setter = this.subscribe((prev, current) => {
        if (areEqual) {
          if (!areEqual(prev[key], current[key])) {
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
    areEqual: EqualityFn<Pick<T, K>>,
  ): Readonly<Pick<T, K>>;
  useSlice<K extends keyof T>(
    ...args: (K[] | EqualityFn<Pick<T, K>>)[]
  ): Readonly<Pick<T, K>> {
    const keys = (typeof args[0] === 'string' ? args : args[0]) as K[];
    const areEqual = typeof args[1] === 'function' ? args[1] : shallowEqual;

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
    areEqual: EqualityFn<ReturnType<S>> | false = shallowEqual,
  ): Readonly<ReturnType<S>> {
    const [state, set] = useState(selector(this.state));

    useEffect(() => {
      const setterSubscriber = this.subscribe((prev, current) => {
        const currentSelection = selector(current);
        if (areEqual) {
          if (!areEqual(selector(prev), currentSelection)) {
            set(currentSelection);
          }
        } else if (currentSelection !== selector(prev)) set(currentSelection);
      });

      return setterSubscriber;
    }, []);

    return state;
  }

  useState(areEqual?: EqualityFn<T>) {
    return this.useSelector(s => s, areEqual);
  }
}
