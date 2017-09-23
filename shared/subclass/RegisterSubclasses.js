"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TaskGroup_1 = require("./TaskGroup");
const Task_1 = require("./Task");
const TaskGroupStarted_1 = require("./TaskGroupStarted");
const Guard_1 = require("./Guard");
const User_1 = require("./User");
const Client_1 = require("./Client");
const EventLog_1 = require("./EventLog");
const Central_1 = require("./Central");
const Person_1 = require("./Person");
const Report_1 = require("./Report");
class RegisterSubclasses {
    static register() {
        Parse.Object.registerSubclass(User_1.User.className, User_1.User);
        Parse.Object.registerSubclass(Guard_1.Guard.className, Guard_1.Guard);
        Parse.Object.registerSubclass(Client_1.Client.className, Client_1.Client);
        Parse.Object.registerSubclass(Task_1.Task.className, Task_1.Task);
        Parse.Object.registerSubclass(TaskGroup_1.TaskGroup.className, TaskGroup_1.TaskGroup);
        Parse.Object.registerSubclass(TaskGroupStarted_1.TaskGroupStarted.className, TaskGroupStarted_1.TaskGroupStarted);
        Parse.Object.registerSubclass(EventLog_1.EventLog.className, EventLog_1.EventLog);
        Parse.Object.registerSubclass(Central_1.Central.className, Central_1.Central);
        Parse.Object.registerSubclass(Person_1.Person.className, Person_1.Person);
        Parse.Object.registerSubclass(Report_1.Report.className, Report_1.Report);
    }
}
exports.RegisterSubclasses = RegisterSubclasses;
//# sourceMappingURL=RegisterSubclasses.js.map