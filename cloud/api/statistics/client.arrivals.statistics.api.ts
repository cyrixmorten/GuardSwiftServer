import * as moment from "moment-timezone"
import * as _ from "lodash";
import { ClientArrivalAutomationStatistics } from '../../statistics/clients.arrival.automation.statistics';
import { HighchartsExporter } from '../../utils/highcharts.exporter';
import { ManualAutomaticArrivalPieChart } from '../../../shared/highcharts/manual.automatic.piechart';
import { IClientArrivalAutomationStatistics } from '../../../shared/statistics/arrival.statistics.types';

export const API_JOB_CLIENT_ARRIVAL_STATISTICS = "clientArrivalStatistics";

Parse.Cloud.define(API_JOB_CLIENT_ARRIVAL_STATISTICS, async (request) => {

    const { params } = request;

    // https://momentjs.com/timezone/
    let timeZone = 'Europe/Copenhagen';

    // Dates formatted as ISO 8601
    // Example date: 2013-02-18 09:30
    let fromDate = '2019-09-10 09:00';
    let toDate = '2019-09-20 12:00';

    const clientArrivalAutomationResults = await new ClientArrivalAutomationStatistics(
        Parse.User.createWithoutData('H7UpVsPNH7'),
        moment(fromDate).toDate(),
        moment(toDate).toDate(),
    ).generate();
    
    const exporter = new HighchartsExporter({type: 'svg'});

    try {
        const result = await exporter.executeBatch(
                clientArrivalAutomationResults.map((result) => {
                    return new ManualAutomaticArrivalPieChart(result.total[0].statistics).getHighchartsOptions();
                })
            )
        
        exporter.done();

        console.log('result', result.length);
    } catch(e) {
        console.error('e', e);
    }

    return clientArrivalAutomationResults;

});