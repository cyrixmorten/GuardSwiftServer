Parse.Cloud.define("fileToDatauri", function (request, response) {
    let buffer = request.params.buffer;
    let filetype = request.params.filetype;
    if (!buffer) {
        console.error(buffer);
        response.error('Missing file buffer param');
    }
    if (!filetype) {
        console.error(filetype);
        response.error('Missing filetype param');
    }
    // return Parse.Cloud.httpRequest({
    //     method: 'POST',
    //     url: 'http://www.guardswift.com/api/datauri',
    //     headers: {
    //         'Content-Type': 'application/json'
    //     },
    //     body: {
    //         buffer: buffer,
    //         filetype: filetype
    //     }
    // })
});
//# sourceMappingURL=fileToDatauri.js.map