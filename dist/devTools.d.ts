import { State } from './t-state';
export type Action = {
    type: string;
    [k: string]: any;
};
declare const _default: (storeName: string, initialState: State, setState: (state: State) => void) => (_state: State, newState: State, action: Action) => void;
export default _default;
