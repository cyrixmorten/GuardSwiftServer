import {ResetTasks} from "../jobs/reset.tasks";
import * as _ from "lodash"

export const API_FUNCTION_RESET_TASKS = "resetTasks";

Parse.Cloud.define(API_FUNCTION_RESET_TASKS, function (request, status) {

    console.log('----');
    console.log('- resetAllTasks');
    console.log('----\n\n');
    let forceUpdate = request.params.force;
 

    let now = new Date();
    let now_dayOfWeek = now.getDay();
    let now_hour = now.getHours();

    console.log("resetTasks day: " + now_dayOfWeek + " hour: " + now_hour + " forced update: " + (forceUpdate == true));

    let promises = [];

    // TODO iterate only active users
    promises.push(new ResetTasks(forceUpdate).run());

    Parse.Promise.when(promises).then(function () {
        // // All tasks completed
        console.log("all done");
        status.success("completed successfully");
    }, function (error) {
        console.error("failed to reset tasks", error);
        status.error("an error occurred: \n" + JSON.stringify(error));
    });

});

