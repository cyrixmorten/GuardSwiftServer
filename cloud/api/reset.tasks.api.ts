import {ResetTasks} from "../jobs/reset.tasks";

export const API_FUNCTION_RESET_TASKS = "resetTasks";

Parse.Cloud.define(API_FUNCTION_RESET_TASKS, async (request, status) => {

    console.log('----');
    console.log('- resetAllTasks');
    console.log('----\n\n');
    let forceUpdate = request.params.force;
    let taskGroupId = request.params.taskGroupId;

    let now = new Date();
    let now_dayOfWeek = now.getDay();
    let now_hour = now.getHours();

    console.log("resetTasks day: " + now_dayOfWeek + " hour: " + now_hour + " forced update: " + (forceUpdate == true));

    try {
        await new ResetTasks(forceUpdate, taskGroupId).run();
        console.log("all done");
        status.success("completed successfully");
    } catch (e) {
        console.error("failed to reset tasks", e);
        status.error("an error occurred: \n" + JSON.stringify(e));
    }

});

