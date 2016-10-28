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


exports.tableBorderedWithHeader = function(options) {

	//options = {
	//	widths : ['*','*', '50'],
	//	header: ['h1', 'h2', 'h3'],
	//	content : [['col1'], ['col2'], ['col3']]
	//};

	var contentWithHeader = function (reportContent) {
		// define header
		var tableHeader = [];

		_.forEach(options.header, function(header) {
			tableHeader.push(
				{text: header, style: 'tableHeader'}
			);
		});

		// insert header
		reportContent.unshift(tableHeader);

		return reportContent;
	};

	return {
		table: {
			widths: options.widths,
			headerRows: 1,
			body: _.isEmpty(options.content) ? [[]] : contentWithHeader(options.content)
		},
		layout: {
			hLineWidth: function (i, node) {
				return (i === 0 || i === node.table.body.length) ? 2 : 1;
			},
			vLineWidth: function (i, node) {
				return (i === 0 || i === node.table.widths.length) ? 2 : 1;
			},
			hLineColor: function (i, node) {
				return (i === 0 || i === node.table.body.length) ? 'black' : 'gray';
			},
			vLineColor: function (i, node) {
				return (i === 0 || i === node.table.widths.length) ? 'black' : 'gray';
			}
		},
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
			headerRows: 0,
			body: _.isEmpty(options.content) ? [[]] : options.content
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
			fontSize: 13,
			color: 'black'
		},
		boldFont: {
			bold: true
		}
	};
};