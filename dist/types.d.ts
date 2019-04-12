export declare type Serializable = boolean | number | string | null | SerializableArray | SerializableMap;
declare type SerializableMap = {
    [key: string]: Serializable;
};
interface SerializableArray extends Array<Serializable> {
}
export declare type anyObject<T = any> = {
    [key: string]: T;
};
export declare type genericFunction = {
    (...params: any): any;
};
export {};
