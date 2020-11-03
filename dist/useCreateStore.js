"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreateStore = void 0;
const react_1 = require("react");
const _1 = __importDefault(require("."));
function useCreateStore(storeProps) {
    const store = react_1.useRef();
    if (!store.current) {
        store.current = new _1.default(typeof storeProps === 'function' ? storeProps() : storeProps);
    }
    return store.current;
}
exports.useCreateStore = useCreateStore;
