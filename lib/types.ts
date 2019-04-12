export type Serializable =
  | boolean
  | number
  | string
  | null
  | SerializableArray
  | SerializableMap;

type SerializableMap = {
  [key: string]: Serializable;
};

interface SerializableArray extends Array<Serializable> {};

export type anyObject<T = any> = {
  [key: string]: T;
}

export type genericFunction = {
  (...params: any): any;
}
