var moment = require('moment-timezone-all');
var _ = require('lodash');

var makePDF = require('../../utils/pdf.js');


/**
 * Doc info and margins
 *
 * @param report
 * @param timeZone
 * @returns {{info: {title: string, author: string}, pageMargins: number[]}}
 */
exports.doc = function (report, timeZone) {
	return {
		info: {
			title: report.get('clientName') + ' ' + moment(report.get('createdAt')).tz(timeZone).format('DD-MM-YYYY'),
			author: 'GuardSwift'
		},

		pageMargins: [40, 60, 40, 60]
	}
};

/**
 * Top content of document
 *
 * @param report
 * @param timeZone
 * @returns {{header: {columns: *[], margin: number[]}}}
 */
exports.header = function (report, timeZone) {

	var guard = {
		id: report.get('guardId'),
		name: report.get('guardName')
	};

	return makePDF.leftRightAlignedContent({
		textLeft: [
			{text: 'Vagt: ', bold: true}, guard.name + ' ' + guard.id
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
exports.backgroundHeaderImage = function (settings) {

	var result = {};

	if (settings.has('headerLogo')) {
		var headerLogo = settings.get('headerLogo');

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
		} else {
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
exports.contentHeader = function (report, backgroundHeaderImage) {

	var pushTopMargin = (backgroundHeaderImage && backgroundHeaderImage.alignment && backgroundHeaderImage.alignment === 'center') ? 60 : 0;

	var client = {
		name: report.get('clientName'),
		address: report.get('clientAddress') + ' ' + report.get('clientAddressNumber')
	};

	return makePDF.header(client.name, client.address, pushTopMargin)
};

exports.footer = function (report) {
	return [
		{text: 'YDERLIGERE OPLYSNINGER PÅ TLF. 86 16 46 44', alignment: 'center'},
		{
			text: 'Rapporten er genereret af GuardSwift - elektroniske vagtrapporter via smartphones',
			alignment: 'center'
		}
	]
};

exports.styles = function() {
	return _.extend(makePDF.defaultStyles(), {
		// add additional styles here
	});
};
