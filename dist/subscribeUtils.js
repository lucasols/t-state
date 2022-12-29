"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSubscribeToStore = exports.observeChanges = void 0;
/* eslint-disable @typescript-eslint/lines-between-class-members */
const react_1 = require("react");
const t_state_1 = require("./t-state");
const utils_1 = require("./utils");
function observeChanges(prev, current) {
    let equalityFn = t_state_1.shallowEqual;
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
                            callback({ current: currentSelection, prev: prevSelection });
                        }
                    },
                },
                changeTo(target) {
                    return {
                        then(callback) {
                            if (isDiff && equalityFn(currentSelection, target)) {
                                callback({ current: target, prev: prevSelection });
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
        const unsubscribe = store.subscribe(({ prev, current }) => {
            const observe = observeChanges(prev, current);
            callbackRef.current({ prev, current, observe });
        });
        return unsubscribe;
    }, []);
}
exports.useSubscribeToStore = useSubscribeToStore;
