import { Serializable } from './typings/utils';
export declare type Action = {
    type: string;
    [k: string]: Serializable;
};
declare const _default: (storeName: string, initialState: import("@lucasols/utils/typings").anyObj<Serializable>, setState: (state: import("@lucasols/utils/typings").anyObj<Serializable>) => void) => (_state: import("@lucasols/utils/typings").anyObj<Serializable>, newState: import("@lucasols/utils/typings").anyObj<Serializable>, action: Action) => void;
export default _default;
