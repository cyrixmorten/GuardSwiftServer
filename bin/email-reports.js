#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var send_daily_reports_api_1 = require("../cloud/api/send.daily.reports.api");
require("dotenv").config({ path: '../local.env' });
var requireEnv = require("require-environment-letiables");
requireEnv([
    'APP_ID',
    'MASTER_KEY'
]);
var request = require('request');
request({
    method: 'POST',
    url: process.env.SERVER_URL + "/functions/" + send_daily_reports_api_1.API_FUNCTION_SEND_DAILY_REPORT,
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
//# sourceMappingURL=email-reports.js.map