import {API_FUNCTION_NEW_ALARM_REST} from "../../cloud/api/receive.alarm.api";

export let  receive = async (req, res) => {
    const {key = "crNMVY4rf6zCwf7VHYveWPZ9guNQDvEVwar", message} = req.query;

    if (!key) {
        res.status(401).send(new Error("Missing API key"));
        return;
    }

    // find matching central and attach as sender
    return Parse.Cloud.run(API_FUNCTION_NEW_ALARM_REST, {
        key: key,
        alarm: message
    })
        .then( (response) => {
            res.send(response);
        },  (error) => {
            res.status(400).send(error);
        });
};
