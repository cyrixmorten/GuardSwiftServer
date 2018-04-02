import {AlarmRequest, handleAlarmRequest} from "../alarm/alarm.receive";

export const API_FUNCTION_NEW_ALARM = "alarm";

Parse.Cloud.define(API_FUNCTION_NEW_ALARM,  (request: AlarmRequest, response) => {
    handleAlarmRequest(request).then( (res) => {
        response.success(res);
    }, (error) => {
        console.error(error);

        response.error(error);
    });
});