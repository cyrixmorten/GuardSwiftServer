import { HighchartsExporter } from '../../../utils/highcharts.exporter';
import * as moment from "moment-timezone"
import * as _ from "lodash";
import { ClientArrivalAutomationStatistics } from '../../../statistics/clients.arrival.automation.statistics';
import { ClientArrivalReportTable } from './client.arrival.table';
import { PdfmakeUtils } from '../../pdfmake.utils';

export class ClientArrivalWeekReport {

    constructor(
        private owner: Parse.User, 
        private weekBackFromDate: Date) {}


    public async getDefinition() {

        const toDate = moment(this.weekBackFromDate);
        const fromDate = toDate.clone().subtract(1, 'week');

        const statistics = await new ClientArrivalAutomationStatistics(
            Parse.User.createWithoutData(this.owner.id),
            fromDate.toDate(),
            toDate.toDate(),
        ).generate();

        const exporter = new HighchartsExporter({type: 'png'});

        const sortedStatistics = _.take(_.sortBy(statistics, (stat) => stat.client.name), 55);


        return {
            header: {
                "margin": [10, 10],
                columns: [
                `Automatisk ankomst uge ${fromDate.isoWeek()}`, // TODO translate
                { text: `${fromDate.format('DD-MM-YYYY HH:mm')} - ${toDate.format('DD-MM-YYYY HH:mm')}`, alignment: 'right' }
                ]
            },
            content: await Promise.all(_.map(sortedStatistics, (stat) => {
                return new ClientArrivalReportTable(stat, exporter).getTable();
            }))
        }
    }

    public async getPdf(): Promise<Buffer> {
        return PdfmakeUtils.toPDFBuffer(await this.getDefinition());
    }


}