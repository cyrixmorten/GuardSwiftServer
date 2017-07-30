"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskGroup_1 = require("./TaskGroup");
var Task_1 = require("./Task");
var TaskGroupStarted_1 = require("./TaskGroupStarted");
var RegisterSubclasses = (function () {
    function RegisterSubclasses() {
    }
    RegisterSubclasses.register = function () {
        Parse.Object.registerSubclass(Task_1.Task.className, Task_1.Task);
        Parse.Object.registerSubclass(TaskGroup_1.TaskGroup.className, TaskGroup_1.TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted_1.TaskGroupStarted.className, TaskGroupStarted_1.TaskGroupStarted);
    };
    return RegisterSubclasses;
}());
exports.RegisterSubclasses = RegisterSubclasses;
//# sourceMappingURL=RegisterSubclasses.js.map