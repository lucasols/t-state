/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
// TODO: remove fork comment and add credit to readme
// IDEA: create hook for get multiple keys from store at same

import { anyObj, genericFunction } from '@lucasols/utils/typings';
import { pick, shallowEqual } from '@lucasols/utils';
import { Serializable } from './typings/utils';
import devtools, { Action } from './devTools';
import { useState, useEffect } from 'react';

export type State = anyObj<Serializable>;

type Subscriber<T extends State> = {
  (prev: T, current: T, action?: Action): void;
};

type ReducersArg = {
  [index: string]: anyObj | undefined;
};

type Reducers<T extends State, R extends ReducersArg = ReducersArg> = {
  [K in keyof R]: (state: T, payload: R[K]) => T;
};

type Setter = {
  key: string;
  callback: genericFunction;
};

const devToolsMiddeware =
  process.env.NODE_ENV === 'development' &&
  typeof window !== 'undefined' &&
  ((window as any).__REDUX_DEVTOOLS_EXTENSION__ ? devtools : false);

export default class Store<
  T extends State,
  R extends ReducersArg = ReducersArg
> {
  readonly name: string;
  private state: T;
  private setters: Setter[] = [];
  private reducers?: Reducers<T, R>;
  private subscribers: Subscriber<T>[] = [];

  constructor({
    name,
    state,
    reducers,
  }: {
    name: string;
    state: T;
    reducers?: Reducers<T, R>;
  }) {
    this.name = name;
    this.state = state;
    this.reducers = reducers;

    if (devToolsMiddeware) {
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
    for (let i = 0; i < this.setters.length; i++) {
      const setter = this.setters[i];

      if (this.state[setter.key] !== newState[setter.key]) {
        setter.callback(newState[setter.key]);
      }
    }

    const prevState = { ...this.state };
    this.state = newState;

    for (let i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i](prevState, newState, action);
    }
  }

  setKey<K extends keyof T>(key: K, value: T[K], callback?: genericFunction) {
    const newState: T = { ...this.state, [key]: value };

    this.setState(newState, { type: `${this.name}.set.${key}`, key, value });

    callback?.();
  }

  dispatch<P extends keyof R>(
    type: P,
    payload: R[P],
    callback?: genericFunction,
  ) {
    if (!this.reducers?.[type]) {
      throw new Error(`Action ${type} does not exist on store ${this.name}`);
    }

    const newState = this.reducers[type](this.state, payload);

    if (newState) {
      this.setState(newState, {
        type: `${this.name}.${type}`,
        ...payload,
      });
    }

    callback?.();
  }

  subscribe(callback: Subscriber<T>) {
    if (!this.subscribers.includes(callback)) {
      this.subscribers.push(callback);
    }

    return () => {
      this.subscribers = this.subscribers.filter(
        subscriber => subscriber !== callback,
      );
    };
  }

  useStore<K extends keyof T>(key: K) {
    const [state, set] = useState(this.state[key]);

    useEffect(() => {
      this.setters.push({
        key,
        callback: set,
      });

      return () => {
        this.setters = this.setters.filter(
          (setter: Setter) => setter.callback !== set,
        );
      };
    }, []);

    if (this.state[key] === undefined) {
      throw new Error(
        `Key '${key}' for the store '${this.name}' does not exist`,
      );
    }

    const getter = () => this.state[key];

    return [state, (value: T[K]) => this.setKey(key, value), getter] as const;
  }

  useSlice<K extends keyof T>(...keys: K[]) {
    const [state, set] = useState(pick(this.state, keys));

    useEffect(() => {
      const setter = this.subscribe((prev, current) => {
        const currentSlice = pick(current, keys);

        if (!shallowEqual(pick(prev, keys), currentSlice)) {
          set(currentSlice);
        }
      });

      return setter;
    }, []);

    return state;
  }
}
