"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Store = exports.deepEqual = exports.shallowEqual = void 0;
const devTools_1 = __importDefault(require("./devTools"));
const lite_1 = require("dequal/lite");
const immer_1 = require("immer");
const with_selector_1 = require("use-sync-external-store/with-selector");
const shallowEqual_1 = require("./shallowEqual");
Object.defineProperty(exports, "shallowEqual", { enumerable: true, get: function () { return shallowEqual_1.shallowEqual; } });
const utils_1 = require("./utils");
const deepEqual = lite_1.dequal;
exports.deepEqual = deepEqual;
class Store {
    name;
    state_;
    subscribers = [];
    batchUpdates_ = false;
    lastState_;
    constructor({ name, state }) {
        this.name = name;
        this.state_ =
            process.env.NODE_ENV === 'development' ? state : (0, utils_1.deepFreeze)(state);
        this.lastState_ = state;
        const devToolsMiddeware = process.env.NODE_ENV === 'development' &&
            typeof window !== 'undefined' &&
            (window.__REDUX_DEVTOOLS_EXTENSION__ ? devTools_1.default : false);
        if (devToolsMiddeware && name) {
            this.subscribers.push(devToolsMiddeware(name, state, (newState) => {
                this.setState(newState);
            }));
        }
    }
    get state() {
        return this.state_;
    }
    flush_(action) {
        for (let i = 0; i < this.subscribers.length; i++) {
            this.subscribers[i]({
                prev: this.lastState_,
                current: this.state_,
                action,
            });
        }
    }
    setState(newState, action) {
        const unwrapedNewState = (0, utils_1.unwrapValueSetter)(newState, this.state_);
        // FIX: check if equality check is working
        if (unwrapedNewState === this.state_)
            return;
        this.lastState_ = { ...this.state_ };
        this.state_ =
            process.env.NODE_ENV === 'development'
                ? (0, utils_1.deepFreeze)(unwrapedNewState)
                : unwrapedNewState;
        if (!this.batchUpdates_) {
            this.flush_(action);
        }
    }
    setKey(key, value, { action, 
    // FIX: add tests
    equalityCheck = true, } = {}) {
        if (equalityCheck) {
            if (equalityCheck === true) {
                if (this.state_[key] === value)
                    return;
            }
            else {
                if (equalityCheck(this.state_[key], value))
                    return;
            }
        }
        this.setState((current) => ({
            ...current,
            [key]: (0, utils_1.unwrapValueSetter)(value, current[key]),
        }), action ?? { type: `${this.name}.set.${key}`, key, value });
    }
    // FIX: add tests
    setPartialState(newState, { action, equalityCheck, } = {}) {
        // FIX: check if equality check is working
        if (equalityCheck) {
            if (equalityCheck((0, utils_1.pick)(this.state_, Object.keys(newState)), newState)) {
                return;
            }
        }
        this.setState((current) => ({ ...current, ...newState }), action ?? { type: `${this.name}.setPartial`, newState });
    }
    /** set a new state mutanting the state with Immer produce function */
    produceState(recipe, action) {
        this.setState((current) => (0, immer_1.produce)(current, recipe), action ?? { type: 'produceState' });
    }
    // FIX: add tests
    batch(fn, action) {
        this.batchUpdates_ = true;
        fn();
        this.batchUpdates_ = false;
        this.flush_(action);
    }
    subscribe(callback) {
        if (!this.subscribers.includes(callback)) {
            this.subscribers.push(callback);
        }
        return () => {
            this.subscribers.splice(this.subscribers.indexOf(callback), 1);
        };
    }
    useSelector(selector, { equalityFn = shallowEqual_1.shallowEqual } = {}) {
        return (0, with_selector_1.useSyncExternalStoreWithSelector)(this.subscribe.bind(this), () => this.state_, null, selector, equalityFn === false ? undefined : equalityFn);
    }
    useKey(key, { equalityFn = Object.is } = {}) {
        return this.useSelector((s) => s[key], { equalityFn });
    }
    useState(options) {
        return this.useSelector((s) => s, options);
    }
    useSlice(...args) {
        const keys = (typeof args[0] === 'string' ? args : args[0]);
        const equalityFn = typeof args[1] === 'object' && args[1].equalityFn
            ? args[1].equalityFn
            : shallowEqual_1.shallowEqual;
        return this.useSelector((s) => (0, utils_1.pick)(s, keys), { equalityFn });
    }
}
exports.Store = Store;
