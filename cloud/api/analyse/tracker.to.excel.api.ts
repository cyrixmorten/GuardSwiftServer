import * as _ from 'lodash';
import * as fs from 'fs'
import {Tracker, TrackerQuery} from "../../../shared/subclass/Tracker";
import * as XLSX from "xlsx"
import * as zlib from "zlib";
import * as moment from "moment-timezone-all"
import HttpResponse = Parse.Cloud.HttpResponse;
import FunctionResponse = Parse.Cloud.FunctionResponse;
import FunctionRequest = Parse.Cloud.FunctionRequest;
import {GPSData} from "../../../shared/GPSData";
import {Dictionary} from "lodash";
import {WorkSheet} from "xlsx";

export const API_FUNCTION_TRACKER_TO_CSV = "trackerToExcel";

Parse.Cloud.define(API_FUNCTION_TRACKER_TO_CSV, async (request: FunctionRequest, response: FunctionResponse) => {
    try {

        let params = request.params;

        if (!params.id) {
            throw new Error('Missing id param')
        }

        /* create workbook & set props*/
        const wb = {
            Props: {
                Title: "GPS data",
                Author: "GuardSwift"
            }, SheetNames: [], Sheets: {}
        };

        // .matchingId(params.id)
        let trackers: Tracker[] = await new TrackerQuery()
            .matchingGuard('lZjsdZS9iH')
            .include(Tracker._owner, Tracker._guard)
            .build()
            .limit(10)
            .descending(Tracker._start)
            .find({useMasterKey: true});


        let worksheets: Dictionary<WorkSheet> = {};

        let writeTrackersToSheets = async (trackers: Tracker[]) => {
            for (const tracker of trackers) {
                let timeZone = tracker.owner.timeZone;

                let fileResponse: HttpResponse = await Parse.Cloud.httpRequest({
                        url: tracker.gpsFile.url(),
                    }
                );

                let gpsFile = zlib.gunzipSync(fileResponse.buffer);
                let gpsString = gpsFile.toString('utf-8');
                let gpsLinks = [];

                let gpsJSONArray = _.map(JSON.parse(gpsString), (gpsData: Partial<GPSData>) => {
                    gpsData = _.pick(gpsData, 'time', 'latitude', 'longitude');

                    gpsData.time = moment(gpsData.time).tz(timeZone).format('HH:mm:ss DD-MM');

                    let link = `https://www.google.com/maps/?q=${gpsData.latitude},${gpsData.longitude}`;
                    gpsLinks.push(link);

                    return _.extend(gpsData, {link: link});
                });

                /*create sheet data & add to workbook*/
                let ws_name = moment(tracker.start).tz(timeZone).format('DD-MM-YY');

                if (worksheets[ws_name]) {
                    // add to existing sheet
                    worksheets[ws_name] = await XLSX.utils.sheet_add_json(worksheets[ws_name], gpsJSONArray);
                }
                else {
                    // create new sheet
                    worksheets[ws_name] = await XLSX.utils.json_to_sheet(gpsJSONArray);
                }

                // add map links
                let ws = worksheets[ws_name];

                let startRow = 2;
                for (const link of gpsLinks) {
                    XLSX.utils.cell_set_hyperlink(ws[`D${startRow}`], link);
                    startRow++;
                }

                ws["!cols"] = [
                    {wch: 15},
                    {wch: 10},
                    {wch: 10},
                    {wch: 55}
                ]
            }
        };

        await writeTrackersToSheets(trackers);

        // write all sheets to book
        _.forOwn(worksheets, async (ws: WorkSheet, ws_name) => {
            console.log('ws_name: ', ws_name);
            await XLSX.utils.book_append_sheet(wb, ws, ws_name);
        });

        /* create file 'in memory' */
        let wbout = new Buffer(XLSX.write(wb, {bookType: 'xlsx', type: 'buffer'}));

        fs.writeFileSync('gpsdata.xlsx', wbout);


        // /* send it by web request - where app is express()*/
        // app.get('/api/jobs/download', (req, res) => {
        //     var filename = "myDataFile.xlsx";
        //     res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        //     res.type('application/octet-stream');
        //     res.send(wbout);
        // }
        response.success('Created xlsx for ' + trackers.length + ' trackers');
    } catch (e) {
        response.error(e);
    }


});

