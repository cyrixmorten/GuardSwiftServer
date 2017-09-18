// TODO deprecated after 5.0.0
Parse.Cloud.afterSave("Circuit", function (request) {
    var Circuit = request.object;
    if (!Circuit.has('createdDay')) {
        console.log("Create new circuitStarted");
        Parse.Cloud.run("createCircuitStarted", {
            objectId: Circuit.id
        });
    }
});


