export type Serializable =
  | boolean
  | number
  | string
  | null
  | Serializable[]
  | undefined
  | { [key: string]: Serializable; };

export type anyObject<T = any> = {
  [key: string]: T;
}

export type genericFunction = {
  (...params: any): any;
}
