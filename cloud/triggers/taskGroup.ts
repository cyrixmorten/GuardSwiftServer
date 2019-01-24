import {TaskGroup} from "../../shared/subclass/TaskGroup";
import {TaskGroupStarted, TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";
import AfterSaveRequest = Parse.Cloud.AfterSaveRequest;
import { BeforeSaveUtils } from './BeforeSaveUtils';
import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;

Parse.Cloud.beforeSave(TaskGroup, (request: BeforeSaveRequest, response) => {
    BeforeSaveUtils.settUserAsOwner(request);

    response.success();
});

Parse.Cloud.afterSave(TaskGroup, (request: AfterSaveRequest) => {

    let taskGroup: TaskGroup = <TaskGroup>request.object;

    if (!taskGroup.existed()) {
        console.log("Create new TaskGroupStarted");

        const taskGroupStarted = new TaskGroupStarted();
        taskGroupStarted.taskGroup = taskGroup;

        taskGroupStarted.save(null, {useMasterKey: true})
    }

    if (taskGroup.archive) {
        new TaskGroupStartedQuery().matchingTaskGroup(taskGroup).notEnded().build().each((taskGroupStarted: TaskGroupStarted) => {
            taskGroupStarted.timeEnded = new Date();
            return taskGroupStarted.save(null, {useMasterKey: true});
        }, {useMasterKey: true}).then(() => {
            console.log('Successfully finished started groups for ' + taskGroup.name);
        },  function (error) {
            console.error("Error finding started groups " + error.code + ": " + error.message);
        });
    }
});




