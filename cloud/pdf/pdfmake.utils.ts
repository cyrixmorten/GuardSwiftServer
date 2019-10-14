import HttpResponse = Parse.Cloud.HttpResponse;
import * as _ from 'lodash';

export class PdfmakeUtils {

    static async toPDFBuffer(docDefinition: any): Promise<Buffer> {

        const response = await Parse.Cloud.httpRequest({
            method: 'POST',
            url: process.env.APP_URL + '/api/pdfmake',
            headers: {
                'Content-Type': 'application/json;charset=utf-8'
            },
            body: docDefinition
        });
    
        if (response.status !== 200) {
            throw new Error(JSON.stringify(response));
        }
    
        return response.buffer
    };
    
}





