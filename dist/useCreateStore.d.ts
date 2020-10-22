import Store, { Reducers, ReducersPayloads, State, StoreProps } from '.';
export declare function useCreateStore<T extends State, P extends ReducersPayloads = ReducersPayloads, R extends Reducers<T, P> = Reducers<T, P>>(storeProps: StoreProps<T, R>): Store<T, P, Reducers<T, P>>;
