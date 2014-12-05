//Load Libs
var start = new Date();
var count = 10000000; 

var NaturalDir = '/Users/Cristian/Developer/NaturalMongoDb/natural-MongoDb/lib/natural/';
load(NaturalDir + 'index.js');

Natural.require(['TreebankWordTokenizer'])
var _tokenizer = new Natural.TreebankWordTokenizer();

//-------------------------------------------------
db.getCollection('_review').find().limit(count).forEach(function(review){
    review.words = _tokenizer.tokenize(review.text.toLowerCase());
    db.reviews.insert(review);
})

var end = new Date()
print(end-start)
print((end-start)/count + " per review")


