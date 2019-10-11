export declare type Serializable = boolean | number | string | null | Serializable[] | undefined | {
    [key: string]: Serializable;
};
export declare type anyObject<T = any> = {
    [key: string]: T;
};
export declare type genericFunction = {
    (...params: any): any;
};
