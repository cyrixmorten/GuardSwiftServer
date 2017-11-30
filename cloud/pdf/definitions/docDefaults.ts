import * as moment from 'moment-timezone-all';
import * as _ from 'lodash';
import {PDFUtils} from "../../utils/pdf";
import {Report} from "../../../shared/subclass/Report";
import {EventLog} from "../../../shared/subclass/EventLog";


export class PDFDefaults {
    /**
     * Doc info and margins
     *
     * @param report
     * @param timeZone
     * @returns {{info: {title: string, author: string}, pageMargins: number[]}}
     */
    static doc = function (report, timeZone) {
        return {
            info: {
                title: report.get('clientName') + ' ' + moment(report.get('createdAt')).tz(timeZone)
                    .format('DD-MM-YYYY'),
                author: 'GuardSwift' // TODO hardcoded - needed?
            },

            pageMargins: [40, 60, 40, 60]
        }
    };

    private static findGuardName = (report: Report) => {
        let guardName = report.guardName || '';

        // take first event with guard name attached
        let guardEvent = _.find(report.eventLogs, (eventLog: EventLog) => !!eventLog.guardName);

        _.forEach(report.eventLogs, (eventLog: EventLog) => {
            if (eventLog.taskEvent === 'ARRIVE' && !!eventLog.guardName) {
                // swap with arrival
                guardEvent = eventLog;
            }
        });

        // prefer guard from eventlog otherwise use name of guard creating the report
        return guardEvent ? guardEvent.guardName : guardName;
    };


    /**
     * Top content of document
     *
     * @param report
     * @param timeZone
     * @returns {{header: {columns: *[], margin: number[]}}}
     */
    static header = function (report, timeZone) {

        return PDFUtils.leftRightAlignedContent({
            textLeft: [
                {text: 'Vagt: ', bold: true}, PDFDefaults.findGuardName(report)
            ],
            textRight: 'Dato: ' + moment(report.get('createdAt')).tz(timeZone).format('DD-MM-YYYY'),
            margin: [10, 10]
        })
    };

    /**
     * Header image is set as background to allow header and image on same horizontal space
     * for 'left' and 'right' alignment
     *
     * @param report
     * @param settings
     * @returns {{}}
     */
    static backgroundHeaderImage = function (settings) {

        let result = <any>{};

        if (settings.has('headerLogo')) {
            let headerLogo = settings.get('headerLogo');

            if (headerLogo.datauri) {
                result = {
                    image: headerLogo.datauri,
                    margin: [15, 60, 15, 0]
                }
            }

            /** defaults **/
            result.alignment = "center";


            if (headerLogo.alignment) {
                result.alignment = headerLogo.alignment;
            }

            if (headerLogo.stretch) {
                // make image take up full width
                result.width = (21 / 2.54) * 72 - (2 * 40); // (cm / 2.54) * dpi - margin
            }
            else {
                if (headerLogo.width) {
                    result.width = headerLogo.width
                }


                if (headerLogo.height) {
                    result.height = headerLogo.height
                }

                // if neither height or width is specified, set width to 3cm
                // from pdfmake: if you specify width, image will scale proportionally
                if (!headerLogo.width && !headerLogo.height) {
                    result.width = (3 / 2.54) * 72;
                }
            }


        }

        return result;
    };

    /**
     * Title of the document, takes an optional backgroundHeaderImage argument to determine whether to
     * add additional margin due to image taking up space over the title.
     *
     * @param report
     * @param backgroundHeaderImage
     * @returns {{text: *[], margin: number[]}}
     */
    static contentHeader = function (report, backgroundHeaderImage?) {

        let pushTopMargin = (backgroundHeaderImage && backgroundHeaderImage.alignment && backgroundHeaderImage.alignment === 'center') ? 60 : 0;

        let client = {
            name: report.get('clientName'),
            address: report.get('clientAddress') + ' ' + report.get('clientAddressNumber')
        };

        return PDFUtils.header(client.name, client.address, pushTopMargin)
    };

    static footer = function (report) {
        return [
            {text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 10 49 50', alignment: 'center'},
            {
                text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
                alignment: 'center'
            }
        ]
    };

    static styles = function () {
        return _.extend(PDFUtils.defaultStyles(), {
            // add additional styles here
        });
    };
}
