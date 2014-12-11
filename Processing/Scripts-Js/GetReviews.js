var City = "Las Vegas";
var MinReviews = 50;

var selectedBusiness = [];
var garbage = db.RestaurantsHasQualifiersCount.find({count: {$gte: MinReviews}}, {_id: 1}).forEach(function(item){
    selectedBusiness.push(item._id);
    });
//Get reviews that has at least on feature with qualifiers and this feature  
db.reviews_processed.aggregate([
    {$match: { business_id: {$in: selectedBusiness}}}, //Filter
    {$unwind: "$features"},
    {$unwind: "$features.qualifiers"},
    {$group: { 
        _id: {review_id: "$review_id", feature: "$features.feature"}, 
        votes: { $first: "$votes" },
        stars: { $first: "$stars" },
        date:  { $first: "$date" },
        text:  { $first: "$text" },
        city:  { $first: "$city" },
        
        business:  { $first: "$business" },
        categories:  { $first: "$categories" },
        CategoryFirst:  { $first: "$CategoryFirst" },
        CategorySecond:  { $first: "$CategorySecond" },
        business_id: { $first: "$business_id" },
        
        feature_qualyCount: {$sum: 1},
        feature_modifier: { $first:"$feature.modifier" },
        feature_neighbors: { $push:"$feature.neighbors" },
        feature_qualifiers: {$push: "$features.qualifiers"}
    }},
    {$group: { 
        _id: "$_id.review_id", 
        votes: { $first: "$votes" },
        stars: { $first: "$stars" },
        date:  { $first: "$date" },
        text:  { $first: "$text" },
        city:  { $first: "$city" },
        
        business:  { $first: "$business" },
        categories:  { $first: "$categories" },
        CategoryFirst:  { $first: "$CategoryFirst" },
        CategorySecond:  { $first: "$CategorySecond" },
        business_id: { $first: "$business_id" },
        features_count: {$sum: 1} ,
        features: { $push: { 
            feature: "$_id.feature",
            modifier: "$feature_modifier",
            neighbors: "$feature_neighbors",
            qualifiers: "$feature_qualifiers",
            qualifiersCound: "$feature_qualyCount"}}
        
    }},
    {$out: "selectedReviews"}
], {allowDiskUse:true})