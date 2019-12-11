import { getClientArrivalWeekReportData } from '../../cloud/api/statistics/client.arrivals.week.report';
import { PdfmakeUtils } from '../../cloud/pdf/pdfmake.utils';

export const weekReportApi = async (req, res) => {

    try {

        const { body } = req;

        const report = await getClientArrivalWeekReportData(body.fromDate);

        const buffer = await PdfmakeUtils.toPDFBuffer(report);
        //res.setHeader('Content-Type', 'application/pdf');
        //res.setHeader('Content-Length', buffer.length);
        res.contentType('application/pdf');
        res.send(buffer);
    } catch(e) {
        console.error(e);
        res.status(400).send(e);
    }

};
