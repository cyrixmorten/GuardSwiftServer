import {handleAlarmRequest} from "../alarm/receive";

export const API_FUNCTION_NEW_ALARM = "alarm";

Parse.Cloud.define(API_FUNCTION_NEW_ALARM,  (request) => {
    return handleAlarmRequest(request);
});