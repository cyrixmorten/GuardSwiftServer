import * as _ from 'lodash';
import {Dictionary} from 'lodash';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import {WorkSheet} from 'xlsx';
import * as moment from 'moment-timezone-all';
import {EventLog, EventLogQuery, TaskEvent} from '../../../shared/subclass/EventLog';
import FunctionResponse = Parse.Cloud.FunctionResponse;
import FunctionRequest = Parse.Cloud.FunctionRequest;
import {Task} from '../../../shared/subclass/Task';


export const API_FUNCTION_EVENTLOG_TO_EXCEL = "eventLogToExcel";

Parse.Cloud.define(API_FUNCTION_EVENTLOG_TO_EXCEL, async (request: FunctionRequest, response: FunctionResponse) => {
    try {


        /* create workbook & set props*/
        const wb = {
            Props: {
                Title: "Event data",
                Author: "GuardSwift"
            }, SheetNames: [], Sheets: {}
        };

        const timeZone = 'Europe/Copenhagen';
        const thirtyDaysAgo = moment().subtract(30, 'days').toDate();
        const activityId = 'jZubOxclSZ';

        let eventLogs: EventLog[] = await new EventLogQuery()
            .createdAfter(thirtyDaysAgo)
            .matchingTaskEvent(TaskEvent.ARRIVE)
            .matchingTask(Task.createWithoutData(activityId))
            .build()
            .find({useMasterKey: true});



        let worksheets: Dictionary<WorkSheet> = {};

        let writeTrackersToSheets = async (eventLogs: EventLog[]) => {
            const ws_name = 'Ankomst hændelser';

            worksheets[ws_name] = await XLSX.utils.json_to_sheet(_.map(eventLogs, (eventLog) => {
                return {
                    date: moment(eventLog.deviceTimestamp).tz(timeZone).format('DD-MM'),
                    time: moment(eventLog.deviceTimestamp).tz(timeZone).format('HH:mm'),
                    guard: eventLog.guardName,
                    automatic: eventLog.automatic,
                    activity: eventLog.activityName,
                    withinSchedule: eventLog.withinSchedule
                }
            }));

        };

        await writeTrackersToSheets(eventLogs);

        // write all sheets to book
        _.forOwn(worksheets, async (ws: WorkSheet, ws_name) => {
            console.log('ws_name: ', ws_name);
            await XLSX.utils.book_append_sheet(wb, ws, ws_name);
        });

        /* create file 'in memory' */
        let wbout = new Buffer(XLSX.write(wb, {bookType: 'xlsx', type: 'buffer'}));

        fs.writeFileSync('temp/eventlogs.xlsx', wbout);


        // /* send it by web request - where app is express()*/
        // app.get('/api/jobs/download', (req, res) => {
        //     var filename = "myDataFile.xlsx";
        //     res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        //     res.type('application/octet-stream');
        //     res.send(wbout);
        // }
        response.success('Created xlsx for ' + eventLogs.length + ' eventlogs');
    } catch (e) {
        response.error(e);
    }


});

