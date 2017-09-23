"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const docDefaults_1 = require("./docDefaults");
const reportUtils_1 = require("../reportUtils");
const pdf_1 = require("../../utils/pdf");
/**
 * Generate static report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
exports.createDoc = function (report, settings, timeZone) {
    let events = reportUtils_1.ReportUtils.reportEventsMap(report, timeZone);
    return _.extend(docDefaults_1.PDFDefaults.doc(report, timeZone), {
        background: docDefaults_1.PDFDefaults.backgroundHeaderImage(settings),
        header: docDefaults_1.PDFDefaults.header(report, timeZone),
        content: [
            docDefaults_1.PDFDefaults.contentHeader(report),
            pdf_1.PDFUtils.tableNoBorders({
                widths: [50, '*'],
                content: _.zip(events.timestamps, events.remarks)
            })
        ],
        footer: docDefaults_1.PDFDefaults.footer(report),
        styles: docDefaults_1.PDFDefaults.styles()
    });
};
//# sourceMappingURL=staticReport.js.map