import { ReportToPDF } from "../pdf/report.to.pdf";
import * as moment from 'moment';
import { Report, ReportQuery } from '../../shared/subclass/Report';
import { Client } from '../../shared/subclass/Client';
import { ReportSettingsQuery } from '../../shared/subclass/ReportSettings';
import * as _ from 'lodash';
import { TaskType } from '../../shared/subclass/Task';
import * as fs from "fs";
// @ts-ignore
const zip = new require('node-zip')();

export const API_FUNCTION_REPORT_TO_ZIP = "reportsToZip";

Parse.Cloud.define(API_FUNCTION_REPORT_TO_ZIP,   async (request) => {
    const searchFrom = moment().subtract(6, 'months').toDate();

    const reports = await new ReportQuery()
        .createdAfter(searchFrom)
        .matchingClient(Client.createWithoutData('GkJz3W9hg6'))
        .build()
        .addAscending(Report._createdAt)
        .select(Report._objectId, Report._owner)
        .limit(Number.MAX_SAFE_INTEGER)
        .find({useMasterKey: true});

    console.log('reports.length', reports.length);

    if (reports.length === 0) {
        return 'No reports';
    }

    const firstReport = _.head(reports);

    const settings =  await new ReportSettingsQuery()
        .matchingOwner(firstReport.owner)
        .matchingAllTaskTypes([TaskType.REGULAR])
        .build().first({useMasterKey: true});

    await Promise.all(
        reports.map(async (report) => {
            const pdfBuffer = await ReportToPDF.buildPdf(report.id, !!request.params.customerFacing, settings);
            zip.file(
                moment(report.createdAt).format( 'YYYY-MM-DD')+'.pdf',
                pdfBuffer
            );
        })
    );


    const data = zip.generate({ base64:false, compression: 'DEFLATE' });

    fs.writeFileSync('Tivoli Friheden.zip', data, 'binary');
});

