import * as _ from "lodash";

export const API_FUNCTION_DELETE_FILE = "fileDelete";

/**
 * Delete a file written to Parse
 */
Parse.Cloud.define(API_FUNCTION_DELETE_FILE,  (request, response) => {

    let fileUrl: string = request.params.fileUrl;

    if (!fileUrl) {
        response.error('Missing fileUrl param');
    }


    let deleteUrl = fileUrl.substring(fileUrl.lastIndexOf("/")+1);

    console.log('Deleting file: ' + deleteUrl);

    return Parse.Cloud.httpRequest({
        method: 'DELETE',
        url: process.env.SERVER_URL + '/files/' + deleteUrl,
        headers: {
            "X-Parse-Application-Id": process.env.APP_ID,
            "X-Parse-Master-Key" : process.env.MASTER_KEY
        }
    }).then(() => {
        let msg = 'File successfully deleted';

        console.log(msg);
        response.success(msg);
    }, (error) => {

        console.error('Error deleting file');
        console.error(error);

        response.error(error);
    });



});