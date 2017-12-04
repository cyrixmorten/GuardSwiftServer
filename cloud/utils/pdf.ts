import * as _ from 'lodash';

export class PDFUtils {
    static header = function (header, subHeader, pushTopMargin) {
        return {
            text: [
                {text: header, style: 'header'}, ' ', {text: subHeader, style: ['header', 'subHeader']}
            ],
            // margin: [left, top, right, bottom]
            margin: [50, 40 + pushTopMargin, 50, 30]
        }
    };

    static leftRightAlignedContent = function (options) {

        //options = {
        //	textLeft : {text: '', color: 'grey'},
        //	textRight : {text: '', color: 'grey'},
        //	margin: [0, 10],
        //	style: {bold: true}
        //};

        let content = <any>{
            columns: []
        };

        let leftContent = function () {
            return {
                width: 'auto',
                text: options.textLeft
            }
        };

        let rightContent = function () {
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



    static table = (options: {widths: Array<'*' | number>, header?: string[], content: any[], layout?: 'noBorders' | 'headerLineOnly' | 'lightHorizontalLines' }) => {

        //options = {
        //	widths : ['*','*', '50'],
        //	header: ['h1', 'h2', 'h3'],
        //	content : [['col1'], ['col2'], ['col3']]
        //};

        // define header
        let tableHeader = [];

        _.forEach(options.header, function (header) {
            tableHeader.push(
                {text: header, style: 'tableHeader'}
            );
        });

        // insert header
        if (!_.isEmpty(tableHeader)) {
            options.content.unshift(tableHeader);
        }

        return {
            table: {
                widths: options.widths,
                headerRows: options.header ? 1 : 0,
                body: _.isEmpty(options.content) ? [[]] : options.content
            },
            layout: options.layout,
            margin: [0, 30]
        }
    };


    static defaultStyles = () => {
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
}