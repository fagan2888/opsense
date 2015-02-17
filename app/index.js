var express = require('express');
var app = express();

app.set('port', (process.env.PORT || 8124))

var MongoClient = require('mongodb').MongoClient
app.use("/css", express.static(__dirname +'/css'));
app.use("/js", express.static(__dirname +'/js')); 
//var mongostring = 'mongodb://read:Yelp2015@ds029931-a0.mongolab.com:29931/heroku_app32907721'
var mongostring = 'mongodb://127.0.0.1:27018/Yelp'
var db = null;


function searchBusiness(db, sort, feature, qualifier, modifier, callback, col){
    if(feature && !qualifier && !modifier)
        var params = {tuples: { $elemMatch:{"feature": feature, "qualifier": { $exists: true}}}};
    else if(feature && qualifier && !modifier)
        var params = {tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier}}};
    else if(feature && qualifier && modifier)
        var params = {tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier,"modifier": modifier}}};
    
    
    var collection = db.collection(col);
    collection.find(params, {_id: 1}).sort({"votes.useful": -1}).limit(500).toArray(function(err, result){
        var ids = [];   
        for(i =0; i<result.length; i++)
        {
            ids.push(result[i]._id);

        } 
        
        if(sort == "vt")
            sort = {count: -1, "votes.useful": -1};
        else if(sort == "ra")
            sort = {count: -1," stars": 1};    
        else if(sort == "rd")
            sort = {count: -1, "stars": -1};
        
        var pipeline = [
            {$match: {"review_id" : {$in: ids}}},
            {$unwind: "$features"},
            {$match: {"features.feature.lemma": feature}},
            {$group: {
                _id: "$review_id", 
                text: {$first: "$text"}, 
                votes: {$first: "$votes"}, 
                stars: {$first: "$stars"}, 
                business: {$first: "$business"}, 
                business_id: {$first: "$business_id"}, 
                features: {$push: "$features"}
            }},
            {$project:{
                review_id:"$_id",
                _id: 0, 
                text: "$text", 
                votes: "$votes", 
                stars: "$stars", 
                business: "$business",
                business_id: "$business_id", 
                features: "$features"
            }},
            {$group: {_id: "$business_id", name: {$first:"$business"}, avg: {$avg: "$stars"}, count: {$sum:1},
                    reviews: {$push: "$$CURRENT"}
             }},
            {$sort: sort}
        ];
        
        
        db.collection('reviews_processed').aggregate(pipeline,function(err, result){
            callback(err,result);
        })
    });

    
}


function searchData(db, sort, feature, qualifier, modifier, callback, collName) {
    if(feature && !qualifier && !modifier)
        var params = {tuples: { $elemMatch:{"feature": feature, "qualifier": { $exists: true}}}};
    else if(feature && qualifier && !modifier)
        var params = {tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier}}};
    else if(feature && qualifier && modifier)
        var params = {tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier,"modifier": modifier}}};
    
    //'reviews_Top50SearchHealth'
    var collection = db.collection(collName);
    collection.find(params, {_id: 1}).sort({"votes.useful": -1}).limit(200).toArray(function(err, result){
        var ids = [];   
        for(i =0; i<result.length; i++)
        {
            ids.push(result[i]._id);
        } 
        if(sort == "vt")
            sort = {"votes.useful": -1};
        else if(sort == "ra")
            sort = {"stars": 1};    
        else if(sort == "rd")
            sort = {"stars": -1};
        
        var pipeline = [
            {$match: {"review_id" : {$in: ids}}},
            {$unwind: "$features"},
            {$match: {"features.feature.lemma": feature}},
            {$group: {
                _id: "$review_id", 
                text: {$first: "$text"}, 
                votes: {$first: "$votes"}, 
                stars: {$first: "$stars"}, 
                business: {$first: "$business"}, 
                features: {$push: "$features"}
            }},
            {$project:{
                review_id:"$_id",
                _id: 0, 
                text: "$text", 
                votes: "$votes", 
                stars: "$stars", 
                business: "$business", 
                features: "$features"
            }},
            {$sort: sort}
        ];
        
        
        db.collection('reviews_processed').aggregate(pipeline,function(err, result){
            callback(err,result);
        })
        
    });
   
}

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
        var sort = quote(request.param('s'));
        var col = request.param('col') || 'reviews_Top50SearchHealth';
        
        
        console.log("started " + new Date());
        searchData(db, sort, feature, qualifier, modifier,function(err, results){
            if(err) throw err;
            console.log("will send " + new Date());
            response.json(results);
        }, col)
	})
    
    app.get('/api/GetBusiness/', function(request, response, next) {
        var feature = quote(request.param('f'));
        var qualifier = quote(request.param('q'));
        var modifier = quote(request.param('m'));
        var sort = quote(request.param('s'));
        var col = request.param('col') || 'reviews_Top50SearchHealth';
        MongoClient.connect(mongostring, function(err, db) {
	    	if(err) throw err;
    		//db.eval("searchBusiness("+ sort +", " + feature + ", " + qualifier + ", " + modifier + ")", function(err, results){
            searchBusiness(db, sort, feature, qualifier, modifier,function(err, results){
                if(err) throw err;
                response.json(results);
                //db.close();
            }, col);
            
        });
	})
    
    app.get('/api/GetFeature/', function(request, response, next) {
        var feature = request.param('f');
        var collection = db.collection('FeatureListWithQualifers');
	      	
        collection.findOne({_id: feature}, { qualifiers: { $slice: 50 } }, function(err,results){
            response.json(results);
        })
	})

    app.get('/welcome', function(request, response, next) {
        response.sendFile(__dirname + '/welcome.html')
    })
    
    app.get('/demo', function(request, response, next) {
        response.sendFile(__dirname + '/index.html')
    })
    
    app.get('/', function(request, response, next) {
        response.sendFile(__dirname + '/index.html')
    })
    
    app.get('/unified', function(request, response, next) {
        response.sendFile(__dirname + '/unified.html')
    })
    
    app.get('/radar', function(request, response, next) {
        response.sendFile(__dirname + '/radar.html')
    })
    
    app.get('/data/:file', function(request, response, next) {
        response.sendFile(__dirname + '/'+ request.params.file +'.json')
    })
    

//Start ------------------------------------------------------------------------------------
    MongoClient.connect(mongostring, function(err, dbo) {
        if(err) throw err;
        db = dbo;
        app.listen(app.get('port'), function() {
          console.log("Node app is running at localhost:" + app.get('port'))
        })
    })


    function quote(value){
        return value;
        if(value)
            return "'" + value + "'";
        else
            return "null";
    }
    