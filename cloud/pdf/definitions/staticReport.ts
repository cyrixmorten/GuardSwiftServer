import * as _ from 'lodash';
import {PDFDefaults} from "./docDefaults";
import {ReportUtils} from "../reportUtils";
import {PDFUtils} from "../../utils/pdf";



/**
 * Generate static report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
export let createDoc = function (report, settings, timeZone) {

    let events = ReportUtils.reportEventsMap(report, timeZone);

    return _.extend(PDFDefaults.doc(report, timeZone), {

        background: PDFDefaults.backgroundHeaderImage(settings),

        header: PDFDefaults.header(report, timeZone),

        content: [
            PDFDefaults.contentHeader(report),
            PDFUtils.tableNoBorders({
                widths: [50, '*'],
                content: _.zip(events.timestamps, events.remarks)
            })
        ],

        footer: PDFDefaults.footer(report),


        styles: PDFDefaults.styles()

    });
};