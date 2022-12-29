import { State, Store, StoreProps } from './t-state';
export declare function useCreateStore<T extends State>(storeProps: StoreProps<T> | (() => StoreProps<T>)): Store<T>;
