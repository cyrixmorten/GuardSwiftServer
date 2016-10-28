var _ = require('lodash');

var pdfUtils = require('../../utils/pdf.js');

var docDefaults = require('./docDefaults.js');
var reportUtils = require('../reportUtils.js');


/**
 * Generate static report doc definition
 *
 * @param report
 * @param settings
 * @param timeZone
 */
exports.createDoc = function (report, settings, timeZone) {

    var events = reportUtils.reportEventsMap(report, timeZone);

    return _.extend(docDefaults.doc(report, timeZone), {

        background: docDefaults.backgroundHeaderImage(settings),

        header: docDefaults.header(report, timeZone),

        content: [
            docDefaults.contentHeader(report),
            pdfUtils.tableNoBorders({
                widths: [50, '*'],
                content: _.zip(events.timestamps, events.remarks)
            })
        ],

        footer: docDefaults.footer(report),


        styles: docDefaults.styles()

    });
};