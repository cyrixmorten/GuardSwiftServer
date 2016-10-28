Parse.Cloud.define("fileToDatauri", function(request, response) {

    var buffer = request.params.buffer;
    var filetype = request.params.filetype;

    if (!buffer) {
        console.error(buffer);
        response.error('Missing file buffer param');
    }

    if (!filetype) {
        console.error(filetype);
        response.error('Missing filetype param');
    }


    return Parse.Cloud.httpRequest({
        method: 'POST',
        url: 'http://www.guardswift.com/api/datauri',
        headers: {
            'Content-Type': 'application/json'
        },
        body: {
            buffer: buffer,
            filetype: filetype
        }
    })
});
