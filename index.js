var express = require('express');
var MongoClient = require('mongodb').MongoClient;
var app = express();
var url = 'mongodb://localhost:27017/Yelp';


app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname+'/start.html');
})

app.get('/data/Dictionary', function (req, res) {
    MongoClient.connect(url, function(err1, db) {
        var collection = db.collection('SelectedDictionary');
        console.log(collection.collectionName );
        collection.find({}).toArray(function(err2, docs) {
            res.json(docs);
            db.close();
        });      
    });
})

app.get('/data/reviews/:business_id/:word', function (req, res) {
    MongoClient.connect(url, function(err1, db) {
        var collection = db.collection('review');
        console.log(req.params.business_id);
        collection.aggregate(
           [
             { $match: { business_id:req.params.business_id, $text: { $search: req.params.word } } }
           ], function(err, result){
               res.json(result);
           });
    });
});


app.get('/data/', function (req, res) {
    MongoClient.connect(url, function(err1, db) {
        var collection = db.collection('Matrix');
        collection.find({}).toArray(function(err2, docs) {
            res.json(docs);
            db.close();
        });      
    });
})
//db.SelectedBusiness.find().sort({Words: -1}).limit(400)
app.get('/data/Business', function (req, res) {
    MongoClient.connect(url, function(err1, db) {
        var collection = db.collection('SelectedBusiness');
        console.log(collection.collectionName );
        collection.find({}).sort({Words: -1}).limit(400).toArray(function(err2, docs) {
            res.json(docs);
            db.close();
        });      
    });
})



var server = app.listen((process.env.PORT || 5000), function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('listening at http://%s:%s', host, port)

})



// Use connect method to connect to the Server
