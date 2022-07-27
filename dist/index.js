"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shallowEqual = exports.deepEqual = void 0;
/**
 * forked from v1 of https://github.com/jhonnymichel/react-hookstore
 */
// TODO: remove fork comment and add credit to readme
const devTools_1 = __importDefault(require("./devTools"));
const react_1 = require("react");
const lite_1 = require("dequal/lite");
const immer_1 = require("immer");
const shallowEqual_1 = require("./shallowEqual");
const utils_1 = require("./utils");
exports.deepEqual = lite_1.dequal;
exports.shallowEqual = shallowEqual_1.shallowEqual;
const isDev = process.env.NODE_ENV === 'development';
class Store {
    name;
    state;
    reducers;
    subscribers = [];
    constructor({ name, state, reducers }) {
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
        if (!this.reducers?.[type]) {
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
        const [state, set] = (0, react_1.useState)(this.state[key]);
        (0, react_1.useEffect)(() => {
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
        const [state, set] = (0, react_1.useState)((0, utils_1.pick)(this.state, keys));
        (0, react_1.useEffect)(() => {
            const setter = this.subscribe((prev, current) => {
                const currentSlice = (0, utils_1.pick)(current, keys);
                if (!areEqual((0, utils_1.pick)(prev, keys), currentSlice)) {
                    set(currentSlice);
                }
            });
            return setter;
        }, []);
        return state;
    }
    useSelector(selector, { equalityFn = exports.shallowEqual, selectorDeps = [], } = {}) {
        const [state, set] = (0, react_1.useState)(selector(this.state));
        const isFirstRender = (0, react_1.useRef)(true);
        (0, react_1.useLayoutEffect)(() => {
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
        return this.useSelector((s) => s, { equalityFn });
    }
    /** set a new state mutanting the state with Immer produce function */
    produceState(recipe) {
        this.setState((0, immer_1.produce)(this.state, recipe), {
            type: 'produceState',
        });
    }
}
exports.default = Store;
