// TODO: test if it is performant
export function getIfKeyChangeTo(prev, current) {
    return (key, target, callback) => {
        if (Array.isArray(key)) {
            let hasChanged = false;
            let allMatchTarget = true;
            for (let i = 0; i < key.length; i++) {
                const currentElem = current[key[i]];
                const lastElem = prev[key[i]];
                const targetElem = target[i];
                if (process.env.NODE_ENV === 'development') {
                    if (currentElem === undefined && targetElem !== undefined) {
                        throw new Error(`key: ${key} does not exist`);
                    }
                }
                if (!hasChanged)
                    hasChanged = currentElem !== lastElem;
                if (currentElem !== targetElem)
                    allMatchTarget = false;
            }
            if (hasChanged && allMatchTarget)
                callback();
        }
        else if (current[key] !== prev[key] && current[key] === target) {
            // check if key exists
            if (process.env.NODE_ENV === 'development') {
                if (current[key] === undefined && target !== undefined) {
                    throw new Error(`key: ${key} does not exist`);
                }
            }
            callback();
        }
    };
}
// IDEA: simplify with upper function
export function getIfKeyChange(prev, current) {
    return (key, callback) => {
        if (Array.isArray(key)) {
            let hasChanged = false;
            for (let i = 0; i < key.length; i++) {
                const currentElem = current[key[i]];
                const lastElem = prev[key[i]];
                if (process.env.NODE_ENV === 'development') {
                    if (currentElem === undefined) {
                        throw new Error(`key: ${key} does not exist`);
                    }
                }
                if (!hasChanged)
                    hasChanged = currentElem !== lastElem;
            }
            if (hasChanged)
                callback();
        }
        else if (current[key] !== prev[key]) {
            // check if key exists
            if (process.env.NODE_ENV === 'development') {
                if (current[key] === undefined) {
                    throw new Error(`key: ${key} does not exist`);
                }
            }
            callback();
        }
    };
}
