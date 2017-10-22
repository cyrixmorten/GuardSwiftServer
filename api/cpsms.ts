import {AlarmDispatcher} from "./dispatcher";

import * as rp from 'request-promise';
import * as _ from 'lodash'

let saveSMSLog =  (to, from, message, limit, error?) => {
    let SMSLog = Parse.Object.extend('SMSLog');
    let smsLog = new SMSLog();
    smsLog.set('to', to);
    smsLog.set('from', from);
    smsLog.set('message', message);
    smsLog.set('limit', limit);
    smsLog.set('error', error);

    return smsLog.save(null, {useMasterKey: true}).fail((e) => {
        console.error('Error saving SMSLog', e);
    });
};

export let receive =  (req, res) => {
    let from = req.query.from;
    let to = req.query.number;
    let body = req.query.message;

    from = '+' + from;
    to = '+' + to;

    console.log('from: ', from);
    console.log('number: ', to);
    console.log('message: ', body);

    AlarmDispatcher.handle(from, to, body, res);

};


export let send =  (params) => {

    let to = _.replace(params.to, '+', '');
    let from = _.replace(params.from, '+45', '') || 'GUARDSWIFT';
    let message = params.message || '';
    let limit = params.limit;

    let options = {
        method: 'POST',
        uri: 'https://api.cpsms.dk/v2/send',
        headers: {
            'Authorization': 'Basic ' + new Buffer('cyrix:' + process.env.CPSMS_API_KEY).toString('base64')
        },
        body: {
            to: to,
            from: from,
            message: limit ? message.substring(0, limit) : message,
            flash: 0//params.flash ? 1 : 0
        },
        json: true
    };

    console.log('Sending SMS: ', options.body);

    return rp(options).promise().then( (parsedBody) => {
        console.log('SMS sent', options.body);
        saveSMSLog(to, from, message, limit);
    }).catch( (err) => {
        console.log('SMS failed', options.body, err);
        saveSMSLog(to, from, message, limit, err);
    });

};


