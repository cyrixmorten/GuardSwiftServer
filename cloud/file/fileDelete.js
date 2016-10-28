
/**
 * Delete a file written to Parse
 */
Parse.Cloud.define("fileDelete", function (request, response) {

    var file = request.params.file;

    if (!file) {
        console.error(file);
        response.error('Missing file param');
    }

    if (!file.url()) {
        console.error(file);
        response.error('File is missing url');
    }

    console.log('App ID: ' + Parse.applicationId);

    console.log('Deleting file: ' + JSON.stringify(file));

    var deleteUrl = file.url().substring(file.url().lastIndexOf("/")+1);

    console.log('Deleting file: ' + JSON.stringify(deleteUrl));

    return Parse.Cloud.httpRequest({
        method: 'DELETE',
        url: process.env.SERVER_URL + '/files/' + deleteUrl,
        headers: {
            "X-Parse-Application-Id": process.env.APP_ID,
            "X-Parse-Master-Key" : process.env.MASTER_KEY
        }
    }).then(function() {
        var msg = 'File successfully deleted';

        console.log(msg);
        response.success(msg);
    }).fail(function(error) {

        console.error('Error deleting file');
        console.error(error);

        response.error(error);
    });



});