"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCreateStore = void 0;
const react_1 = require("react");
const t_state_1 = require("./t-state");
function useCreateStore(storeProps) {
    const store = (0, react_1.useRef)();
    if (!store.current) {
        store.current = new t_state_1.Store(typeof storeProps === 'function' ? storeProps() : storeProps);
    }
    return store.current;
}
exports.useCreateStore = useCreateStore;
