"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepEqual = exports.shallowEqual = void 0;
const shallowEqual_1 = require("@lucasols/utils/shallowEqual");
const pick_1 = require("@lucasols/utils/pick");
const devTools_1 = __importDefault(require("./devTools"));
const react_1 = require("react");
const lite_1 = require("dequal/lite");
const isDev = process.env.NODE_ENV === 'development';
exports.shallowEqual = shallowEqual_1.shallowEqual;
exports.deepEqual = lite_1.dequal;
class Store {
    constructor({ name, state, reducers, }) {
        this.subscribers = [];
        this.name = name;
        this.state = state;
        this.reducers = reducers;
        const devToolsMiddeware = isDev &&
            typeof window !== 'undefined' &&
            (window.__REDUX_DEVTOOLS_EXTENSION__ ? devTools_1.default : false);
        if (devToolsMiddeware && name) {
            this.subscribers.push(devToolsMiddeware(name, state, (newState) => {
                this.setState(newState);
            }));
        }
    }
    getState() {
        return this.state;
    }
    setState(newState, action) {
        const prevState = { ...this.state };
        this.state = newState;
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i](prevState, newState, action);
        }
    }
    setKey(key, value) {
        const newState = { ...this.state, [key]: value };
        this.setState(newState, { type: `${this.name}.set.${key}`, key, value });
    }
    dispatch(type, ...payload) {
        var _a;
        if (!((_a = this.reducers) === null || _a === void 0 ? void 0 : _a[type])) {
            if (process.env.NODE_ENV !== 'production') {
                throw new Error(`Action ${type} does not exist on store ${this.name}`);
            }
            return;
        }
        // HACK: assert param to avoid error
        const newState = this.reducers[type](this.state, payload[0]);
        if (newState) {
            this.setState(newState, {
                type: `${this.name}.${type}`,
                payload: payload[0],
            });
        }
    }
    subscribe(callback) {
        if (!this.subscribers.includes(callback)) {
            this.subscribers.push(callback);
        }
        return () => {
            this.subscribers.splice(this.subscribers.indexOf(callback), 1);
        };
    }
    useKey(key, { equalityFn } = {}) {
        const [state, set] = react_1.useState(this.state[key]);
        react_1.useEffect(() => {
            const setter = this.subscribe((prev, current) => {
                if (equalityFn) {
                    if (!equalityFn(prev[key], current[key])) {
                        set(current[key]);
                    }
                }
                else if (prev[key] !== current[key]) {
                    set(current[key]);
                }
            });
            return setter;
        }, []);
        if (process.env.NODE_ENV !== 'production' &&
            this.state[key] === undefined) {
            throw new Error(`Key '${key}' for the store '${this.name}' does not exist`);
        }
        const getter = () => this.state[key];
        return [state, (value) => this.setKey(key, value), getter];
    }
    useSlice(...args) {
        const keys = (typeof args[0] === 'string' ? args : args[0]);
        const areEqual = typeof args[1] === 'object' && args[1].equalityFn
            ? args[1].equalityFn
            : exports.shallowEqual;
        const [state, set] = react_1.useState(pick_1.pick(this.state, keys));
        react_1.useEffect(() => {
            const setter = this.subscribe((prev, current) => {
                const currentSlice = pick_1.pick(current, keys);
                if (!areEqual(pick_1.pick(prev, keys), currentSlice)) {
                    set(currentSlice);
                }
            });
            return setter;
        }, []);
        return state;
    }
    useSelector(selector, { equalityFn = exports.shallowEqual, selectorDeps = [], } = {}) {
        const [state, set] = react_1.useState(selector(this.state));
        const isFirstRender = react_1.useRef(true);
        react_1.useEffect(() => {
            const setterSubscriber = this.subscribe((prev, current) => {
                const currentSelection = selector(current);
                if (equalityFn) {
                    if (!equalityFn(selector(prev), currentSelection)) {
                        set(currentSelection);
                    }
                }
                else if (currentSelection !== selector(prev))
                    set(currentSelection);
            });
            if (isFirstRender.current) {
                isFirstRender.current = false;
            }
            else {
                set(selector(this.state));
            }
            return setterSubscriber;
        }, selectorDeps);
        return state;
    }
    useState(equalityFn) {
        return this.useSelector(s => s, { equalityFn });
    }
}
exports.default = Store;
