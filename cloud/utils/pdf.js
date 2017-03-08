var _ = require('lodash');


exports.header = function (header, subHeader, pushTopMargin) {
	return {
		text: [
			{text: header, style: 'header'}, ' ', {text: subHeader, style: ['header', 'subHeader']}
		],
		// margin: [left, top, right, bottom]
		margin: [50, 40 + pushTopMargin, 50, 30]
	}
};

exports.leftRightAlignedContent = function (options) {

	//options = {
	//	textLeft : {text: '', color: 'grey'},
	//	textRight : {text: '', color: 'grey'},
	//	margin: [0, 10],
	//	style: {bold: true}
	//};

	var content = {
		columns : []
	};

	var leftContent = function() {
		return {
			width: 'auto',
			text: options.textLeft
		}
	};

	var rightContent = function() {
		return {
			width: '*',
			text: options.textRight,
			alignment: 'right'
		}
	};


	if (options.textLeft) {
		content.columns.push(leftContent())
	}

	if (options.textRight) {
		content.columns.push(rightContent())
	}

	if (options.margin) {
		content.margin = options.margin;
	}

	if (options.style) {
		content.style = options.style;
	}

	return content;
};


var contentWithHeader = function (reportHeader, reportContent) {
    // define header
    var tableHeader = [];

    _.forEach(reportHeader, function(header) {
        tableHeader.push(
            {text: header, style: 'tableHeader'}
        );
    });

    // insert header
	if (!_.isEmpty(tableHeader)) {
    	reportContent.unshift(tableHeader);
    }

    return reportContent;
};


exports.tableWithBorder = function(options) {

	//options = {
	//	widths : ['*','*', '50'],
	//	header: ['h1', 'h2', 'h3'],
	//	content : [['col1'], ['col2'], ['col3']]
	//};


	return {
		table: {
			widths: options.widths,
            headerRows: options.header ? 1 : 0,
			body: _.isEmpty(options.content) ? [[]] : contentWithHeader(options.header, options.content)
		},
        layout: 'lightHorizontalLines',
		margin: [0, 30]
	}
};

exports.tableNoBorders = function(options) {

	//options = {
	//	widths : ['*','*', '50'],
	//	content : [['col1'], ['col2'], ['col3']]
	//};

	return {
		table: {
			widths: options.widths,
			headerRows: options.header ? 1 : 0,
			body: _.isEmpty(options.content) ? [[]] : contentWithHeader(options.header, options.content)
		},
		layout: 'noBorders',
		margin: [0, 30]
	}
};


exports.defaultStyles = function () {
	return {
		header: {
			fontSize: 22,
			bold: true,
			alignment: 'center'
		},
		subHeader: {
			fontSize: 16,
			color: 'grey'
		},
		tableHeader: {
			bold: true,
			fontSize: 11,
			color: 'black'
		},
		boldFont: {
			bold: true
		}
	};
};