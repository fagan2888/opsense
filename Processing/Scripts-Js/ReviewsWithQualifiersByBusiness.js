db.reviews_processed.aggregate([
    {$match: { $or: [ {CategoryFirst: "Food"}, {CategoryFirst: "Restaurants"}] }},
    {$unwind: "$features" },
    {$project: { _id: 0, review_id: "$review_id", business_id: "$business_id", feature: "$features.feature.lemma", qualifiers: "$features.qualifiers", QualyCount: { $size:  "$features.qualifiers"} }},
    {$match: {QualyCount: {$gte:1}}},
    {$group: { _id: { review_id: "$review_id", business_id: "$business_id"}}},
    {$group: { _id: "$_id.business_id", count: {$sum: 1}}},
    {$out: "RestaurantsHasQualifiersCount"}
], {allowDiskUse:true});