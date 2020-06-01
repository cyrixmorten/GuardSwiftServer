import {ResetTasks} from "../jobs/reset.tasks";
import * as moment from 'moment';

export const API_FUNCTION_RESET_TASKS = "resetTasks";

Parse.Cloud.job(API_FUNCTION_RESET_TASKS, async (request) => {

    const {
        force,
        taskGroupId,
        fakeDate,
    } = request.params;



    try {
        await new ResetTasks({
            force, 
            taskGroupId,
            fakeDate: fakeDate ? moment(fakeDate, 'YYYY-MM-DD').toDate() : undefined
        }).run();
    } catch(e) {
        console.error("Error while resetting tasks", e);
    }
});

