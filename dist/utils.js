"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepFreeze = exports.unwrapValueSetter = exports.pick = void 0;
function pick(obj, keys) {
    const slice = {};
    for (let i = 0; i < keys.length; i++) {
        slice[keys[i]] = obj[keys[i]];
    }
    return slice;
}
exports.pick = pick;
function unwrapValueSetter(value, current) {
    return typeof value === 'function' ? value(current) : value;
}
exports.unwrapValueSetter = unwrapValueSetter;
function deepFreeze(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }
    Object.freeze(obj);
    for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
            deepFreeze(obj[key]);
        }
    }
    return obj;
}
exports.deepFreeze = deepFreeze;
