"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskGroup_1 = require("./TaskGroup");
const Task_1 = require("./Task");
const TaskGroupStarted_1 = require("./TaskGroupStarted");
class RegisterSubclasses {
    static register() {
        Parse.Object.registerSubclass(Task_1.Task.className, Task_1.Task);
        Parse.Object.registerSubclass(TaskGroup_1.TaskGroup.className, TaskGroup_1.TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted_1.TaskGroupStarted.className, TaskGroupStarted_1.TaskGroupStarted);
    }
}
exports.RegisterSubclasses = RegisterSubclasses;
//# sourceMappingURL=RegisterSubclasses.js.map