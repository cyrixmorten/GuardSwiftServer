import * as PdfPrinter from 'pdfmake/src/printer';

export let pdfMake = (req, res) => {
    let fonts = {
        Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-Italic.ttf'
        }
    };

    
    let printer = new PdfPrinter(fonts);

    if (!req.body || !req.body.content) {
        res.status(500).send('Document definition missing');
        return;
    }

    res.status(200);
    res.set('Content-Type: application/octet-stream');

    var options = {
        tableLayouts: {
            regularRaid: {
                hLineWidth(i, node) {
                    if (i === 0 || i === node.table.body.length) {
                        return 0;
                    }
                    return 1;
                },
                vLineWidth(i) {
                    return 0;
                },
                hLineColor(i, node) {
                    return (i === node.table.headerRows) ? 'grey' : 'lightgrey';
                },
                paddingLeft(i) {
                    return i === 0 ? 0 : 8;
                },
                paddingRight(i, node) {
                    return (i === node.table.widths.length - 1) ? 0 : 8;
                }
            }
        }
    }

    let pdfDoc = printer.createPdfKitDocument(req.body, options);

    pdfDoc.pipe(res);
    pdfDoc.end();
};
