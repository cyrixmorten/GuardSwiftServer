"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var TaskGroup_1 = require("../../shared/subclass/TaskGroup");
var TaskGroupStarted_1 = require("../../shared/subclass/TaskGroupStarted");
Parse.Cloud.afterSave(TaskGroup_1.TaskGroup, function (request) {
    console.log('beforeSave');
    var taskGroup = request.object;
    console.log('taskGroup: ', taskGroup);
    if (!taskGroup.existed()) {
        console.log("Create new TaskGroupStarted");
        new TaskGroupStarted_1.TaskGroupStarted({
            taskGroup: taskGroup,
        }).save(null, { useMasterKey: true });
    }
    if (taskGroup.archive) {
        new TaskGroupStarted_1.TaskGroupStartedQuery().matchingTaskGroup(taskGroup).notEnded().build().each(function (taskGroupStarted) {
            taskGroupStarted.timeEnded = new Date();
            return taskGroupStarted.save(null, { useMasterKey: true });
        }, { useMasterKey: true }).then(function () {
            console.log('Successfully finished started groups for ' + taskGroup.name);
        }, function (error) {
            console.error("Error finding started groups " + error.code + ": " + error.message);
        });
    }
});
//# sourceMappingURL=taskGroup.js.map