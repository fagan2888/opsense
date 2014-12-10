var hash = {};
var features = [];
var qualifiers = [];
var count = 0;
var sp = ",";
db.pairCollection.aggregate([
    { $group: { _id: {$concat: [ "$adjetive", " ", "$noun" ]}, Count: {$sum:1} }},
    { $sort: { Count: -1}},
    { $limit: 100 }
]).result.forEach(function(item){
    hash[item._id] = count;
    var feature =  item._id.split(" ");
    features.push(feature[1]);
    qualifiers.push(feature[0]);
    count++;
});

(function a(){
    features = features.filter( function onlyUnique(value, index, self) {  return self.indexOf(value) === index;} ); 
    qualifiers = qualifiers.filter( function onlyUnique(value, index, self) {  return self.indexOf(value) === index;} ); 
})();

var head = "review" + sp + "rating"; 
qualifiers.forEach(function(item){
    head += sp + item;
});

print(head);
db.pairCollection.aggregate([
    {$match: {noun: {$in: features}, adjetive: {$in: qualifiers}}},
    {$group: {_id: { id: "$review_id", rating: "$rating"}, grams: {$push: {$concat: [ "$adjetive", " ", "$noun" ]}}}},
    {$limit: 100}
]).result.forEach(function(item) {
    var line = [];
    item.grams.forEach(function(gr){
        line[hash[gr]] = "T";
    });
    var l = item._id.id + sp + item._id.rating;
    for(var i=0; i< qualifiers.length; i++)
    {
        if(line[i])
            l += sp + line[i];
        else
            l += sp + "F";
    }
    print(l);
})

/*db.pairCollection.find({noun: {$in: features}, adjetive: {$in: qualifiers}}).sort({review_id: 1}).forEach(function(item){
    
});*/
