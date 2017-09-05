"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RegisterSubclasses_1 = require("../shared/subclass/RegisterSubclasses");
let requireGlob = require('require-glob');
requireGlob('./**/*.js');
requireGlob('../shared/**/*.js').then((res) => {
    RegisterSubclasses_1.RegisterSubclasses.register();
});
//# sourceMappingURL=main.js.map