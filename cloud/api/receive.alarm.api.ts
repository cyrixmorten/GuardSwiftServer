import {handleRESTAlarmRequest, handleSMSAlarmRequest} from "../alarm/receive";
export const API_FUNCTION_NEW_ALARM_SMS = "alarm-sms";
export const API_FUNCTION_NEW_ALARM_REST = "alarm-rest";

Parse.Cloud.define(API_FUNCTION_NEW_ALARM_SMS,  (request) => {
    return handleSMSAlarmRequest(request);
});

Parse.Cloud.define(API_FUNCTION_NEW_ALARM_REST,  (request) => {
    return handleRESTAlarmRequest(request);
});