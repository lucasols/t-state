"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shallowEqual_1 = require("@lucasols/utils/shallowEqual");
const pick_1 = require("@lucasols/utils/pick");
const fast_deep_equal_1 = __importDefault(require("fast-deep-equal"));
function getIfKeysChange(prev, current) {
    return (keys, callback, checkDeepEquality = false, deepEqualityFn = fast_deep_equal_1.default) => {
        const areEqual = checkDeepEquality ? deepEqualityFn : shallowEqual_1.shallowEqual;
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
