import {ReportBuilder} from "./report.builder";
import {sendReport} from "./report.send.to.client";

Parse.Cloud.define("reportToDoc",   (request, response) => {
    ReportBuilder.buildDoc(request.params.reportId).then((res) => {
        response.success(res);
    }, (err) => {
        response.error(err);
    })
});

Parse.Cloud.define("sendReport", (request, response) => {
    sendReport(request.params.reportId).then(() => {
        response.success('Report successfully sent!')
    }, (error) => {
        response.error(error)
    })
});