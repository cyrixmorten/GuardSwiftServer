module.exports = function (req, res) {
    var fonts = {
        Roboto: {
            normal: 'fonts/Roboto-Regular.ttf',
            bold: 'fonts/Roboto-Medium.ttf',
            italics: 'fonts/Roboto-Italic.ttf',
            bolditalics: 'fonts/Roboto-Italic.ttf'
        }
    };

    
    var PdfPrinter = require('pdfmake/src/printer');
    var printer = new PdfPrinter(fonts);

    if (!req.body || !req.body.content) {
        res.status(500).send('Document definition missing');
        return;
    }

    res.status(200);
    res.set('Content-Type: application/octet-stream');

    var pdfDoc = printer.createPdfKitDocument(req.body);
    pdfDoc.pipe(res);
    pdfDoc.end();
};