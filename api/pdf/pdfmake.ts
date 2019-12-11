import * as pdfMakePrinter from 'pdfmake/src/printer';

const createPdfBinary = (pdfDoc) => {
    return new Promise((resolve, reject) => {
        try {
            const fonts = {
                Roboto: {
                    normal: 'fonts/Roboto-Regular.ttf',
                    bold: 'fonts/Roboto-Medium.ttf',
                    italics: 'fonts/Roboto-Italic.ttf',
                    bolditalics: 'fonts/Roboto-Italic.ttf'
                }
            }
        
            const printer = new pdfMakePrinter(fonts);
            const doc = printer.createPdfKitDocument(pdfDoc);

            const chunks = [];

            doc.on('data', (chunk) => {
                chunks.push(chunk);
            });
            doc.on('end',  () => {
                //resolve('data:application/pdf;base64,' + Buffer.concat(chunks).toString('base64'));
                resolve(Buffer.concat(chunks));
            });
            doc.end();
        } catch(e) {
            reject(e);
        }
    });

}

export const pdfMake = async (req, res) => {
    if (!req.body || !req.body.content) {
        res.status(500).send('Document definition missing');
        return;
    }

    try {
        const binary = await createPdfBinary(req.body);
		res.contentType('application/pdf');
		res.send(binary);
    } catch(e) {
        res.status(400).send('ERROR:' + JSON.stringify(e));
    }
};
