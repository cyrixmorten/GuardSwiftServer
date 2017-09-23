"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PdfPrinter = require("pdfmake/src/printer");
exports.pdfMake = (req, res) => {
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
    let pdfDoc = printer.createPdfKitDocument(req.body);
    pdfDoc.pipe(res);
    pdfDoc.end();
};
//# sourceMappingURL=pdfmake.js.map