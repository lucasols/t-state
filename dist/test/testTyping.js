"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const lib_1 = require("../lib");
const appState = lib_1.createStore('app', {
    state: {
        test: undefined,
        number: null,
        string: 'dsfsdf',
        numberArr: [],
    },
});
appState.subscribe((prev, current) => {
    console.log(prev.number);
    console.log(prev.test);
    console.log(current.test);
});
