var feature = "bit"
var qualifier = "cold"
var modifier = "too"
var result = [];

if(feature && !qualifier && !modifier)
    var result = db.reviews_Top50Search.find({tuples: { $elemMatch:{"feature": feature}}}, {_id: 1} ).limit(10000).sort({"votes.useful": -1}).limit(100).toArray()
else if(feature && qualifier && !modifier)
    var result = db.reviews_Top50Search.find({tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier}}}, {_id: 1}).limit(10000).sort({"votes.useful": -1}).limit(100).toArray()
else if(feature && qualifier && modifier)
    var result = db.reviews_Top50Search.find({tuples: { $elemMatch:{"feature": feature,"qualifier": qualifier,"modifier": modifier}}}, {_id: 1}).limit(10000).sort({"votes.useful": -1}).limit(100).toArray()

var ids = [];   
for(i =0; i<result.length; i++)
{
    ids.push(result[i]._id);
    
} 

return db.reviews_processed.find({"review_id": {$in: ids}}).toArray()

    