import * as rp from "request-promise";
import {ResetTasks} from "./ResetTasks";
import * as _ from "lodash"

Parse.Cloud.define("forceResetTasks", function(request, status) {
    return rp({
        method: "POST",
        url: process.env.SERVER_URL + '/functions/resetTasks',
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

Parse.Cloud.define("resetTasks", function (request, status) {

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
        status.error("an error occurred: " + JSON.stringify(error));
    });

});

