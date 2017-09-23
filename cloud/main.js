"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RegisterSubclasses_1 = require("../shared/subclass/RegisterSubclasses");
let requireGlob = require('require-glob');
requireGlob('../shared/**/*.js').then((res) => {
    console.log('Registering subclasses');
    RegisterSubclasses_1.RegisterSubclasses.register();
}, (e) => {
    console.error('Failed to requireGlob for shared: ' + e);
});
requireGlob('./**/*.js').then((res) => {
    console.log('Cloud Code loaded');
}, (e) => {
    console.error('Failed to requireGlob for cloud: ' + e);
});
//# sourceMappingURL=main.js.map