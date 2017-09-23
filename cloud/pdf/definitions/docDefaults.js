"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const moment = require("moment-timezone-all");
const _ = require("lodash");
const pdf_1 = require("../../utils/pdf");
class PDFDefaults {
}
/**
 * Doc info and margins
 *
 * @param report
 * @param timeZone
 * @returns {{info: {title: string, author: string}, pageMargins: number[]}}
 */
PDFDefaults.doc = function (report, timeZone) {
    return {
        info: {
            title: report.get('clientName') + ' ' + moment(report.get('createdAt')).tz(timeZone)
                .format('DD-MM-YYYY'),
            author: 'GuardSwift' // TODO hardcoded - needed?
        },
        pageMargins: [40, 60, 40, 60]
    };
};
/**
 * Top content of document
 *
 * @param report
 * @param timeZone
 * @returns {{header: {columns: *[], margin: number[]}}}
 */
PDFDefaults.header = function (report, timeZone) {
    let guard = {
        id: report.get('guardId'),
        name: report.get('guardName')
    };
    return pdf_1.PDFUtils.leftRightAlignedContent({
        textLeft: [
            { text: 'Vagt: ', bold: true }, guard.name + ' ' + guard.id
        ],
        textRight: 'Dato: ' + moment(report.get('createdAt')).tz(timeZone).format('DD-MM-YYYY'),
        margin: [10, 10]
    });
};
/**
 * Header image is set as background to allow header and image on same horizontal space
 * for 'left' and 'right' alignment
 *
 * @param report
 * @param settings
 * @returns {{}}
 */
PDFDefaults.backgroundHeaderImage = function (settings) {
    let result = {};
    if (settings.has('headerLogo')) {
        let headerLogo = settings.get('headerLogo');
        if (headerLogo.datauri) {
            result = {
                image: headerLogo.datauri,
                margin: [15, 60, 15, 0]
            };
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
                result.width = headerLogo.width;
            }
            if (headerLogo.height) {
                result.height = headerLogo.height;
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
PDFDefaults.contentHeader = function (report, backgroundHeaderImage) {
    let pushTopMargin = (backgroundHeaderImage && backgroundHeaderImage.alignment && backgroundHeaderImage.alignment === 'center') ? 60 : 0;
    let client = {
        name: report.get('clientName'),
        address: report.get('clientAddress') + ' ' + report.get('clientAddressNumber')
    };
    return pdf_1.PDFUtils.header(client.name, client.address, pushTopMargin);
};
PDFDefaults.footer = function (report) {
    return [
        { text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 10 49 50', alignment: 'center' },
        {
            text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
            alignment: 'center'
        }
    ];
};
PDFDefaults.styles = function () {
    return _.extend(pdf_1.PDFUtils.defaultStyles(), {});
};
exports.PDFDefaults = PDFDefaults;
//# sourceMappingURL=docDefaults.js.map