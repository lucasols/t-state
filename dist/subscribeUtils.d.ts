import { anyObject } from './types';
export declare function getIfKeyChangeTo(prev: anyObject, current: anyObject): (key: string | string[], target: string | any[], callback: any) => void;
export declare function getIfKeyChange(prev: anyObject, current: anyObject): (key: string | string[], callback: any) => void;
