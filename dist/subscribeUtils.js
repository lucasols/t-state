"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIfSelectorChange = exports.getIfKeysChange = void 0;
const shallowEqual_1 = require("@lucasols/utils/shallowEqual");
const pick_1 = require("@lucasols/utils/pick");
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
