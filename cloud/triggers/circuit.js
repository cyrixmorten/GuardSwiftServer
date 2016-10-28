
Parse.Cloud.afterSave("Circuit", function (request) {
    var Circuit = request.object;
    if (!Circuit.has('createdDay')) {
        console.log("Create new circuitStarted");
        Parse.Cloud.run("createCircuitStarted", {
            objectId: Circuit.id
        });
    }
});

Parse.Cloud.afterDelete("Circuit", function(request) {
  query = new Parse.Query("CircuitStarted");
  query.equalTo("circuit", request.object);
  query.doesNotExist('timeEnded');
  query.find().then(function(circuitsStarted) {
  		var now = new Date();
  		circuitsStarted.forEach(function(circuitStarted) {
  			circuitStarted.set('timeEnded', now);
  			circuitStarted.save();
  		});
  }, function(error) {
  		console.error("Error finding CircuitStarted " + error.code + ": " + error.message);
  });
});

