export class AlarmDispatcher {

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
            .then( (response) => {
                res.send(response);
            },  (error) => {
                res.status(400).send(error);
            });
    };

}

