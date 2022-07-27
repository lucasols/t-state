"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubscribeToStore = exports.observeChanges = exports.getIfSelectorChange = exports.getIfKeysChange = void 0;
/* eslint-disable @typescript-eslint/lines-between-class-members */
const _1 = require(".");
const react_1 = require("react");
const shallowEqual_1 = require("./shallowEqual");
const utils_1 = require("./utils");
/**
 * @deprecated use `observeChanges` instead
 */
function getIfKeysChange(prev, current) {
    return (keys, callback, areEqual = shallowEqual_1.shallowEqual) => {
        const verifyIfChangesOnly = Array.isArray(keys);
        const changeToObjKeys = (verifyIfChangesOnly ? keys : Object.keys(keys));
        const currentSlice = (0, utils_1.pick)(current, changeToObjKeys);
        if (!areEqual((0, utils_1.pick)(prev, changeToObjKeys), currentSlice)) {
            if (verifyIfChangesOnly) {
                callback();
            }
            else if (areEqual(keys, currentSlice)) {
                callback();
            }
        }
    };
}
exports.getIfKeysChange = getIfKeysChange;
/**
 * @deprecated use `observeChanges` instead
 */
function getIfSelectorChange(prev, current) {
    return (selector, callback, areEqual = shallowEqual_1.shallowEqual) => {
        const verifyIfChangesTo = Array.isArray(selector);
        const selectorFn = verifyIfChangesTo
            ? selector[0]
            : selector;
        const currentSelection = selectorFn(current);
        if (!areEqual(selectorFn(prev), currentSelection)) {
            if (!verifyIfChangesTo) {
                callback(currentSelection);
            }
            else if (areEqual(currentSelection, selector[1])) {
                callback(currentSelection);
            }
        }
    };
}
exports.getIfSelectorChange = getIfSelectorChange;
function observeChanges(prev, current) {
    let equalityFn = _1.deepEqual;
    const methods = {
        ifKeysChange: (...keys) => ({
            then(callback) {
                if (keys.some((key) => !equalityFn(prev[key], current[key]))) {
                    callback();
                }
            },
        }),
        ifKeysChangeTo(target) {
            const targetKeys = Object.keys(target);
            const currentSlice = (0, utils_1.pick)(current, targetKeys);
            return {
                then(callback) {
                    if (targetKeys.some((key) => !equalityFn(prev[key], current[key])) &&
                        equalityFn(currentSlice, target)) {
                        callback();
                    }
                },
            };
        },
        ifSelector: (selector) => {
            const currentSelection = selector(current);
            const prevSelection = selector(prev);
            const isDiff = !equalityFn(currentSelection, prevSelection);
            return {
                change: {
                    then(callback) {
                        if (isDiff) {
                            callback(currentSelection, prevSelection);
                        }
                    },
                },
                changeTo(target) {
                    return {
                        then(callback) {
                            if (isDiff && equalityFn(currentSelection, target)) {
                                callback(target, prevSelection);
                            }
                        },
                    };
                },
            };
        },
    };
    return {
        withEqualityFn(newEqualityFn) {
            equalityFn = newEqualityFn;
            return methods;
        },
        ...methods,
    };
}
exports.observeChanges = observeChanges;
function useSubscribeToStore(store, onChange) {
    const callbackRef = (0, react_1.useRef)(onChange);
    (0, react_1.useLayoutEffect)(() => {
        callbackRef.current = onChange;
    });
    (0, react_1.useEffect)(() => {
        const unsubscribe = store.subscribe((prev, current) => {
            const observe = observeChanges(prev, current);
            callbackRef.current({ prev, current, observe });
        });
        return unsubscribe;
    }, []);
}
exports.useSubscribeToStore = useSubscribeToStore;
