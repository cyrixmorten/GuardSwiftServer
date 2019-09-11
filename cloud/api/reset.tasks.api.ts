import {ResetTasks} from "../jobs/reset.tasks";

export const API_FUNCTION_RESET_TASKS = "resetTasks";

Parse.Cloud.job(API_FUNCTION_RESET_TASKS, async (request) => {

    const {
        force,
        taskGroupId,
    } = request.params;

    await new ResetTasks(force, taskGroupId).run();

});

