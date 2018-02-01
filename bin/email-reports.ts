#!/usr/bin/env node
import {API_FUNCTION_SEND_DAILY_REPORT} from "../cloud/api/send.daily.reports.api";

require("dotenv").config({ path: '../local.env' });
let requireEnv = require("require-environment-letiables");
requireEnv([
    'APP_ID',
    'MASTER_KEY'
]);

let request = require('request');


request({
    method: 'POST',
    url: `${process.env.SERVER_URL}/functions/${API_FUNCTION_SEND_DAILY_REPORT}`,
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