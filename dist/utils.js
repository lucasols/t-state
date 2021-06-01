"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pick = void 0;
function pick(obj, keys) {
    const slice = {};
    for (let i = 0; i < keys.length; i++) {
        slice[keys[i]] = obj[keys[i]];
    }
    return slice;
}
exports.pick = pick;
