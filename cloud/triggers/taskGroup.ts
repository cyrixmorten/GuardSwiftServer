import {TaskGroup} from "../../shared/subclass/TaskGroup";
import {TaskGroupStarted, TaskGroupStartedQuery} from "../../shared/subclass/TaskGroupStarted";
import BeforeSaveRequest = Parse.Cloud.BeforeSaveRequest;
import BeforeSaveResponse = Parse.Cloud.BeforeSaveResponse;
import * as _ from "lodash";
import AfterSaveRequest = Parse.Cloud.AfterSaveRequest;

Parse.Cloud.afterSave(TaskGroup, (request: AfterSaveRequest) => {
    console.log('beforeSave');
    let taskGroup: TaskGroup = <TaskGroup>request.object;

    console.log('taskGroup: ', taskGroup);

    if (!taskGroup.existed()) {
        console.log("Create new TaskGroupStarted");

        new TaskGroupStarted({
            taskGroup: taskGroup,
        }).save(null, {useMasterKey: true})
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




