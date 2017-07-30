"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RegisterSubclasses_1 = require("../shared/subclass/RegisterSubclasses");
var requireGlob = require('require-glob');
requireGlob('./**/*.js');
requireGlob('../shared/**/*.js').then(function (res) {
    RegisterSubclasses_1.RegisterSubclasses.register();
});
//# sourceMappingURL=main.js.map