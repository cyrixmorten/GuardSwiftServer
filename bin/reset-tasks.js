#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var reset_tasks_api_1 = require("../cloud/api/reset.tasks.api");
var reset_tasks_force_api_1 = require("../cloud/api/reset.tasks.force.api");
require("dotenv").config({ path: '../local.env' });
var requireEnv = require("require-environment-letiables");
requireEnv([
    'APP_ID',
    'MASTER_KEY'
]);
var request = require('request');
var _ = require('lodash');
var task = (_.includes(process.argv, '-f')) ? reset_tasks_force_api_1.API_FUNCTION_FORCE_RESET_TASKS : reset_tasks_api_1.API_FUNCTION_RESET_TASKS;
request({
    method: 'POST',
    url: process.env.SERVER_URL + '/functions/' + task,
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
//# sourceMappingURL=reset-tasks.js.map