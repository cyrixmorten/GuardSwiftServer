// import * as _ from 'lodash';
// import {PDFDefaults} from "./docDefaults";
// import {ReportUtils} from "../reportUtils";
// import {PDFUtils} from "../../utils/pdf";
// import {TaskGroupStarted} from "../../../shared/subclass/TaskGroupStarted";
// import {settings} from "cluster";
//
//
//
// /**
//  * Generate taskGroupStarted summary doc definition
//  *
//  * @param taskGroupStarted
//  * @param timeZone
//  */
// export let createDoc = function (taskGroupStarted: TaskGroupStarted, timeZone: string) {
//
//     let events = ReportUtils.reportEventsMap(report, timeZone);
//
//     return _.extend(PDFDefaults.doc(report, timeZone), {
//
//         background: PDFDefaults.backgroundHeaderImage(settings),
//
//         header: PDFDefaults.header(report, timeZone),
//
//         content: [
//             PDFDefaults.contentHeader(report),
//             PDFUtils.tableNoBorders({
//                 widths: [50, '*'],
//                 content: _.zip(events.timestamps, events.remarks)
//             })
//         ],
//
//         footer: PDFDefaults.footer(report),
//
//
//         styles: PDFDefaults.styles()
//
//     });
// };