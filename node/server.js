var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 8123))

var MongoClient = require('mongodb').MongoClient
 


//API ------------------------------------------------------------------------------------
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
      next();
    });

	app.get('/api/GetReviews/', function(request, response, next) {
        var feature = quote(request.param('f'));
        var qualifier = quote(request.param('q'));
        var modifier = quote(request.param('m'));
        MongoClient.connect('mongodb://127.0.0.1:27017/Yelp', function(err, db) {
	    	if(err) throw err;
    		db.eval("searchData(" + feature + ", " + qualifier + ", " + modifier + ")", function(err, results){
                response.json(results);
            });
        });
	})
    
    app.get('/api/GetFeature/', function(request, response, next) {
        var feature = request.param('f');
        MongoClient.connect('mongodb://127.0.0.1:27017/Yelp', function(err, db) {
	    	if(err) throw err;
            
            var collection = db.collection('FeatureListWithQualifers');
	      	collection.findOne({_id: feature}, { qualifiers: { $slice: 50 } }, function(err,results){
                response.json(results);
            })
        });
	})
 


//Start ------------------------------------------------------------------------------------

	app.listen(app.get('port'), function() {
	  console.log("Node app is running at localhost:" + app.get('port'))
	})


    function quote(value){
        if(value)
            return "'" + value + "'";
        else
            return "null";
    }
    