import * as rp from "request-promise-native";
import {ResetTasks} from "../jobs/reset.tasks";
import * as _ from "lodash"
import {API_FUNCTION_RESET_TASKS} from "./reset.tasks.api";

export const API_FUNCTION_FORCE_RESET_TASKS = "forceResetTasks";

Parse.Cloud.define(API_FUNCTION_FORCE_RESET_TASKS, function(request, status) {
    return rp({
        method: "POST",
        url: `${process.env.SERVER_URL}/functions/${API_FUNCTION_RESET_TASKS}`,
        headers: {
			'X-Parse-Application-Id': process.env.APP_ID,
			'X-Parse-Master-Key': process.env.MASTER_KEY,
            'Content-Type': "application/json"
        },
        json: true,
        body: {
           'force': true
        }
    })
	.then( () => {
		status.success("Successfully forced reset of all tasks");
	}).catch((error) => {
        console.error(error);
		status.error(error.message);
	});
});

