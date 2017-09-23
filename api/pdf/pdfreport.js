"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const reportToPdf = require("../../cloud/pdf/reportToPDF");
exports.toPdf = (req, res) => {
    reportToPdf.toPdf(req.params.id).then(function (response) {
        // res.set('Content-Type: application/octet-stream');
        res.status(200);
        res.send(response.buffer);
    }, function (error) {
        res.status(400).send(error);
    });
};
//# sourceMappingURL=pdfreport.js.map