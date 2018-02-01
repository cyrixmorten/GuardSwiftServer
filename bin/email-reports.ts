#!/usr/bin/env node
import {API_FUNCTION_SEND_REPORTS_TO_CLIENTS, IParams} from "../cloud/api/send.daily.reports.api";
import {TaskType} from "../shared/subclass/Task";
let _ = require('lodash');

require("dotenv").config({ path: '../local.env' });
let requireEnv = require("require-environment-letiables");
requireEnv([
    'APP_ID',
    'MASTER_KEY'
]);

let request = require('request');
let body: IParams = {
    timeBack: {
        amount: 1,
        unit: 'days'
    },
    taskTypes: [TaskType.REGULAR, TaskType.RAID]
};


if(_.includes(process.argv, '-a')) {
    body = {
        timeBack: {
            amount: 60,
            unit: 'minutes'
        },
        taskTypes: [TaskType.ALARM]
    };
}

request({
    method: 'POST',
    url: `${process.env.SERVER_URL}/functions/${API_FUNCTION_SEND_REPORTS_TO_CLIENTS}`,
    headers: {
        'X-Parse-Application-Id': process.env.APP_ID,
        'X-Parse-Master-Key': process.env.MASTER_KEY,
        'Content-Type': "application/json"
    }
}, function (err, res, body) {
    if (err) {
        console.error(err);
        return;
    }

    console.log(res.code, res.headers, body);
});