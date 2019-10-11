import { anyObject, genericFunction } from './types';
export declare function getIfKeyChangeTo(prev: anyObject, current: anyObject): (key: string | string[], target: string | any[], callback: genericFunction) => void;
export declare function getIfKeyChange(prev: anyObject, current: anyObject): (key: string | string[], callback: genericFunction) => void;
