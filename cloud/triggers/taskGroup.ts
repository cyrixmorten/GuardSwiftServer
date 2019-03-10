import { TaskGroup } from "../../shared/subclass/TaskGroup";
import { TaskGroupStarted, TaskGroupStartedQuery } from "../../shared/subclass/TaskGroupStarted";
import { BeforeSave } from './BeforeSave';
import AfterSaveRequest = Parse.Cloud.AfterSaveRequest;
import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;

Parse.Cloud.beforeSave(TaskGroup, (request: BeforeSaveRequest) => {
    BeforeSave.setArchiveFalse(request);
    BeforeSave.settUserAsOwner(request);
});

Parse.Cloud.afterSave(TaskGroup, (request: AfterSaveRequest) => {

    let taskGroup: TaskGroup = request.object as TaskGroup;

    if (!taskGroup.existed()) {

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
        }, function (error) {
            console.error("Error finding started groups " + error.code + ": " + error.message);
        });
    }
});




