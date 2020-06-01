import {ResetTasks} from "../jobs/reset.tasks";
import * as moment from 'moment';

export const API_FUNCTION_RESET_TASKS = "resetTasks";

Parse.Cloud.job(API_FUNCTION_RESET_TASKS, async (request) => {

    const {
        force,
        taskGroupId,
        fakeDate,
    } = request.params;



    await new ResetTasks({
        force, 
        taskGroupId,
        fakeDate: moment(fakeDate, 'YYYY-MM-DD').toDate()
    }).run();

});

