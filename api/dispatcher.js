"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Parse.initialize(process.env.APP_ID);
Parse.serverURL = process.env.SERVER_URL;
class AlarmDispatcher {
    /**
     * Handle incoming messages from either SMS, Email or REST
     *
     * For now all messages are assumed to be alarms
     *
     * @param from
     * @param to
     * @param body
     * @param res
     */
    static handle(from, to, body, res) {
        return Parse.Cloud.run('alarm', {
            sender: from,
            receiver: to,
            alarm: body
        })
            .then(function (response) {
            res.send(response);
        }, function (error) {
            res.status(400).send(error);
        });
    }
    ;
}
exports.AlarmDispatcher = AlarmDispatcher;
//# sourceMappingURL=dispatcher.js.map