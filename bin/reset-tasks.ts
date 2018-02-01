#!/usr/bin/env node
import {API_FUNCTION_RESET_TASKS} from "../cloud/api/reset.tasks.api";
import {API_FUNCTION_FORCE_RESET_TASKS} from "../cloud/api/reset.tasks.force.api";

require("dotenv").config({ path: '../local.env' });

let requireEnv = require("require-environment-letiables");
requireEnv([
    'APP_ID',
    'MASTER_KEY'
]);

let request = require('request');
let _ = require('lodash');


let task = (_.includes(process.argv, '-f')) ? API_FUNCTION_FORCE_RESET_TASKS : API_FUNCTION_RESET_TASKS;


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