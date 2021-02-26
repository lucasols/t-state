"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observeChanges = exports.getIfSelectorChange = exports.getIfKeysChange = void 0;
const _1 = require(".");
const shallowEqual_1 = require("@lucasols/utils/shallowEqual");
const pick_1 = require("@lucasols/utils/pick");
/**
 * @deprecated use `observeChanges` instead
 */
function getIfKeysChange(prev, current) {
    return (keys, callback, areEqual = shallowEqual_1.shallowEqual) => {
        const verifyIfChangesOnly = Array.isArray(keys);
        const changeToObjKeys = (verifyIfChangesOnly
            ? keys
            : Object.keys(keys));
        const currentSlice = pick_1.pick(current, changeToObjKeys);
        if (!areEqual(pick_1.pick(prev, changeToObjKeys), currentSlice)) {
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
                if (keys.some(key => !equalityFn(prev[key], current[key]))) {
                    callback();
                }
            },
        }),
        ifKeysChangeTo(target) {
            const targetKeys = Object.keys(target);
            const currentSlice = pick_1.pick(current, targetKeys);
            return {
                then(callback) {
                    if (targetKeys.some(key => !equalityFn(prev[key], current[key])) &&
                        equalityFn(currentSlice, target)) {
                        callback();
                    }
                },
            };
        },
        ifSelector: selector => {
            const currentSelection = selector(current);
            const isDiff = !equalityFn(currentSelection, selector(prev));
            return {
                change: {
                    then(callback) {
                        if (isDiff) {
                            callback(currentSelection);
                        }
                    },
                },
                changeTo(target) {
                    return {
                        then(callback) {
                            if (isDiff && equalityFn(currentSelection, target)) {
                                callback(target);
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
