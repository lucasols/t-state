import { State } from '.';
import { Serializable } from './typings/utils';
export declare type Action = {
    type: string;
    [k: string]: Serializable;
};
declare const _default: (storeName: string, initialState: State, setState: (state: State) => void) => (_state: State, newState: State, action: Action) => void;
export default _default;
